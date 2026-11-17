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

  const layer = document.createElement('canvas'); let tone = null, hint = '';
  const partCache = {};
  const canvasOf = (img, flipImg) => {
    const c = document.createElement('canvas'); c.width = img.naturalWidth; c.height = img.naturalHeight;
    const x = c.getContext('2d');
    if (flipImg) { x.translate(c.width, 0); x.scale(-1, 1); }
    x.drawImage(img, 0, 0); x.setTransform(1, 0, 0, 1, 0, 0);
    return [c, x];
  };
  /* Tách ảnh kính thành mặt kính và càng kính (cắt ở bản lề); đuôi càng mờ dần để trông như luồn ra sau tai */
  function glassesParts(o, img, flipImg) {
    const key = o.src + '|' + flipImg;
    if (partCache[key]) return partCache[key];
    const w = img.naturalWidth, h = img.naturalHeight, [front, fx] = canvasOf(img, flipImg);
    if (!o.temple) return (partCache[key] = { front });
    const fp = p => flipImg ? [w - p[0], p[1]] : p, hg = fp(o.temple.hinge), tp = fp(o.temple.tip), right = tp[0] > hg[0];
    const [temple, tx] = canvasOf(img, flipImg);
    if (right) { fx.clearRect(hg[0], 0, w, h); tx.clearRect(0, 0, hg[0] - 3, h); } else { fx.clearRect(0, 0, hg[0], h); tx.clearRect(hg[0] + 3, 0, w, h); }
    const g = tx.createLinearGradient(hg[0], hg[1], tp[0], tp[1]);
    g.addColorStop(0, '#000'); g.addColorStop(0.86, '#000'); g.addColorStop(1, 'rgba(0,0,0,0)');
    tx.globalCompositeOperation = 'destination-in'; tx.fillStyle = g; tx.fillRect(0, 0, w, h);
    return (partCache[key] = { front, temple });
  }
  /* Xoá phần khuyên nằm sau dái tai (vùng `hide`, toạ độ theo tỉ lệ ảnh) để khuyên trông như xỏ qua tai */
  function earringCut(o, img) {
    if (!o.hide) return img;
    if (partCache[o.src]) return partCache[o.src];
    const [c, x] = canvasOf(img, false), w = c.width, h = c.height;
    x.globalCompositeOperation = 'destination-out'; x.filter = `blur(${Math.round(w * 0.02)}px)`;
    x.beginPath(); o.hide.forEach(([px, py], n) => n ? x.lineTo(px * w, py * h) : x.moveTo(px * w, py * h)); x.closePath(); x.fill();
    return (partCache[o.src] = c);
  }

  function rgba(hex, a) { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; }

  /* Vẽ một khung hình: nguồn (video/ảnh) cắt theo crop {sx,sy,sw,sh}, flip = soi gương */
  function paint(src, sw0, sh0, crop, lm, flip) {
    hint = '';
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
      const accs = [look.eyewear, look.ear].filter(o => o && o.src);
      const imgs = accs.map(o => overlayImg(o.src));
      if (accs.length && imgs.every(im => im.complete && im.naturalWidth)) {
        // Phụ kiện vẽ lên một lớp riêng ở đúng độ phân giải của ảnh gốc rồi mới phóng lên,
        // để sản phẩm mềm nét bằng ảnh (ảnh nhỏ bị phóng to thì kính cũng mờ theo, không bị "dán" lên)
        const k = Math.max(1, W / crop.sw), lw = Math.round(W / k), lh = Math.round(H / k);
        if (layer.width !== lw || layer.height !== lh) { layer.width = lw; layer.height = lh; }
        const L = layer.getContext('2d');
        L.setTransform(1, 0, 0, 1, 0, 0); L.clearRect(0, 0, lw, lh); L.setTransform(1 / k, 0, 0, 1 / k, 0, 0);
        L.imageSmoothingQuality = 'high';

        // Hướng của đầu trong không gian 3 chiều → suy ra chỗ của tai (lưới mặt không có điểm mốc cho tai)
        const P3 = i => { const [x, y] = P(i); return [x, y, lm[i].z * sw0 / crop.sw * W]; };
        const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
        const unit = v => { const n = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / n, v[1] / n, v[2] / n]; };
        const sideV = sub(P3(454), P3(234)), downV = sub(P3(152), P3(10));
        const faceH = Math.hypot(downV[0], downV[1]);
        const sd = unit(sideV), dn = unit(downV);
        let back = unit([sideV[1] * downV[2] - sideV[2] * downV[1], sideV[2] * downV[0] - sideV[0] * downV[2], sideV[0] * downV[1] - sideV[1] * downV[0]]);
        if (back[2] < 0) back = back.map(v => -v);                        // chiều ra sau gáy
        const [nx, ny] = P(1), dR = Math.hypot(ax - nx, ay - ny), dL = Math.hypot(bx - nx, by - ny);
        const visible = sign => (sign > 0 ? dL : dR) / (dL + dR) >= 0.3;  // tai phía xa bị đầu che
        const earPt = (i, sign, b, o, d) => {
          const [x, y] = P(i);
          return [x + (back[0] * b + sd[0] * o * sign + dn[0] * d) * faceH, y + (back[1] * b + sd[1] * o * sign + dn[1] * d) * faceH];
        };
        const earRoot = sign => earPt(sign > 0 ? 356 : 127, sign, 0.14, 0.012, -0.065);   // chỗ vành tai nối vào đầu — nơi càng kính gác lên
        const lobe = sign => earPt(sign > 0 ? 323 : 93, sign, 0.09, 0.025, 0.03);         // lỗ xỏ khuyên trên dái tai

        const turned = Math.max(dL, dR) / (dL + dR) > 0.7;
        if (look.eyewear && look.eyewear.faces && !turned) hint = 'Kính này chụp nghiêng — quay mặt nghiêng một chút để thử nha';
        if (look.eyewear && look.eyewear.src && look.eyewear.eyes && (turned || !look.eyewear.faces)) {
          const o = look.eyewear, img = overlayImg(o.src), w = img.naturalWidth;
          const mid = (a, b) => { const [x1, y1] = P(a), [x2, y2] = P(b); return [(x1 + x2) / 2, (y1 + y2) / 2]; };
          const tL = mid(33, 133), tR = mid(362, 263);
          const flipImg = o.faces === (dR < dL ? 'right' : 'left');       // ảnh chụp nghiêng: lật theo hướng quay mặt
          const fp = p => flipImg ? [w - p[0], p[1]] : p;
          let e1 = fp(o.eyes[0]), e2 = fp(o.eyes[1]); if (flipImg) [e1, e2] = [e2, e1];
          const s = Math.hypot(tR[0] - tL[0], tR[1] - tL[1]) / Math.hypot(e2[0] - e1[0], e2[1] - e1[1]);
          const rot = Math.atan2(tR[1] - tL[1], tR[0] - tL[0]) - Math.atan2(e2[1] - e1[1], e2[0] - e1[0]);
          const T = p => { const dx = (p[0] - e1[0]) * s, dy = (p[1] - e1[1]) * s, c = Math.cos(rot), sn = Math.sin(rot); return [tL[0] + dx * c - dy * sn, tL[1] + dx * sn + dy * c]; };
          const parts = glassesParts(o, img, flipImg);
          if (parts.temple) {                                             // càng kính: kéo từ bản lề tới gốc tai, đuôi càng khuất sau tai
            const h = fp(o.temple.hinge), t = fp(o.temple.tip), sign = t[0] > h[0] ? 1 : -1;
            if (visible(sign)) {
              const Hc = T(h), E = earRoot(sign);
              const len = Math.hypot(E[0] - Hc[0], E[1] - Hc[1]) / Math.hypot(t[0] - h[0], t[1] - h[1]);
              L.save();
              L.translate(Hc[0], Hc[1]); L.rotate(Math.atan2(E[1] - Hc[1], E[0] - Hc[0])); L.scale(len, s);
              L.rotate(-Math.atan2(t[1] - h[1], t[0] - h[0])); L.translate(-h[0], -h[1]);
              L.drawImage(parts.temple, 0, 0);
              L.restore();
            }
          }
          L.save();
          L.translate(tL[0], tL[1]); L.rotate(rot); L.scale(s, s); L.translate(-e1[0], -e1[1]);
          L.drawImage(parts.front, 0, 0);
          L.restore();
        }
        if (look.ear && look.ear.src) {
          const o = look.ear, img = overlayImg(o.src), cut = earringCut(o, img);
          const eh = faceH * (o.size || 0.27), ew = eh * img.naturalWidth / img.naturalHeight;
          const [anx, any] = o.anchor || [0.5, 0.067];                    // điểm trên ảnh nằm ở lỗ xỏ khuyên
          [1, -1].forEach(sign => {
            if (!visible(sign)) return;
            const [lx, ly] = lobe(sign);
            L.save(); L.translate(lx, ly); L.rotate(Math.atan2(dn[1], dn[0]) - Math.PI / 2);
            if (sign < 0) L.scale(-1, 1);                                 // tai bên kia: lật ảnh cho đối xứng
            L.drawImage(cut, -ew * anx, -eh * any, ew, eh);
            L.restore();
          });
        }

        // Nhuộm nhẹ theo màu ánh sáng trên da để kim loại không lạc tông với ảnh
        if (!(tick.n = (tick.n || 0) + 1) || tick.n % 12 === 1 || !tone) {
          const [sx, sy] = P(dR < dL ? 425 : 205);
          try {
            const d = ctx.getImageData(Math.round(flip ? W - sx : sx) - 3, Math.round(sy) - 3, 7, 7).data; let r = 0, g = 0, b = 0;
            for (let q = 0; q < d.length; q += 4) { r += d[q]; g += d[q + 1]; b += d[q + 2]; }
            tone = [r, g, b].map(v => Math.round(v / (d.length / 4)));
          } catch (e) { tone = [200, 170, 150]; }
        }
        L.setTransform(1, 0, 0, 1, 0, 0); L.globalCompositeOperation = 'source-atop';
        L.fillStyle = `rgba(${tone[0]},${tone[1]},${tone[2]},.1)`; L.fillRect(0, 0, lw, lh);
        L.globalCompositeOperation = 'source-over';

        ctx.save();
        ctx.imageSmoothingQuality = 'high';
        ctx.shadowColor = 'rgba(30,15,8,.38)'; ctx.shadowBlur = faceW * 0.03; ctx.shadowOffsetY = faceW * 0.014;   // bóng đổ lên da
        ctx.drawImage(layer, 0, 0, W, H);
        ctx.restore();
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
    onStatus(lm ? hint : 'Đưa mặt vào giữa gương nha');
  }

  function drawPhoto() {
    if (!photo) return;
    paint(photo, photo.naturalWidth, photo.naturalHeight, photoCrop, photoLm, false);
    if (photoLm) onStatus(hint);
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
