/* Thử son / má / mắt trên khuôn mặt thật (camera hoặc ảnh). Mọi xử lý chạy ngay trên máy người dùng. */
(function () {
  const CDN = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14';
  const MODEL = 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task';
  const SEG_MODEL = 'https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_multiclass_256x256/float32/latest/selfie_multiclass_256x256.tflite';
  const W = 600, H = 1000;

  // chỉ số điểm mốc khuôn mặt (MediaPipe Face Mesh)
  const LIP_OUT = [61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291, 409, 270, 269, 267, 0, 37, 39, 40, 185];
  const LIP_IN = [78, 95, 88, 178, 87, 14, 317, 402, 318, 324, 308, 415, 310, 311, 312, 13, 82, 81, 80, 191];
  const EYES = [
    { lid: [33, 246, 161, 160, 159, 158, 157, 173, 133], top: [189, 221, 222, 223, 224, 225, 113] },
    { lid: [263, 466, 388, 387, 386, 385, 384, 398, 362], top: [413, 441, 442, 443, 444, 445, 342] },
  ];

  let landmarker = null, loading = null, meshConns = null, vision = null, fileset = null;
  let canvas, ctx, video, stream = null, raf = 0;
  let source = null;      // 'camera' | 'photo'
  let photo = null, photoLm = null, photoCrop = null;
  let look = {};          // {lip:{color,finish}, blush:{color}, eye:{color,shimmer}, ear:{model,color}, eyewear:{model,color}}
  let onStatus = () => {};

  function load() {
    if (landmarker) return Promise.resolve(landmarker);
    if (loading) return loading;
    loading = (async () => {
      const v = await import(CDN + '/vision_bundle.mjs');
      meshConns = v.FaceLandmarker.FACE_LANDMARKS_TESSELATION; vision = v;
      const fs = fileset = await v.FilesetResolver.forVisionTasks(CDN + '/wasm');
      const make = delegate => v.FaceLandmarker.createFromOptions(fs, {
        baseOptions: { modelAssetPath: MODEL, delegate }, runningMode: 'VIDEO', numFaces: 1,
      });
      try { landmarker = await make('GPU'); } catch (e) { landmarker = await make('CPU'); }
      return landmarker;
    })();
    loading.catch(() => { loading = null; });
    return loading;
  }

  const layer = document.createElement('canvas'); let frameNo = 0, lastTime = -1, segRuns = 0;
  const pixC = document.createElement('canvas'); pixC.width = pixC.height = 4;
  const pix = pixC.getContext('2d', { willReadFrequently: true });
  const shade = document.createElement('canvas'); let light = { set: false, key: 0 };
  const redraw = () => { if (source === 'photo') drawPhoto(); };

  /* Tách vùng tóc / da / quần áo quanh đầu — dùng để đo vị trí tai và biết tóc có phủ lên tai không */
  let segmenter = null, segLoading = null, seg = null, segNo = 0;
  const segIn = document.createElement('canvas'); segIn.width = segIn.height = 320;
  function loadSeg() {
    if (segmenter || segLoading) return;
    segLoading = load().then(() => vision.ImageSegmenter.createFromOptions(fileset, {
      baseOptions: { modelAssetPath: SEG_MODEL, delegate: 'CPU' }, runningMode: 'IMAGE', outputCategoryMask: true, outputConfidenceMasks: false,
    })).then(s => { segmenter = s; redraw(); }).catch(() => { segLoading = null; });
  }
  function runSeg(src, sw0, sh0, lm) {
    let x0 = 1, y0 = 1, x1 = 0, y1 = 0;
    lm.forEach(p => { x0 = Math.min(x0, p.x); x1 = Math.max(x1, p.x); y0 = Math.min(y0, p.y); y1 = Math.max(y1, p.y); });
    const size = 2.5 * Math.max((x1 - x0) * sw0, (y1 - y0) * sh0);
    const R = { x: (x0 + x1) / 2 * sw0 - size / 2, y: (y0 + y1) / 2 * sh0 - size / 2, size };
    const sx = segIn.getContext('2d'); sx.fillStyle = '#000'; sx.fillRect(0, 0, 320, 320);
    sx.drawImage(src, R.x, R.y, size, size, 0, 0, 320, 320);
    try {
      const res = segmenter.segment(segIn), m = res.categoryMask, data = m.getAsUint8Array().slice(), mw = m.width, mh = m.height;
      res.close();
      const hair = document.createElement('canvas'); hair.width = mw; hair.height = mh;
      const hx = hair.getContext('2d'), id = hx.createImageData(mw, mh);
      for (let i = 0; i < data.length; i++) if (data[i] !== 3) id.data[i * 4 + 3] = 255;   // mọi thứ không phải da mặt: tóc, nền, áo
      hx.putImageData(id, 0, 0);
      seg = { data, mw, mh, R, hair, src, version: ++segNo }; segRuns++;
    } catch (e) { /* giữ kết quả cũ */ }
  }

  const lumOf = hex => { const n = parseInt(hex.slice(1), 16); return (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255; };
  /* Phấn mắt màu tối thì làm đậm da; màu sáng (nhũ, champagne) thì phủ nhẹ và làm bật chỗ bắt sáng — không ép sắc độ, tránh ngả xanh trên da */
  const eyePasses = e => lumOf(e.color) < 0.55
    ? [['multiply', 0.55], ['color', 0.3]].concat(e.shimmer ? [['color-dodge', 0.25, '#8a8a8a']] : [])
    : [['soft-light', 0.75], ['source-over', 0.12]].concat(e.shimmer ? [['color-dodge', 0.4, '#9a9a9a']] : []);

  /* Tô một lớp màu mềm lên da.
     idx: các điểm mốc bao vùng tô (để tính khung); feather: độ tán viền (px); drawMask(ctx, T, col): vẽ vùng tô, col(a) là màu với độ đậm a;
     passes: [[phép trộn, độ đậm, màu riêng?]]. Mặt nạ được vẽ ở độ phân giải thấp rồi phóng lên nên viền tự mềm. */
  const layers = {}; let visTris = null;   // mỗi loại trang điểm có cặp khung vẽ riêng (mặt nạ + lớp màu)
  function softTint(kind, P, idx, feather, drawMask, passes, color, extra) {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    idx.forEach(i => { const [x, y] = P(i); x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); });
    const pad = feather * 3 + (extra || 0); x0 -= pad; y0 -= pad; x1 += pad; y1 += pad;
    const q = Math.min(1, 1 / Math.max(1, feather)), mw = Math.max(2, Math.ceil((x1 - x0) * q)), mh = Math.max(2, Math.ceil((y1 - y0) * q));
    const T2 = p => [(p[0] - x0) * q, (p[1] - y0) * q];
    ctx.save(); ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
    // Mỗi màu dùng trong các lượt trộn có một lớp riêng, vẽ thẳng bằng màu đó (không nhuộm lại sau)
    [...new Set(passes.map(p => p[2] || color))].forEach((c, n) => {
      const key = kind + n, cv = layers[key] || (layers[key] = document.createElement('canvas'));
      cv.width = mw; cv.height = mh;
      const m = cv.getContext('2d');
      drawMask(m, T2, a => rgba(c, a));
      if (visTris) {                                                 // giữ lại phần nằm trên da nhìn thấy được
        m.globalCompositeOperation = 'destination-in'; m.fillStyle = '#fff'; m.beginPath();
        for (let i = 0; i < visTris.length; i += 3) {
          const a = T2(visTris[i]), b = T2(visTris[i + 1]), d = T2(visTris[i + 2]);
          m.moveTo(a[0], a[1]); m.lineTo(b[0], b[1]); m.lineTo(d[0], d[1]); m.closePath();
        }
        m.fill(); m.globalCompositeOperation = 'source-over';
      }
      passes.forEach(([op, alpha, own]) => {
        if ((own || color) !== c) return;
        ctx.globalCompositeOperation = op; ctx.globalAlpha = alpha;
        ctx.drawImage(cv, x0, y0, x1 - x0, y1 - y0);
      });
    });
    ctx.restore();
  }

  function rgba(hex, a) { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; }

  /* Vẽ một khung hình: nguồn (video/ảnh) cắt theo crop {sx,sy,sw,sh}, flip = soi gương */
  function paint(src, sw0, sh0, crop, lm, flip) {
    ctx.save();
    if (flip) { ctx.translate(W, 0); ctx.scale(-1, 1); }
    ctx.drawImage(src, crop.sx, crop.sy, crop.sw, crop.sh, 0, 0, W, H);
    if (lm) {
      const P = i => [(lm[i].x * sw0 - crop.sx) / crop.sw * W, (lm[i].y * sh0 - crop.sy) / crop.sh * H];
      const [ax, ay] = P(234), [bx, by] = P(454);
      const faceW = Math.hypot(bx - ax, by - ay);

      // Trang điểm: mỗi lớp là một mặt nạ mềm, hoà vào da bằng hai phép trộn —
      // "multiply" (làm đậm nhưng giữ vân da và bóng đổ) và "color" (đổi sắc độ, giữ nguyên sáng tối của ảnh).
      // Nhờ vậy màu ăn theo ánh sáng thật trên mặt thay vì nằm đè lên như một miếng dán.
      // Chỉ tô trên phần da đang hướng về máy ảnh. Khi quay nghiêng, bộ nhận diện vẫn đoán vị trí của nửa mặt bị khuất
      // (mắt xa, má xa, nửa môi xa); tô lên đó thì màu tràn ra ngoài khuôn mặt.
      visTris = null;
      if (meshConns && (look.lip || look.blush || look.eye)) {
        const zk = sw0 / crop.sw * W, Q = lm.map((p, i) => { const [x, y] = P(i); return [x, y, p.z * zk]; });
        const hc = [(Q[234][0] + Q[454][0]) / 2, (Q[234][1] + Q[454][1]) / 2, (Q[234][2] + Q[454][2]) / 2];   // một điểm nằm trong đầu
        visTris = [];
        for (let t = 0; t + 2 < meshConns.length; t += 3) {
          const a = Q[meshConns[t].start], b = Q[meshConns[t + 1].start], c = Q[meshConns[t + 2].start];
          const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
          let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
          const ox = (a[0] + b[0] + c[0]) / 3 - hc[0], oy = (a[1] + b[1] + c[1]) / 3 - hc[1], oz = (a[2] + b[2] + c[2]) / 3 - hc[2];
          if (nx * ox + ny * oy + nz * oz < 0) nz = -nz;                 // lấy pháp tuyến hướng ra ngoài đầu
          if (nz / (Math.hypot(nx, ny, nz) || 1) < -0.28) visTris.push(a, b, c);   // z nhỏ = gần máy ảnh
        }
      }
      const mid2 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
      const eyeD = (() => { const a = mid2(P(33), P(133), 0.5), b = mid2(P(362), P(263), 0.5); return Math.hypot(b[0] - a[0], b[1] - a[1]); })();
      const unit = Math.max(eyeD, faceW * 0.42);          // thước đo trên mặt, không co lại quá mức khi quay nghiêng

      if (look.blush) {
        // Má hồng nằm trên gò má, kéo chếch lên phía thái dương. Hình elip dựng từ chính các điểm mốc quanh gò má
        // nên tự co theo phối cảnh khi quay mặt.
        softTint('blush', P, [50, 116, 36, 117, 123, 280, 345, 266, 346, 352], unit * 0.03, (m, T2, col) => {
          [[50, 116, 36, 117, 123], [280, 345, 266, 346, 352]].forEach(([c, t, n, e, o]) => {
            const pc = T2(P(c)), pn = T2(P(n)), pt = T2(P(t)), pe = T2(P(e)), po = T2(P(o));
            // tâm: từ giữa gò má nhích ra phía tai và lên phía đuôi mắt
            const C = [pc[0] + (po[0] - pc[0]) * 0.3 + (pe[0] - pc[0]) * 0.2, pc[1] + (po[1] - pc[1]) * 0.3 + (pe[1] - pc[1]) * 0.2];
            // trục dài chạy dọc gò má (từ cánh mũi lên thái dương); trục ngắn vuông góc với nó
            const u = [(pt[0] - pn[0]) * 0.44, (pt[1] - pn[1]) * 0.44], k = 0.6, v = [-u[1] * k, u[0] * k];
            if (Math.hypot(u[0], u[1]) < 1.5) return;
            m.save(); m.transform(u[0], u[1], v[0], v[1], C[0], C[1]);
            const g = m.createRadialGradient(0, 0, 0, 0, 0, 1);
            g.addColorStop(0, col(1)); g.addColorStop(0.45, col(0.62)); g.addColorStop(1, col(0));
            m.fillStyle = g; m.beginPath(); m.arc(0, 0, 1, 0, Math.PI * 2); m.fill(); m.restore();
          });
        }, [['multiply', 0.4], ['color', 0.24], ['source-over', 0.06]], look.blush.color, unit * 0.5);   // elip rộng hơn khung các điểm mốc
      }

      if (look.eye) {
        // Phấn mắt: đậm ở sát mí rồi nhạt dần lên hốc mắt, viền tán mềm
        softTint('eye', P, [].concat(...EYES.map(e => e.lid.concat(e.top))), unit * 0.035, (m, T2, col) => {
          EYES.forEach(e => {
            const a = T2(P(e.lid[4])), b = T2(P(e.top[3])), g = m.createLinearGradient(a[0], a[1], a[0] + (b[0] - a[0]) * 1.05, a[1] + (b[1] - a[1]) * 1.05);
            g.addColorStop(0, col(1)); g.addColorStop(0.4, col(0.7)); g.addColorStop(0.8, col(0.22)); g.addColorStop(1, col(0));
            m.fillStyle = g; m.beginPath();
            e.lid.concat(e.top).forEach((i, k) => { const [x, y] = T2(P(i)); k ? m.lineTo(x, y) : m.moveTo(x, y); });
            m.closePath(); m.fill();
          });
        }, eyePasses(look.eye), look.eye.color);
      }

      if (look.lip) {
        const gloss = look.lip.finish === 'gloss';
        softTint('lip', P, LIP_OUT, unit * 0.014, (m, T2, col) => {
          m.fillStyle = col(1); m.beginPath();
          [LIP_OUT, LIP_IN].forEach(idx => { idx.forEach((i, k) => { const [x, y] = T2(P(i)); k ? m.lineTo(x, y) : m.moveTo(x, y); }); m.closePath(); });
          m.fill('evenodd');                                             // chừa khoang miệng và răng
        }, gloss ? [['multiply', 0.42], ['color', 0.72], ['color-dodge', 0.34, '#777777']]    // son bóng: làm bật những chỗ đang bắt sáng sẵn
          : [['multiply', 0.42], ['color', 0.8]], look.lip.color);
      }

      const eyewear = look.eyewear && look.eyewear.model, earring = look.ear && look.ear.model;
      if ((eyewear || earring) && window.Wear3D) {
        loadSeg();
        if (Wear3D.ready(redraw)) {
          // Tai đứng yên so với đầu nên chỉ cần đo vài lần lúc đầu, sau đó thỉnh thoảng đo lại (bước này nặng nhất)
          const live = source === 'camera';
          if (!light.set || (live && frameNo % 45 === 0)) {   // ước lượng ánh sáng của cảnh từ chính khung hình
            try {
              pix.drawImage(src, 0, 0, sw0, sh0, 0, 0, 4, 4);
              const d = pix.getImageData(0, 0, 4, 4).data, avg = (a, b) => [0, 1, 2].map(q => { let t = 0; for (let i = a; i < b; i++) t += d[i * 4 + q]; return t / (b - a); });
              const cheek = i => { pix.drawImage(src, lm[i].x * sw0 - 5, lm[i].y * sh0 - 5, 10, 10, 0, 0, 1, 1); const c = pix.getImageData(0, 0, 1, 1).data; return 0.3 * c[0] + 0.6 * c[1] + 0.1 * c[2]; };
              const top = avg(0, 8), bottom = avg(8, 16), a = cheek(205), b = cheek(425);
              light = { set: true, top, bottom, key: Math.max(-1, Math.min(1, (b - a) / (a + b + 1) * 4)) };
            } catch (e) { light = { set: true, top: [225, 222, 218], bottom: [120, 108, 100], key: -0.3 }; }
            Wear3D.setLight(light);
          }
          if (segmenter && (live ? frameNo % (segRuns < 4 ? 6 : 90) === 0 : (!seg || seg.src !== src))) runSeg(src, sw0, sh0, lm);
          // Phụ kiện vẽ lên một lớp riêng ở đúng độ phân giải của ảnh gốc rồi mới phóng lên,
          // để sản phẩm mềm nét bằng ảnh (ảnh nhỏ bị phóng to thì kính cũng mờ theo, không bị "dán" lên)
          const k = Math.max(1, W / crop.sw), lw = Math.round(W / k), lh = Math.round(H / k);
          if (layer.width !== lw || layer.height !== lh) { layer.width = lw; layer.height = lh; }
          const L = layer.getContext('2d');
          L.setTransform(1, 0, 0, 1, 0, 0); L.clearRect(0, 0, lw, lh); L.setTransform(1 / k, 0, 0, 1 / k, 0, 0);
          L.imageSmoothingQuality = 'high';
          const zk = sw0 / crop.sw * W, pts = lm.map((p, i) => { const [x, y] = P(i); return [x, y, p.z * zk]; });
          const cx2s = x => crop.sx + x / W * crop.sw, cy2s = y => crop.sy + y / H * crop.sh;
          const segv = seg && seg.src === src ? {
            version: seg.version, step: seg.R.size / seg.mw * W / crop.sw,
            cls: (x, y) => {
              const i = Math.floor((cx2s(x) - seg.R.x) / seg.R.size * seg.mw), j = Math.floor((cy2s(y) - seg.R.y) / seg.R.size * seg.mh);
              return i < 0 || j < 0 || i >= seg.mw || j >= seg.mh ? -1 : seg.data[j * seg.mw + i];
            },
          } : null;
          const rw = live ? Math.min(720, lw) : Math.min(1600, lw * (lw < 400 ? 4 : 2)), rh = Math.round(rw * lh / lw);   // ảnh nhỏ: dựng mịn gấp 4 để nét mảnh không bị đứt khúc
          const out = Wear3D.render({
            pts, conns: meshConns, W, H, rw, rh, seg: segv, debug: !!window.__wearDebug,
            glasses: eyewear ? Object.assign({ color: look.eyewear.color }, eyewear) : null,
            earring: earring ? Object.assign({ color: look.ear.color }, earring) : null,
          });
          if (out) {
            L.drawImage(out.canvas, 0, 0, W, H);
            // Tai bị tóc phủ: càng kính chỉ lộ trên phần da, tới chân tóc thì khuất dưới tóc
            if (segv) out.ears.forEach(e => {
              if (!e.covered) return;
              L.save(); L.beginPath(); L.arc(e.c[0], e.c[1], e.r, 0, Math.PI * 2); L.clip();
              L.globalCompositeOperation = 'destination-out';
              const q = W / crop.sw;
              L.drawImage(seg.hair, (seg.R.x - crop.sx) * q, (seg.R.y - crop.sy) * q, seg.R.size * q, seg.R.size * q);
              L.restore();
            });
            // Nhuộm nhẹ theo màu ánh sáng trên da để kim loại không lạc tông với ảnh
            // Bóng đổ mềm của phụ kiện lên da: thu nhỏ lớp phụ kiện rồi phóng lại (tự mờ), lệch về phía ngược đèn
            const sw = Math.max(8, Math.round(lw / 6)), sh = Math.max(8, Math.round(lh / 6));
            if (shade.width !== sw || shade.height !== sh) { shade.width = sw; shade.height = sh; }
            const S = shade.getContext('2d');
            S.globalCompositeOperation = 'source-over'; S.clearRect(0, 0, sw, sh); S.imageSmoothingQuality = 'high'; S.drawImage(layer, 0, 0, sw, sh);
            S.globalCompositeOperation = 'source-in'; S.fillStyle = '#1c0e08'; S.fillRect(0, 0, sw, sh);
            ctx.save(); ctx.globalAlpha = 0.34; ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(shade, -light.key * faceW * 0.012, faceW * 0.018, W, H);
            ctx.restore();
            ctx.save();
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(layer, 0, 0, W, H);
            ctx.restore();
          }
        }
      }
    }
    ctx.restore();
  }

  const cover = (sw, sh) => { // cắt nguồn cho vừa khung 3:5
    const r = W / H; let cw = sw, ch = sw / r;
    if (ch > sh) { ch = sh; cw = sh * r; }
    return { sx: (sw - cw) / 2, sy: (sh - ch) / 2, sw: cw, sh: ch };
  };

  function tick() {
    raf = requestAnimationFrame(tick);
    if (!video || video.readyState < 2 || !landmarker) return;
    if (video.currentTime === lastTime) return;        // màn hình quét nhanh hơn camera: khung hình chưa đổi thì không làm lại
    lastTime = video.currentTime; frameNo++;
    let lm = null;
    try { const res = landmarker.detectForVideo(video, performance.now()); lm = res.faceLandmarks && res.faceLandmarks[0]; } catch (e) { /* bỏ qua khung lỗi */ }
    paint(video, video.videoWidth, video.videoHeight, cover(video.videoWidth, video.videoHeight), lm, true);
    onStatus(lm ? '' : 'Đưa mặt vào giữa gương nha');
  }

  function drawPhoto() {
    if (!photo) return;
    paint(photo, photo.naturalWidth, photo.naturalHeight, photoCrop, photoLm, false);
  }

  function newFace() { seg = null; segRuns = 0; light = { set: false, key: 0 }; lastTime = -1; if (window.Wear3D) Wear3D.reset(); }   // người mới: bỏ số đo tai cũ

  function stop() {
    cancelAnimationFrame(raf); raf = 0;
    if (stream) { stream.getTracks().forEach(t => t.stop()); stream = null; }
    if (video) video.srcObject = null;
    source = null;
  }

  async function startCamera() {
    stop(); newFace();
    onStatus('Đang mở camera…');
    stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 720 }, height: { ideal: 960 } }, audio: false });
    video.srcObject = stream; await video.play();
    source = 'camera';
    onStatus('Đang chuẩn bị gương…');
    await load();
    if (source === 'camera') { onStatus(''); tick(); }
  }

  async function usePhoto(file) {
    stop(); newFace();
    onStatus('Đang đọc ảnh…');
    const img = new Image();
    img.src = URL.createObjectURL(file);
    await img.decode();
    photo = img; photoLm = null; source = 'photo';
    photoCrop = cover(img.naturalWidth, img.naturalHeight);
    drawPhoto();
    onStatus('Đang tìm khuôn mặt…');
    const lmk = await load();
    let res;   // dò vài lượt liên tiếp: lượt sau bám theo lượt trước nên điểm mốc ổn định hơn
    for (let i = 0, t = performance.now(); i < 3; i++) res = lmk.detectForVideo(img, t + i * 40);
    photoLm = res.faceLandmarks && res.faceLandmarks[0] || null;
    if (photoLm) { // phóng vào khuôn mặt cho dễ nhìn
      const xs = photoLm.map(p => p.x * img.naturalWidth), ys = photoLm.map(p => p.y * img.naturalHeight);
      const fx = (Math.min(...xs) + Math.max(...xs)) / 2, fy = (Math.min(...ys) + Math.max(...ys)) / 2;
      const fh = Math.max(...ys) - Math.min(...ys);
      let ch = Math.min(img.naturalHeight, fh * 2.3), cw = ch * W / H;
      if (cw > img.naturalWidth) { cw = img.naturalWidth; ch = cw * H / W; }
      photoCrop = {
        sx: Math.max(0, Math.min(img.naturalWidth - cw, fx - cw / 2)),
        sy: Math.max(0, Math.min(img.naturalHeight - ch, fy - ch * 0.48)), sw: cw, sh: ch,
      };
    }
    drawPhoto();
    onStatus(photoLm ? '' : 'Chưa thấy khuôn mặt — thử ảnh chụp thẳng, đủ sáng nha');
  }

  window.FaceTry = {
    init(c, v, statusCb) { canvas = c; canvas.width = W; canvas.height = H; ctx = canvas.getContext('2d'); video = v; onStatus = statusCb || onStatus; },
    setLook(l) { look = l || {}; if (source === 'photo') drawPhoto(); },
    startCamera, usePhoto, stop,
    get active() { return source; },
  };
})();
