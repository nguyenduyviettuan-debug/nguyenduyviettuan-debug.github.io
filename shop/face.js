/* Thử son / má / mắt trên khuôn mặt thật (camera hoặc ảnh). Mọi xử lý chạy ngay trên máy người dùng. */
(function () {
  const CDN = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14';
  const MODEL = 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task';
  const W = 600, H = 1000;

  // chỉ số điểm mốc khuôn mặt (MediaPipe Face Mesh)
  const LIP_OUT = [61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291, 409, 270, 269, 267, 0, 37, 39, 40, 185];
  const LIP_IN = [78, 95, 88, 178, 87, 14, 317, 402, 318, 324, 308, 415, 310, 311, 312, 13, 82, 81, 80, 191];
  const EYES = [
    { lid: [33, 246, 161, 160, 159, 158, 157, 173, 133], top: [189, 221, 222, 223, 224, 225, 113] },
    { lid: [263, 466, 388, 387, 386, 385, 384, 398, 362], top: [413, 441, 442, 443, 444, 445, 342] },
  ];
  const CHEEKS = [205, 425];

  let landmarker = null, loading = null;
  let canvas, ctx, video, stream = null, raf = 0;
  let source = null;      // 'camera' | 'photo'
  let photo = null, photoLm = null, photoCrop = null;
  let look = {};          // {lip:{color,finish}, blush:{color}, eye:{color,shimmer}, ear:{src,size,anchor}, eyewear:{src,eyes,faces}}
  let onStatus = () => {};

  function load() {
    if (landmarker) return Promise.resolve(landmarker);
    if (loading) return loading;
    loading = (async () => {
      const v = await import(CDN + '/vision_bundle.mjs');
      const fs = await v.FilesetResolver.forVisionTasks(CDN + '/wasm');
      const make = delegate => v.FaceLandmarker.createFromOptions(fs, {
        baseOptions: { modelAssetPath: MODEL, delegate }, runningMode: 'VIDEO', numFaces: 1,
      });
      try { landmarker = await make('GPU'); } catch (e) { landmarker = await make('CPU'); }
      return landmarker;
    })();
    loading.catch(() => { loading = null; });
    return loading;
  }

  const overlays = {};
  function overlayImg(src) {
    if (!overlays[src]) { const im = new Image(); im.onload = () => { if (source === 'photo') drawPhoto(); }; im.src = src; overlays[src] = im; }
    return overlays[src];
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
      if (look.eyewear && look.eyewear.src && look.eyewear.eyes) {
        const img = overlayImg(look.eyewear.src);
        if (img.complete && img.naturalWidth) {
          // Khớp tâm hai tròng kính trong ảnh sản phẩm với tâm hai mắt (co giãn + xoay)
          const mid = (i, j) => { const [x1, y1] = P(i), [x2, y2] = P(j); return [(x1 + x2) / 2, (y1 + y2) / 2]; };
          const tL = mid(33, 133), tR = mid(362, 263);
          const [nx, ny] = P(1);
          const facingLeft = Math.hypot(ax - nx, ay - ny) < Math.hypot(bx - nx, by - ny);
          const w = img.naturalWidth, flip = look.eyewear.faces === (facingLeft ? 'right' : 'left');
          let [e1, e2] = look.eyewear.eyes;
          if (flip) [e1, e2] = [[w - e2[0], e2[1]], [w - e1[0], e1[1]]];
          const s = Math.hypot(tR[0] - tL[0], tR[1] - tL[1]) / Math.hypot(e2[0] - e1[0], e2[1] - e1[1]);
          const rot = Math.atan2(tR[1] - tL[1], tR[0] - tL[0]) - Math.atan2(e2[1] - e1[1], e2[0] - e1[0]);
          ctx.save();
          ctx.translate(tL[0], tL[1]); ctx.rotate(rot); ctx.scale(s, s); ctx.translate(-e1[0], -e1[1]);
          if (flip) { ctx.translate(w, 0); ctx.scale(-1, 1); }
          ctx.shadowColor = 'rgba(30,15,10,.3)'; ctx.shadowBlur = faceW * 0.02; ctx.shadowOffsetY = faceW * 0.012;
          ctx.drawImage(img, 0, 0);
          ctx.restore();
        }
      }
      if (look.ear && look.ear.src) {
        const img = overlayImg(look.ear.src);
        if (img.complete && img.naturalWidth) {
          // Lưới mặt không có tai: ước lượng dái tai từ mép hàm, đẩy ra ngoài nhiều hơn khi mặt quay nghiêng
          const [nx, ny] = P(1), [tx, ty] = P(10), [cx, cy] = P(152);
          const faceH = Math.hypot(cx - tx, cy - ty), dR = Math.hypot(ax - nx, ay - ny), dL = Math.hypot(bx - nx, by - ny);
          const ux = (bx - ax) / faceW, uy = (by - ay) / faceW;          // hướng ngang của mặt
          const vx = (cx - tx) / faceH, vy = (cy - ty) / faceH;          // hướng dọc của mặt
          const eh = faceH * (look.ear.size || 0.27), ew = eh * img.naturalWidth / img.naturalHeight;
          const [anx, any] = look.ear.anchor || [0.5, 0.067];             // điểm trên ảnh nằm ở dái tai
          [[323, dL, 1], [93, dR, -1]].forEach(([i, d, sign]) => {
            const share = d / (dL + dR);                                  // 0.5 = nhìn thẳng
            if (share < 0.3) return;                                      // tai bị khuất
            const turn = Math.min(1, Math.max(0, (share - 0.5) * 2));
            const out = faceH * (0.02 + 0.055 * turn) * sign, down = faceH * (0.07 - 0.035 * turn);
            const [x, y] = P(i);
            const lx = x + ux * out + vx * down, ly = y + uy * out + vy * down;
            ctx.save(); ctx.translate(lx, ly); ctx.rotate(Math.atan2(vy, vx) - Math.PI / 2);
            ctx.shadowColor = 'rgba(40,20,10,.35)'; ctx.shadowBlur = eh * 0.08; ctx.shadowOffsetY = eh * 0.03;
            if (sign < 0) ctx.scale(-1, 1);                              // tai bên kia: lật ảnh cho đối xứng
            ctx.drawImage(img, -ew * anx, -eh * any, ew, eh);
            ctx.restore();
          });
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
    const res = lmk.detectForVideo(img, performance.now());
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
