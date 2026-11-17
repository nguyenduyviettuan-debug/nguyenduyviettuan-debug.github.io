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
  const CHEEKS = [205, 425];

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

  const layer = document.createElement('canvas'); let tone = null, frameNo = 0;
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
      seg = { data, mw, mh, R, hair, src, version: ++segNo };
    } catch (e) { /* giữ kết quả cũ */ }
  }

  function rgba(hex, a) { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; }

  /* Vẽ một khung hình: nguồn (video/ảnh) cắt theo crop {sx,sy,sw,sh}, flip = soi gương */
  function paint(src, sw0, sh0, crop, lm, flip) {
    ctx.save();
    if (flip) { ctx.translate(W, 0); ctx.scale(-1, 1); }
    ctx.drawImage(src, crop.sx, crop.sy, crop.sw, crop.sh, 0, 0, W, H);
    if (lm) {
      const P = i => [(lm[i].x * sw0 - crop.sx) / crop.sw * W, (lm[i].y * sh0 - crop.sy) / crop.sh * H];
      const poly = idx => { idx.forEach((i, k) => { const [x, y] = P(i); k ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }); ctx.closePath(); };
      const [ax, ay] = P(234), [bx, by] = P(454);
      const faceW = Math.hypot(bx - ax, by - ay);

      if (look.blush) {
        CHEEKS.forEach(i => {
          const [x, y] = P(i), r = faceW * 0.17;
          const g = ctx.createRadialGradient(x, y, 0, x, y, r);
          g.addColorStop(0, rgba(look.blush.color, 0.42)); g.addColorStop(0.55, rgba(look.blush.color, 0.2)); g.addColorStop(1, rgba(look.blush.color, 0));
          ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
        });
      }
      if (look.eye) {
        EYES.forEach(e => {
          ctx.save();
          ctx.shadowColor = rgba(look.eye.color, 0.7); ctx.shadowBlur = faceW * 0.035;
          ctx.fillStyle = rgba(look.eye.color, look.eye.shimmer ? 0.38 : 0.46);
          ctx.beginPath(); poly(e.lid.concat(e.top)); ctx.fill();
          ctx.restore();
          if (look.eye.shimmer) {
            const [x, y] = P(e.lid[4]), [tx, ty] = P(e.top[3]);
            const g = ctx.createRadialGradient((x + tx) / 2, (y + ty) / 2, 0, (x + tx) / 2, (y + ty) / 2, faceW * 0.05);
            g.addColorStop(0, 'rgba(255,255,255,.45)'); g.addColorStop(1, 'rgba(255,255,255,0)');
            ctx.fillStyle = g; ctx.beginPath(); ctx.arc((x + tx) / 2, (y + ty) / 2, faceW * 0.05, 0, Math.PI * 2); ctx.fill();
          }
        });
      }
      if (look.lip) {
        const lips = () => { ctx.beginPath(); poly(LIP_OUT); poly(LIP_IN); };
        ctx.save();
        ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = rgba(look.lip.color, 0.62); lips(); ctx.fill('evenodd');
        ctx.globalCompositeOperation = 'source-over'; ctx.fillStyle = rgba(look.lip.color, 0.3);
        ctx.shadowColor = rgba(look.lip.color, 0.5); ctx.shadowBlur = faceW * 0.012; lips(); ctx.fill('evenodd');
        ctx.restore();
        if (look.lip.finish === 'gloss') {
          const [x1, y1] = P(14), [x2, y2] = P(17);
          const cx = (x1 + x2) / 2, cy = y1 + (y2 - y1) * 0.45, r = faceW * 0.045;
          ctx.save(); ctx.translate(cx, cy); ctx.scale(1, 0.32);
          const g = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
          g.addColorStop(0, 'rgba(255,255,255,.6)'); g.addColorStop(1, 'rgba(255,255,255,0)');
          ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill(); ctx.restore();
        }
      }
      const eyewear = look.eyewear && look.eyewear.model, earring = look.ear && look.ear.model;
      if ((eyewear || earring) && window.Wear3D) {
        loadSeg();
        if (Wear3D.ready(redraw)) {
          if (segmenter && (source === 'photo' ? (!seg || seg.src !== src) : frameNo++ % 8 === 0)) runSeg(src, sw0, sh0, lm);
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
          const rw = Math.min(1400, lw * 2), rh = Math.round(rw * lh / lw);
          const out = Wear3D.render({
            pts, conns: meshConns, W, H, rw, rh, seg: segv,
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
            if (!tone || frameNo % 12 === 1) {
              const [sx, sy] = P(425);
              try {
                const d = ctx.getImageData(Math.round(flip ? W - sx : sx) - 3, Math.round(sy) - 3, 7, 7).data; let r = 0, g = 0, b = 0;
                for (let q = 0; q < d.length; q += 4) { r += d[q]; g += d[q + 1]; b += d[q + 2]; }
                tone = [r, g, b].map(v => Math.round(v / (d.length / 4)));
              } catch (e) { tone = [200, 170, 150]; }
            }
            L.setTransform(1, 0, 0, 1, 0, 0); L.globalCompositeOperation = 'source-atop';
            L.fillStyle = `rgba(${tone[0]},${tone[1]},${tone[2]},.08)`; L.fillRect(0, 0, lw, lh);
            L.globalCompositeOperation = 'source-over';
            ctx.save();
            ctx.imageSmoothingQuality = 'high';
            ctx.shadowColor = 'rgba(30,15,8,.38)'; ctx.shadowBlur = faceW * 0.03; ctx.shadowOffsetY = faceW * 0.014;   // bóng đổ lên da
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
    let lm = null;
    try { const res = landmarker.detectForVideo(video, performance.now()); lm = res.faceLandmarks && res.faceLandmarks[0]; } catch (e) { /* bỏ qua khung lỗi */ }
    paint(video, video.videoWidth, video.videoHeight, cover(video.videoWidth, video.videoHeight), lm, true);
    onStatus(lm ? '' : 'Đưa mặt vào giữa gương nha');
  }

  function drawPhoto() {
    if (!photo) return;
    paint(photo, photo.naturalWidth, photo.naturalHeight, photoCrop, photoLm, false);
  }

  function stop() {
    cancelAnimationFrame(raf); raf = 0;
    if (stream) { stream.getTracks().forEach(t => t.stop()); stream = null; }
    if (video) video.srcObject = null;
    source = null;
  }

  async function startCamera() {
    stop();
    onStatus('Đang mở camera…');
    stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 960 }, height: { ideal: 1280 } }, audio: false });
    video.srcObject = stream; await video.play();
    source = 'camera';
    onStatus('Đang chuẩn bị gương…');
    await load();
    if (source === 'camera') { onStatus(''); tick(); }
  }

  async function usePhoto(file) {
    stop();
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
