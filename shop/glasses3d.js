/* Kính 3D: dựng gọng kính bằng hình khối thật (đơn vị mm), đặt theo tư thế đầu,
   và dùng khuôn mặt + hộp sọ + vành tai làm vật che để càng kính khuất sau tai. */
(function () {
  const THREE_URL = 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
  const IPD_MM = 63;                 // khoảng cách đồng tử trung bình, dùng để quy đổi mm ↔ điểm ảnh
  let T = null, loading = null;
  let renderer, scene, cam, group, front, occMat, faceGeo, headMesh, earMesh = [], temple = [], frameMat, lensMat, padMat;
  let builtKey = '', tris = null;

  function ready(onReady) {
    if (T) return true;
    if (!loading) loading = import(THREE_URL).then(m => { T = m; init(); if (onReady) onReady(); }).catch(() => { loading = null; });
    return false;
  }

  function init() {
    renderer = new T.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setClearColor(0x000000, 0);
    scene = new T.Scene();
    scene.add(new T.HemisphereLight(0xffffff, 0x9a8a80, 0.6));
    const key = new T.DirectionalLight(0xffffff, 4); key.position.set(-0.5, 1, 1.2); scene.add(key);
    const rim = new T.DirectionalLight(0xfff1e0, 0.9); rim.position.set(1, 0.2, 0.6); scene.add(rim);
    cam = new T.OrthographicCamera(0, 1, 0, -1, -4000, 4000);

    occMat = new T.MeshBasicMaterial({ colorWrite: false, side: T.DoubleSide });   // chỉ ghi độ sâu, không vẽ màu
    faceGeo = new T.BufferGeometry();
    faceGeo.setAttribute('position', new T.BufferAttribute(new Float32Array(478 * 3), 3));
    const face = new T.Mesh(faceGeo, occMat); face.frustumCulled = false; face.renderOrder = 0; scene.add(face);

    group = new T.Group(); group.matrixAutoUpdate = false; scene.add(group);       // hệ toạ độ đầu: x sang trái người đeo, y xuống, z ra sau gáy (mm)
    const ball = new T.SphereGeometry(1, 32, 20);
    headMesh = new T.Mesh(ball, occMat); headMesh.renderOrder = 0; group.add(headMesh);
    for (let i = 0; i < 2; i++) { earMesh[i] = new T.Mesh(ball, occMat); earMesh[i].renderOrder = 0; group.add(earMesh[i]); }

    // Môi trường phản chiếu đơn giản (trần sáng, hai mảng đèn, sàn tối) để kim loại bắt sáng như thật
    const ec = document.createElement('canvas'); ec.width = 256; ec.height = 128;
    const ex = ec.getContext('2d'), gr = ex.createLinearGradient(0, 0, 0, 128);
    gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.45, '#cfc8c2'); gr.addColorStop(0.55, '#8d857f'); gr.addColorStop(1, '#3a3431');
    ex.fillStyle = gr; ex.fillRect(0, 0, 256, 128);
    ex.fillStyle = '#ffffff'; ex.fillRect(30, 28, 46, 30); ex.fillRect(170, 22, 40, 34);
    const et = new T.CanvasTexture(ec); et.mapping = T.EquirectangularReflectionMapping; et.colorSpace = T.SRGBColorSpace;
    const pm = new T.PMREMGenerator(renderer); scene.environment = pm.fromEquirectangular(et).texture; pm.dispose(); et.dispose();
    frameMat = new T.MeshStandardMaterial({ color: 0xcdd1d5, metalness: 1, roughness: 0.24, envMapIntensity: 1.25 });
    lensMat = new T.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.12, roughness: 0.02, metalness: 0, envMapIntensity: 1.6, depthWrite: false, side: T.DoubleSide });
    padMat = new T.MeshStandardMaterial({ color: 0xf4f1ec, transparent: true, opacity: 0.75, roughness: 0.3 });
    front = new T.Group(); group.add(front);
  }

  const V = (x, y, z) => new T.Vector3(x, y, z);
  const tube = (pts, r, closed) => {
    const m = new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts, !!closed, 'catmullrom', 0.5), closed ? 120 : 40, r, 10, !!closed), frameMat);
    m.renderOrder = 1; return m;
  };

  /* Mặt kính: hai vành tròng, tròng, cầu mũi, đệm mũi, đầu càng — theo kích thước sản phẩm */
  function buildFront(d) {
    front.clear();
    const a = d.lensW / 2, b = d.lensH / 2, cx = a + d.bridge / 2, z0 = -4, n = d.square || 3.2;
    const sp = v => Math.sign(v) * Math.pow(Math.abs(v), 2 / n);
    [-1, 1].forEach(sg => {
      const ring = [], shape = new T.Shape();
      for (let i = 0; i < 72; i++) {
        const t = i / 72 * Math.PI * 2, ux = sp(Math.cos(t)), uy = sp(Math.sin(t));
        const x = sg * cx + a * ux * (1 - (d.taper || 0.1) * uy) + sg * a * 0.04 * uy, y = b * uy;   // đáy tròng hẹp hơn đỉnh
        ring.push(V(x, y, z0)); i ? shape.lineTo(x, y) : shape.moveTo(x, y);
      }
      front.add(tube(ring, d.rim || 0.9, true));
      const lens = new T.Mesh(new T.ShapeGeometry(shape), lensMat); lens.position.z = z0; lens.renderOrder = 2; front.add(lens);
      // đệm mũi + tay đệm
      const pad = V(sg * 7.6, b * 0.42, z0 + 7.5);
      front.add(tube([V(sg * (d.bridge / 2 + 1.2), b * 0.2, z0), V(sg * (d.bridge / 2 - 1), b * 0.36, z0 + 4), pad], 0.45));
      const pm = new T.Mesh(new T.SphereGeometry(1, 16, 12), padMat); pm.scale.set(1.5, 3.6, 2.4); pm.position.copy(pad); pm.renderOrder = 1; front.add(pm);
      // đầu càng: từ góc trên ngoài của tròng ra bản lề
      const ey = -b * 0.55, ex = cx + a;
      front.add(tube([V(sg * (ex - 1.5), ey, z0), V(sg * (ex + 3.5), ey, z0 + 0.5), V(sg * (ex + 5.5), ey, z0 + 3), V(sg * (ex + 6), ey, z0 + 7)], 1.05));
    });
    front.add(tube([V(-d.bridge / 2 - 0.6, -b * 0.42, z0), V(0, -b * 0.52, z0 - 0.8), V(d.bridge / 2 + 0.6, -b * 0.42, z0)], d.rim || 0.9));   // cầu mũi
    front.position.y = 4;      // tâm tròng thấp hơn đồng tử vài mm, lông mày nằm ngang vành trên
    front.rotation.x = 0.13;   // mặt kính ngả nhẹ vào má như khi đeo thật
    front.updateMatrix();
    const b2 = d.lensH / 2;
    return [-1, 1].map(sg => V(sg * (cx + a + 6), -b2 * 0.55, z0 + 7).applyMatrix4(front.matrix));   // vị trí hai bản lề
  }

  /* pts: 478 điểm mốc [x, y, z] theo điểm ảnh của khung vẽ (z cùng thang với x, lớn = xa máy ảnh)
     conns: danh sách cạnh lưới mặt của MediaPipe (cứ 3 cạnh liên tiếp là một tam giác)
     Trả về canvas WebGL đã vẽ, hoặc null nếu chưa sẵn sàng. */
  function render(pts, conns, W, H, rw, rh, o) {
    if (!T) return null;
    if (!tris && conns) {
      const idx = [];
      for (let i = 0; i + 2 < conns.length; i += 3) idx.push(conns[i].start, conns[i + 1].start, conns[i + 2].start);
      faceGeo.setIndex(idx); tris = true;
    }
    // sang hệ toạ độ dựng hình: y hướng lên, z hướng về máy ảnh
    const w = i => V(pts[i][0], -pts[i][1], -pts[i][2]);

    // Hệ trục của đầu
    const X = w(454).sub(w(234)).normalize();
    const Z = X.clone().cross(w(152).sub(w(10))).normalize();          // ra sau gáy
    const Y = Z.clone().cross(X).normalize();                          // xuống cằm
    const pR = w(33).add(w(133)).multiplyScalar(0.5), pL = w(362).add(w(263)).multiplyScalar(0.5);   // tâm hai mắt (giữa hai khoé mắt — ổn định hơn điểm mốc đồng tử khi quay nghiêng)
    const s = pR.distanceTo(pL) / IPD_MM;                              // điểm ảnh trên mỗi mm
    const O = pR.clone().add(pL).multiplyScalar(0.5);
    O.addScaledVector(Z, w(168).sub(O).dot(Z));                        // gốc: giữa hai mắt, sâu ngang sống mũi
    const toHead = p => { const v = p.clone().sub(O); return V(v.dot(X) / s, v.dot(Y) / s, v.dot(Z) / s); };
    // Lưới khuôn mặt làm vật che, lùi vào trong 3 mm để gọng kính nằm sát da không bị cắt lẹm
    const pos = faceGeo.attributes.position, bk = Z.clone().multiplyScalar(3 * s);
    for (let i = 0; i < 478; i++) pos.setXYZ(i, pts[i][0] + bk.x, -pts[i][1] + bk.y, -pts[i][2] + bk.z);
    pos.needsUpdate = true;
    group.matrix.makeBasis(X, Y, Z).scale(V(s, s, s)).setPosition(O);
    group.matrixWorldNeedsUpdate = true;

    const key = JSON.stringify(o);
    let hinges = front.userData.hinges;
    if (key !== builtKey) {
      hinges = front.userData.hinges = buildFront(o); builtKey = key;
      frameMat.color.set(o.frame || '#cdd1d5');
    }

    // Gốc vành tai (nơi càng kính gác lên) suy từ mép khuôn mặt + nhân trắc học
    const ears = [[127, -1], [356, 1]].map(([i, sg]) => {
      const e = toHead(w(i)); e.x = sg * Math.max(Math.abs(e.x) + 2, Math.abs(hinges[0].x) + 1); e.y -= 12; e.z += 26; return e;
    });
    ears.forEach((e, k) => {
      const sg = k ? 1 : -1;
      earMesh[k].position.set(e.x + sg * 5, e.y + 24, e.z + 12); earMesh[k].scale.set(8, 31, 18);
      if (temple[k]) { group.remove(temple[k]); temple[k].geometry.dispose(); }
      const h = hinges[k];
      // càng kính phải ôm ngoài thái dương: lấy mép khuôn mặt (thái dương, gò má) làm mốc rồi đi ra ngoài thêm vài mm
      const side = [[k ? 356 : 127, 0], [k ? 454 : 234, 0]].map(([i]) => toHead(w(i)));
      const out = Math.max(Math.abs(h.x), Math.abs(side[0].x) + 3.5, Math.abs(side[1].x) + 2);
      e.x = sg * Math.max(Math.abs(e.x), out);
      const zt = Math.min(Math.max(side[0].z, h.z + 12), e.z - 12);
      temple[k] = tube([h, V(sg * (Math.abs(h.x) + (out - Math.abs(h.x)) * 0.6), h.y + (e.y - h.y) * 0.2, h.z + (zt - h.z) * 0.5),
        V(sg * out, h.y + (e.y - h.y) * 0.5, zt), e,
        V(e.x - sg * 1, e.y + 11, e.z + 13), V(e.x - sg * 3, e.y + 30, e.z + 18)], 1.0);
      group.add(temple[k]);
    });
    const rx = Math.min(Math.abs(ears[0].x), Math.abs(ears[1].x)) - 3;
    headMesh.position.set(0, 12, 102); headMesh.scale.set(rx, 120, 104);

    cam.right = W; cam.bottom = -H; cam.updateProjectionMatrix();
    renderer.setSize(rw, rh, false);
    renderer.render(scene, cam);
    return renderer.domElement;
  }

  window.Glasses3D = { ready, render };
})();
