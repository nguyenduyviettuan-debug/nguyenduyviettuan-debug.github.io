/* Phụ kiện 3D đeo trên đầu: kính và khuyên tai dựng bằng hình khối thật (đơn vị mm), đặt theo tư thế đầu.
   Khuôn mặt, hộp sọ và vành tai được dựng làm vật che (chỉ ghi độ sâu) nên càng kính khuất sau tai,
   khuyên xỏ qua dái tai, ở mọi góc quay đầu. Vị trí tai được đo từ vùng da quanh tai khi có bản đồ tách vùng. */
(function () {
  const THREE_URL = 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
  const IPD_MM = 63;   // khoảng cách hai tâm mắt trung bình — thước quy đổi mm ↔ điểm ảnh
  const OVAL = [10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109];
  const SKIN = 3;   // nhãn "da mặt" của bộ tách vùng (gồm cả tai)
  let T = null, loading = null;
  let renderer, scene, cam, group, occMat, faceGeo, headMesh, metal, lensMat, glareMat, padMat;
  const G = { front: null, key: '', hinges: null, temple: [], templeKey: [] };
  const ears = [-1, 1].map(sg => ({ sg, version: -1, root: null, lobe: null, h: 62, found: false, covered: false, upper: null, slab: null, ring: null, ringKey: '' }));
  let tris = false;

  function ready(onReady) {
    if (T) return true;
    if (!loading) loading = import(THREE_URL).then(m => { T = m; init(); if (onReady) onReady(); }).catch(() => { loading = null; });
    return false;
  }

  const V = (x, y, z) => new T.Vector3(x, y, z);
  const tube = (pts, r, closed, mat) => {
    const m = new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts, !!closed, 'catmullrom', 0.5), closed ? 120 : 40, r, 10, !!closed), mat || metal);
    m.renderOrder = 1; return m;
  };
  const ball = (r, mat) => { const m = new T.Mesh(new T.SphereGeometry(r, 24, 16), mat || metal); m.renderOrder = 1; return m; };

  function init() {
    renderer = new T.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setClearColor(0x000000, 0);
    renderer.toneMapping = T.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
    scene = new T.Scene();
    cam = new T.OrthographicCamera(0, 1, 0, -1, -4000, 4000);

    // Môi trường phản chiếu kiểu phòng chụp (dải sáng mạnh trên nền tối) — thứ làm kim loại trông ra kim loại
    const ew = 128, eh = 64, d = new Float32Array(ew * eh * 4);
    for (let y = 0; y < eh; y++) for (let x = 0; x < ew; x++) {
      const t = y / (eh - 1), u = x / ew;                                   // t: 0 = dưới sàn, 1 = trần
      let v = t > 0.5 ? 0.12 + (t - 0.5) * 0.9 : 0.03 + t * 0.18;
      if (t > 0.6 && t < 0.88 && ((u > 0.06 && u < 0.2) || (u > 0.56 && u < 0.68))) v = 11;   // hai hộp đèn
      if (t > 0.5 && t < 0.54) v = 1.4;                                                       // dải sáng ngang chân trời
      if (t > 0.92) v = 1.6;                                                                   // trần sáng
      const i = (y * ew + x) * 4; d[i] = v; d[i + 1] = v * 0.98; d[i + 2] = v * 0.95; d[i + 3] = 1;
    }
    const et = new T.DataTexture(d, ew, eh, T.RGBAFormat, T.FloatType);
    et.mapping = T.EquirectangularReflectionMapping; et.colorSpace = T.LinearSRGBColorSpace;
    et.magFilter = et.minFilter = T.LinearFilter; et.needsUpdate = true;
    const pm = new T.PMREMGenerator(renderer); scene.environment = pm.fromEquirectangular(et).texture; pm.dispose(); et.dispose();
    scene.add(new T.HemisphereLight(0xffffff, 0x9a8a80, 0.5));
    const key = new T.DirectionalLight(0xffffff, 2.5); key.position.set(-0.5, 1, 1.2); scene.add(key);

    occMat = new T.MeshBasicMaterial({ colorWrite: false, side: T.DoubleSide });      // vật che: chỉ ghi độ sâu
    faceGeo = new T.BufferGeometry();
    faceGeo.setAttribute('position', new T.BufferAttribute(new Float32Array(478 * 3), 3));
    const face = new T.Mesh(faceGeo, occMat); face.frustumCulled = false; face.renderOrder = 0; scene.add(face);

    group = new T.Group(); group.matrixAutoUpdate = false; scene.add(group);          // hệ toạ độ đầu (mm): x sang bên, y xuống cằm, z ra sau gáy
    const unit = new T.SphereGeometry(1, 32, 20);
    headMesh = new T.Mesh(unit, occMat); headMesh.renderOrder = 0; group.add(headMesh);
    ears.forEach(e => {
      e.upper = new T.Mesh(unit, occMat); e.slab = new T.Mesh(unit, occMat);
      e.upper.renderOrder = e.slab.renderOrder = 0; group.add(e.upper, e.slab);
      e.ring = new T.Group(); e.ring.matrixAutoUpdate = false; scene.add(e.ring);
    });

    metal = new T.MeshStandardMaterial({ color: 0xd4d7da, metalness: 1, roughness: 0.22 });
    lensMat = new T.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.07, roughness: 0.05, depthWrite: false, side: T.DoubleSide });
    padMat = new T.MeshStandardMaterial({ color: 0xf4f1ec, transparent: true, opacity: 0.75, roughness: 0.3 });
    // vệt loá trên tròng kính
    const gc = document.createElement('canvas'); gc.width = gc.height = 64;
    const gx = gc.getContext('2d'), gg = gx.createLinearGradient(0, 64, 64, 0);
    [[0.3, 0], [0.4, 0.2], [0.47, 0.03], [0.52, 0.12], [0.58, 0], [1, 0]].forEach(([p, a]) => gg.addColorStop(p, `rgba(255,255,255,${a})`));
    gx.fillStyle = gg; gx.fillRect(0, 0, 64, 64);
    glareMat = new T.MeshBasicMaterial({ map: new T.CanvasTexture(gc), transparent: true, depthWrite: false, side: T.DoubleSide, toneMapped: false });
    G.front = new T.Group(); group.add(G.front);
  }

  /* ───────── Kính ───────── */
  function buildFront(d) {
    const front = G.front; front.clear();
    const a = d.lensW / 2, b = d.lensH / 2, cx = a + d.bridge / 2, z0 = -4, n = d.square || 3.2, rim = d.rim || 0.9;
    const sp = v => Math.sign(v) * Math.pow(Math.abs(v), 2 / n);
    [-1, 1].forEach(sg => {
      const ring = [], shape = new T.Shape();
      for (let i = 0; i < 72; i++) {
        const t = i / 72 * Math.PI * 2, ux = sp(Math.cos(t)), uy = sp(Math.sin(t));
        const x = sg * cx + a * ux * (1 - (d.taper || 0.1) * uy) + sg * a * 0.04 * uy, y = b * uy;   // đáy tròng hẹp hơn đỉnh
        ring.push(V(x, y, z0)); i ? shape.lineTo(x, y) : shape.moveTo(x, y);
      }
      front.add(tube(ring, rim, true));
      const geo = new T.ShapeGeometry(shape), uv = geo.attributes.uv, ps = geo.attributes.position;
      for (let i = 0; i < uv.count; i++) uv.setXY(i, (ps.getX(i) - sg * cx + a) / (2 * a), 1 - (ps.getY(i) + b) / (2 * b));
      [lensMat, glareMat].forEach((m, k) => { const l = new T.Mesh(geo, m); l.position.z = z0 - k * 0.05; l.renderOrder = 2 + k; front.add(l); });
      const pad = V(sg * 7.6, b * 0.42, z0 + 7.5);                                                   // đệm mũi + tay đệm
      front.add(tube([V(sg * (d.bridge / 2 + 1.2), b * 0.2, z0), V(sg * (d.bridge / 2 - 1), b * 0.36, z0 + 4), pad], 0.45));
      const pm = ball(1, padMat); pm.scale.set(1.5, 3.6, 2.4); pm.position.copy(pad); front.add(pm);
      const ey = -b * 0.55, ex = cx + a;                                                              // đầu càng tới bản lề
      front.add(tube([V(sg * (ex - 1.5), ey, z0), V(sg * (ex + 3.5), ey, z0 + 0.5), V(sg * (ex + 5.5), ey, z0 + 3), V(sg * (ex + 6), ey, z0 + 7)], 1.05));
      const hb = ball(1); hb.scale.set(1.3, 2, 1.6); hb.position.set(sg * (ex + 6), ey, z0 + 7); front.add(hb);   // khối bản lề
    });
    front.add(tube([V(-d.bridge / 2 - 0.6, -b * 0.42, z0), V(0, -b * 0.52, z0 - 0.8), V(d.bridge / 2 + 0.6, -b * 0.42, z0)], rim));   // cầu mũi
    front.position.y = 4;       // tâm tròng thấp hơn đồng tử vài mm
    front.rotation.x = 0.13;    // mặt kính ngả nhẹ vào má như khi đeo
    front.updateMatrix();
    return [-1, 1].map(sg => V(sg * (cx + a + 6), -b * 0.55, z0 + 7).applyMatrix4(front.matrix));   // hai bản lề
  }

  /* ───────── Khuyên tai — gốc toạ độ ở lỗ xỏ; x ra ngoài, y xuống, z ra sau ───────── */
  function buildEarring(m, color) {
    const g = new T.Group();
    const mt = new T.MeshStandardMaterial({ color: m.metal || '#d4d7da', metalness: 1, roughness: 0.2 });
    if (m.type === 'hoop-bow') {                    // khoen tròn ôm dái tai, đính nơ ở mặt ngoài
      const r = (m.size || 11) / 2 - 0.75;
      const ring = new T.Mesh(new T.TorusGeometry(r, 0.75, 14, 56), mt); ring.position.y = r; ring.renderOrder = 1; g.add(ring);
      const bow = new T.Group(); bow.position.set(r + 0.8, r * 0.75, 0); g.add(bow);
      const k = (m.size || 11) / 11, P2 = (z, y) => V(0, y * k, z * k);
      [-1, 1].forEach(s => {
        bow.add(tube([P2(0, 0), P2(2.8 * s, -2.5), P2(5.9 * s, -1.7), P2(6.3 * s, 0.9), P2(3.2 * s, 1.3)], 0.5, true, mt));   // cánh nơ
        bow.add(tube([P2(0, 0), P2(1.7 * s, 3.1), P2(3.3 * s, 6)], 0.5, false, mt));                                          // đuôi nơ
      });
      bow.add(ball(1.05 * k, mt));
    } else {                                        // khuyên thả: chốt, dây, hạt
      const pr = m.bead || 4, len = m.drop || 11;
      const stud = ball(1.5, mt); stud.position.set(1.3, 0, 0); g.add(stud);
      g.add(tube([V(1.3, 0.8, 0), V(1.3, len / 2, 0), V(1.3, len, 0)], 0.28, false, mt));
      const bead = ball(pr, m.beadMetal ? new T.MeshStandardMaterial({ color, metalness: 1, roughness: 0.18 })
        : new T.MeshStandardMaterial({ color, metalness: 0.15, roughness: 0.22 }));
      bead.position.set(1.3, len + pr, 0); g.add(bead);
      g.userData.hang = true;                       // khuyên thả rũ theo trọng lực chứ không cứng theo đầu
    }
    return g;
  }

  /* ───────── Hình học 2 chiều trên khung vẽ ───────── */
  const inside = (poly, x, y) => {
    let c = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const [xi, yi] = poly[i], [xj, yj] = poly[j];
      if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c;
    }
    return c;
  };
  const distPoly = (poly, x, y) => {
    let best = Infinity;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const [x1, y1] = poly[j], [x2, y2] = poly[i], dx = x2 - x1, dy = y2 - y1;
      const t = Math.max(0, Math.min(1, ((x - x1) * dx + (y - y1) * dy) / (dx * dx + dy * dy || 1)));
      best = Math.min(best, Math.hypot(x - x1 - t * dx, y - y1 - t * dy));
    }
    return best;
  };

  /* opts: { pts: 478 điểm [x, y, z] theo điểm ảnh khung vẽ (z cùng thang x, lớn = xa máy ảnh), conns: cạnh lưới mặt,
             W, H, rw, rh, glasses?, earring?, seg?: { version, step, cls(x, y) } }
     Trả về { canvas, ears: [{ c: [x, y], r, covered }] } */
  function render(o) {
    if (!T) return null;
    const pts = o.pts;
    if (!tris && o.conns) {
      const idx = [];
      for (let i = 0; i + 2 < o.conns.length; i += 3) idx.push(o.conns[i].start, o.conns[i + 1].start, o.conns[i + 2].start);
      faceGeo.setIndex(idx); tris = true;
    }
    const w = i => V(pts[i][0], -pts[i][1], -pts[i][2]);              // sang hệ dựng hình: y lên, z về phía máy ảnh
    const X = w(454).sub(w(234)).normalize();
    const Z = X.clone().cross(w(152).sub(w(10))).normalize();         // ra sau gáy
    const Y = Z.clone().cross(X).normalize();                         // xuống cằm
    const pR = w(33).add(w(133)).multiplyScalar(0.5), pL = w(362).add(w(263)).multiplyScalar(0.5);
    const s = pR.distanceTo(pL) / IPD_MM;                             // điểm ảnh trên mỗi mm
    const O = pR.clone().add(pL).multiplyScalar(0.5);
    O.addScaledVector(Z, w(168).sub(O).dot(Z));                       // gốc: giữa hai mắt, sâu ngang sống mũi
    const toHead = p => { const v = p.clone().sub(O); return V(v.dot(X) / s, v.dot(Y) / s, v.dot(Z) / s); };
    const fromHead = h => O.clone().addScaledVector(X, h.x * s).addScaledVector(Y, h.y * s).addScaledVector(Z, h.z * s);
    group.matrix.makeBasis(X, Y, Z).scale(V(s, s, s)).setPosition(O); group.matrixWorldNeedsUpdate = true;

    const pos = faceGeo.attributes.position, bk = Z.clone().multiplyScalar(3 * s);   // lưới mặt lùi vào 3 mm để gọng sát da không bị cắt lẹm
    for (let i = 0; i < 478; i++) pos.setXYZ(i, pts[i][0] + bk.x, -pts[i][1] + bk.y, -pts[i][2] + bk.z);
    pos.needsUpdate = true;

    /* ── Tai: ước lượng theo nhân trắc học, rồi đo lại từ vùng da nếu có bản đồ tách vùng ── */
    const d2 = (i, j) => Math.hypot(pts[i][0] - pts[j][0], pts[i][1] - pts[j][1]), dR = d2(1, 234), dL = d2(1, 454);   // đo trên ảnh: bên nào bị ép hẹp là bên khuất
    const poly = o.seg ? OVAL.map(i => [pts[i][0], pts[i][1]]) : null;
    const O2 = [O.x, -O.y], Xd = [X.x, -X.y], yl = Math.hypot(Y.x, Y.y), Yd = [Y.x / (yl || 1), -Y.y / (yl || 1)];
    ears.forEach(e => {
      const sg = e.sg, near = (sg > 0 ? dL : dR) / (dL + dR) >= 0.3;   // tai phía xa bị đầu che
      const estR = toHead(w(sg > 0 ? 356 : 127)).add(V(sg * 2, -12, 26));
      const estL = toHead(w(sg > 0 ? 323 : 93)).add(V(sg * 4.5, 5.5, 16.5));
      e.near = near;
      if (o.seg && near && yl > 0.35 && o.seg.version !== e.version) {
        e.version = o.seg.version;
        const wr = fromHead(estR), wl = fromHead(estL), c = [(wr.x + wl.x) / 2, -(wr.y + wl.y) / 2];
        // Trục v: dọc theo đầu (xuống cằm); trục u: vuông góc, hướng từ mặt ra phía tai
        let Ud = [-Yd[1], Yd[0]]; if ((c[0] - O2[0]) * Ud[0] + (c[1] - O2[1]) * Ud[1] < 0) Ud = [-Ud[0], -Ud[1]];
        const st = Math.max(1, o.seg.step), at = (u, v) => o.seg.cls(c[0] + Ud[0] * u + Yd[0] * v, c[1] + Ud[1] * u + Yd[1] * v);
        // Với mỗi hàng, tìm mép ngoài của da: đó là viền vành tai — đường ranh rõ nhất (bên ngoài là tóc, nền hoặc cổ)
        const rows = [];
        for (let v = -54 * s; v <= 54 * s; v += st) {
          let ub = NaN, run = 0;
          for (let u = 48 * s; u >= -30 * s; u -= st) { if (at(u, v) === SKIN) { if (++run >= 2) { ub = u + st; break; } } else run = 0; }
          rows.push([v, ub]);
        }
        let i0 = -1;
        rows.forEach((r, i) => { if (!isNaN(r[1]) && Math.abs(r[0]) < 20 * s && (i0 < 0 || Math.abs(r[0]) < Math.abs(rows[i0][0]))) i0 = i; });
        let ok = false;
        if (i0 >= 0) {
          const n4 = Math.max(1, Math.round(4 * s / st));
          const walk = dir => {            // đi dọc viền tai tới khi viền thụt vào đột ngột: hết vành tai (phía trên) hoặc hết dái tai (phía dưới)
            let i = i0, peak = rows[i0][1];
            for (;;) {
              const n = i + dir; if (n < 0 || n >= rows.length || isNaN(rows[n][1])) break;
              const back = rows[Math.min(rows.length - 1, Math.max(0, n - dir * n4))][1];
              if (rows[n][1] < back - 5 * s || rows[n][1] < peak - 20 * s) break;
              i = n; peak = Math.max(peak, rows[i][1]);
            }
            return i;
          };
          const it = walk(-1), ib = walk(1), top = rows[it][0], bot = rows[ib][0], hmm = (bot - top) / s;
          // Tai phải nhô hẳn ra ngoài đường viền khuôn mặt; nếu không thì thứ vừa dò chỉ là viền má
          const pu = OVAL.map(i => { const dx = pts[i][0] - c[0], dy = pts[i][1] - c[1]; return [dx * Ud[0] + dy * Ud[1], dx * Yd[0] + dy * Yd[1]]; });
          const ovalU = v => { let m = -Infinity; for (let i = 0, j = pu.length - 1; i < pu.length; j = i++) { const a = pu[j], b = pu[i]; if ((a[1] > v) !== (b[1] > v)) m = Math.max(m, a[0] + (b[0] - a[0]) * (v - a[1]) / (b[1] - a[1])); } return m; };
          const stick = rows.slice(it, ib + 1).map(r => r[1] - ovalU(r[0])).filter(isFinite).sort((a, b) => a - b);
          const juts = stick.length && stick[stick.length >> 1] > 8 * s;
          if (hmm > 35 && hmm < 90 && juts) {
            // Lỗ xỏ: giữa dái tai. Bề ngang dái tai nhìn thấy được tuỳ góc quay đầu (nhìn thẳng thì hẹp, nhìn nghiêng thì rộng)
            const yaw = Math.asin(Math.max(-1, Math.min(1, sg * X.z))), half = Math.max(3.5, 9 * Math.sin(yaw + 0.49));
            const il = Math.max(it, ib - Math.round(2.5 * s / st)), vl = rows[il][0] - 2.5 * s, ul = rows[il][1] - half * s;   // lỗ xỏ nằm trên đáy dái tai vài mm
            const lx = c[0] + Ud[0] * ul + Yd[0] * vl, ly = c[1] + Ud[1] * ul + Yd[1] * vl;
            const nl = toHead(V(lx, -ly, wl.z));
            // Chỗ càng kính gác lên: mép trước của vành tai ở khoảng 1/5 chiều cao tính từ đỉnh tai.
            // Dò từ viền ngoài vào trong tới khi hết da tai (gặp tóc mai). Không gặp thì suy từ dái tai theo tỉ lệ giải phẫu.
            const ir = Math.min(ib, it + Math.round(0.22 * (ib - it))), vr = rows[ir][0]; let uin = NaN;
            for (let u = rows[ir][1] - 2 * st; u > rows[ir][1] - 36 * s; u -= st) if (at(u, vr) !== SKIN) { uin = u; break; }
            let nr = nl.clone().add(V(-sg * 1, -0.74 * hmm, -5));
            if (!isNaN(uin)) {
              const ur = uin + 1.5 * s, m = toHead(V(c[0] + Ud[0] * ur + Yd[0] * vr, -(c[1] + Ud[1] * ur + Yd[1] * vr), wr.z));
              if (m.distanceTo(estR) < 40) nr = m;
            }
            const a = e.found ? 0.4 : 1;
            e.lobe = (e.found ? e.lobe : nl.clone()).lerp(nl, a); e.root = (e.found ? e.root : nr.clone()).lerp(nr, a);
            e.h += (hmm - e.h) * a; e.found = true; e.covered = false; ok = true;
            if (o.debug) e.dbg = { cand: rows.slice(it, ib + 1).map(r => [c[0] + Ud[0] * r[1] + Yd[0] * r[0], c[1] + Ud[1] * r[1] + Yd[1] * r[0]]), c, est: [[wr.x, -wr.y], [wl.x, -wl.y]] };
          }
        }
        if (!ok) e.covered = !e.found;                                // không thấy vành tai: tai bị tóc che hoặc khuất
      }
      if (!e.found) { e.root = estR; e.lobe = estL; e.h = 62; }
      const top = e.root.y - 0.23 * e.h;
      e.upper.position.set(e.root.x + sg * 2, top + 0.42 * e.h, e.root.z + 14); e.upper.scale.set(11, 0.42 * e.h, 16);   // vành tai trên: che đuôi càng kính
      e.slab.position.set(e.lobe.x, e.lobe.y - 2.5, e.lobe.z); e.slab.scale.set(2.2, 8.5, 7.5);                        // dái tai mỏng: khuyên xỏ qua
    });

    /* ── Kính ── */
    G.front.visible = !!o.glasses; G.temple.forEach(t => { if (t) t.visible = !!o.glasses; });
    if (o.glasses) {
      const key = JSON.stringify(o.glasses);
      if (key !== G.key) { G.hinges = buildFront(o.glasses); G.key = key; metal.color.set(o.glasses.frame || '#d4d7da'); }
      ears.forEach((e, k) => {
        const sg = e.sg, h = G.hinges[k], end = e.root.clone();
        const side = [k ? 356 : 127, k ? 454 : 234].map(i => toHead(w(i)));
        const out = Math.max(Math.abs(h.x), Math.abs(side[0].x) + 3.5, Math.abs(side[1].x) + 2);   // càng ôm ngoài thái dương và gò má
        end.x = sg * Math.max(Math.abs(end.x), out);
        const zt = Math.min(Math.max(side[0].z, h.z + 12), end.z - 12);
        const mid = V(sg * out, h.y + (end.y - h.y) * 0.5, zt);
        const tk = [h.x, end.x, end.y, end.z, out, zt].map(v => v.toFixed(1)).join();   // chỉ dựng lại càng khi tai hoặc bề ngang đầu đổi
        if (G.templeKey[k] === tk + key) return;
        G.templeKey[k] = tk + key;
        if (G.temple[k]) { group.remove(G.temple[k]); G.temple[k].geometry.dispose(); }
        G.temple[k] = tube([h, V(sg * (Math.abs(h.x) + (out - Math.abs(h.x)) * 0.6), h.y + (end.y - h.y) * 0.2, h.z + (zt - h.z) * 0.5),
          V(sg * out, h.y + (end.y - h.y) * 0.5, zt), mid.clone().lerp(end, 0.8), end,          // điểm kề cuối giữ càng thẳng cho tới khi chạm tai
          V(end.x, end.y + 1, end.z + 7), V(end.x - sg * 1.5, end.y + 9, end.z + 14), V(end.x - sg * 3.5, end.y + 18, end.z + 18)], 1.0);
        group.add(G.temple[k]);
      });
    }
    const rxh = Math.min(Math.abs(ears[0].root.x), Math.abs(ears[1].root.x)) - 3;
    headMesh.position.set(0, 12, 102); headMesh.scale.set(rxh, 120, 104);

    /* ── Khuyên tai ── */
    ears.forEach(e => {
      e.ring.visible = !!o.earring && e.near && !e.covered;
      if (!e.ring.visible) return;
      const key = JSON.stringify(o.earring);
      if (key !== e.ringKey) { e.ring.clear(); e.ring.add(buildEarring(o.earring, o.earring.color || '#f7f1e6')); e.ringKey = key; }
      let ax = X.clone().multiplyScalar(e.sg), ay = Y.clone(), az;
      if (e.ring.children[0].userData.hang) {                         // rũ thẳng xuống theo trọng lực (chiều dưới của ảnh)
        ay = V(0, -1, 0); ax.addScaledVector(ay, -ax.dot(ay)).normalize();
      }
      if (!e.ring.children[0].userData.hang) ax.addScaledVector(Z, -0.45).normalize();   // dái tai hơi hướng ra trước
      az = ax.clone().cross(ay).normalize(); ax = ay.clone().cross(az).normalize();
      e.ring.matrix.makeBasis(ax, ay, az).scale(V(s, s, s)).setPosition(fromHead(e.lobe)); e.ring.matrixWorldNeedsUpdate = true;
    });

    cam.right = o.W; cam.bottom = -o.H; cam.updateProjectionMatrix();
    renderer.setSize(o.rw, o.rh, false);
    renderer.render(scene, cam);
    return {
      canvas: renderer.domElement,
      ears: ears.map(e => { const p = fromHead(e.root.clone().add(e.lobe).multiplyScalar(0.5)), r = fromHead(e.root), l = fromHead(e.lobe);
        return { c: [p.x, -p.y], r: 62 * s, covered: e.covered, found: e.found, root: [r.x, -r.y], lobe: [l.x, -l.y], h: e.h, dbg: o.debug ? e.dbg : undefined }; }),
    };
  }

  const reset = () => ears.forEach(e => { e.version = -1; e.found = false; e.covered = false; e.h = 62; });
  window.Wear3D = { ready, render, reset };
})();
