(function () {
  const $ = s => document.querySelector(s);
  const P = Object.fromEntries(PRODUCTS.map(p => [p.id, p]));
  const vnd = n => n.toLocaleString('vi-VN') + '₫';
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const COSMETIC = ['lip', 'blush', 'eye'], FACE_SLOTS = COSMETIC.concat(['eyewear', 'ear', 'hat']);
  const TONE_NAME = { light: 'da sáng', medium: 'da trung bình', tan: 'da ngăm' };
  const VB = { body: [-42, 0, 384, 640], face: [93, 14, 114, 190] };

  const store = { get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch (e) { return d; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { } } };

  const S = {
    tone: store.get('tt_tone', 'medium'),
    wearing: {},              // slot -> {id, v}
    sel: null,                // sản phẩm đang xem
    pick: {},                 // id -> chỉ số màu đang chọn
    cart: store.get('tt_cart', []).filter(c => P[c.id] && P[c.id].variants[c.v]),
    mode: 'model', zoom: 'body', set: null,
  };

  const avatar = $('#avatar'), bubble = $('#bubble');
  const slotOf = p => Avatar.slotOf(p.shape);
  const say = html => { bubble.innerHTML = html; bubble.scrollTop = 0; };
  let toastT;
  const toast = t => { const el = $('#toast'); el.textContent = t; el.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove('show'), 1600); };

  /* ───── Kệ hàng ───── */
  function buildStore() {
    $('#store').innerHTML = SHELVES.map(sh => {
      const items = PRODUCTS.filter(p => p.cat === sh.cat);
      const maxH = sh.kind === 'rail' ? (sh.cat === 'dress' || sh.cat === 'bottom' ? 220 : 160) : 108;
      let tallest = 0;
      const cells = items.map(p => {
        const v = p.variants[S.pick[p.id] || 0];
        const t = Avatar.thumb(p, v.color, 104, maxH); tallest = Math.max(tallest, t.h);
        return `<button class="item" data-id="${p.id}" aria-label="Thử ${esc(p.name)}, ${vnd(p.price)}">
          <span class="stage">${t.svg}</span>
          <span class="tag"><span class="n">${esc(p.name)}</span><span class="p">${vnd(p.price)}</span>
          <span class="dots">${p.variants.map(x => `<i style="background:${x.color}"></i>`).join('')}</span></span></button>`;
      }).join('');
      return `<div class="shelf-head"><h2 class="serif">${sh.title}</h2><p>${sh.sub}</p></div>
        <div class="shelf ${sh.kind}"><div class="track" style="--h:${Math.ceil(tallest) + 22}px">${cells}</div></div>`;
    }).join('');
  }
  function refreshThumb(p) {
    const el = document.querySelector(`.item[data-id="${p.id}"] .stage`);
    if (!el) return;
    const sh = SHELVES.find(s => s.cat === p.cat);
    const maxH = sh.kind === 'rail' ? (sh.cat === 'dress' || sh.cat === 'bottom' ? 220 : 160) : 108;
    el.innerHTML = Avatar.thumb(p, p.variants[S.pick[p.id] || 0].color, 104, maxH).svg;
  }

  /* ───── Gương ───── */
  let vbNow = VB.body.slice(), vbRaf = 0;
  function zoomTo(name) {
    S.zoom = name;
    $('#zoomBtn').textContent = name === 'face' ? 'Toàn thân' : 'Cận mặt';
    const from = vbNow.slice(), to = VB[name], t0 = performance.now();
    cancelAnimationFrame(vbRaf);
    if (matchMedia('(prefers-reduced-motion:reduce)').matches) { vbNow = to.slice(); avatar.setAttribute('viewBox', vbNow.join(' ')); return; }
    (function step(now) {
      const k = Math.min(1, (now - t0) / 380), e = 1 - Math.pow(1 - k, 3);
      vbNow = from.map((f, i) => f + (to[i] - f) * e);
      avatar.setAttribute('viewBox', vbNow.map(n => n.toFixed(2)).join(' '));
      if (k < 1) vbRaf = requestAnimationFrame(step);
    })(t0);
  }

  function resolved() {
    const out = {};
    for (const [slot, w] of Object.entries(S.wearing)) {
      const p = P[w.id], v = p.variants[w.v];
      out[slot] = { shape: p.shape, color: v.color, finish: p.finish, shimmer: p.shimmer };
    }
    return out;
  }

  function render() {
    const r = resolved();
    avatar.innerHTML = Avatar.render(r, S.tone);
    FaceTry.setLook({ lip: r.lip, blush: r.blush, eye: r.eye });
    document.querySelectorAll('.item').forEach(el => {
      const p = P[el.dataset.id], w = S.wearing[slotOf(p)];
      el.classList.toggle('on', !!w && w.id === p.id);
    });
    document.querySelectorAll('.tone').forEach(b => b.setAttribute('aria-pressed', b.dataset.tone === S.tone));
    const worn = Object.entries(S.wearing);
    $('#worn').innerHTML = worn.map(([slot, w]) => {
      const p = P[w.id];
      return `<button class="chip" data-off="${slot}" aria-label="Bỏ ${esc(p.name)}"><i style="background:${p.variants[w.v].color}"></i>${esc(p.name)} <span>×</span></button>`;
    }).join('');
    $('#resetBtn').hidden = !worn.length;
    renderBar();
  }

  function setMode(mode) {
    S.mode = mode;
    $('#modeModel').setAttribute('aria-pressed', mode === 'model');
    $('#modeFace').setAttribute('aria-pressed', mode === 'face');
    const face = mode === 'face';
    avatar.hidden = face;
    $('#zoomBtn').hidden = face;
    document.querySelector('.tones').hidden = face;
    if (face) {
      $('#faceCanvas').hidden = !FaceTry.active;
      $('#faceStart').hidden = !!FaceTry.active;
      if (!FaceTry.active) say('Bật camera hoặc chọn một tấm ảnh chụp thẳng mặt. Xong rồi chạm thỏi son, hộp má hay bảng mắt nào trên kệ là màu lên mặt bạn liền.');
    } else {
      FaceTry.stop();
      $('#faceCanvas').hidden = true; $('#faceStart').hidden = true; $('#mirrorMsg').hidden = true;
    }
  }

  function faceError(e, viaCamera) {
    $('#faceStart').hidden = false; $('#faceCanvas').hidden = true; $('#mirrorMsg').hidden = true;
    FaceTry.stop();
    const denied = e && (e.name === 'NotAllowedError' || e.name === 'NotFoundError' || e.name === 'NotReadableError');
    say(viaCamera && denied
      ? 'Mây chưa mở được camera (chưa được cấp quyền hoặc máy không có camera). Bạn chọn một tấm ảnh thay thế nha.'
      : 'Chưa tải được bộ nhận diện khuôn mặt. Bạn kiểm tra mạng rồi thử lại, hoặc thử trên người mẫu trước nha.');
  }

  /* ───── Thử đồ ───── */
  function toneNote(p, vi) {
    const v = p.variants[vi];
    if (!v.tones) return '';
    if (S.mode === 'face') return '';
    if (v.tones.includes(S.tone)) return ` Màu <b>${esc(v.name)}</b> hợp ${TONE_NAME[S.tone]} lắm đó.`;
    const alt = p.variants.find(x => x.tones && x.tones.includes(S.tone));
    return alt ? ` Với ${TONE_NAME[S.tone]}, bạn thử thêm màu <b>${esc(alt.name)}</b> xem — sẽ tươi hơn.` : '';
  }

  function tryOn(id, vi, quiet) {
    const p = P[id], slot = slotOf(p);
    if (vi == null) vi = S.pick[id] || 0;
    S.pick[id] = vi;
    if (slot === 'dress') { delete S.wearing.top; delete S.wearing.bottom; }
    if (slot === 'top' || slot === 'bottom') delete S.wearing.dress;
    S.wearing[slot] = { id, v: vi };
    refreshThumb(p);
    if (quiet) return;
    S.sel = id; S.set = null;
    if (COSMETIC.includes(slot)) {
      if (S.mode === 'model') zoomTo('face');
    } else {
      if (S.mode === 'face') { setMode('model'); toast('Quần áo thử trên người mẫu nha'); }
      zoomTo(FACE_SLOTS.includes(slot) ? 'face' : 'body');
    }
    say(esc(p.tip) + toneNote(p, vi));
    render();
  }

  function takeOff(slot) {
    const w = S.wearing[slot];
    delete S.wearing[slot];
    if (w && S.sel === w.id) S.sel = null;
    render();
  }

  /* ───── Thẻ sản phẩm ───── */
  function renderBar() {
    const bar = $('#pbar'), box = $('#pbarIn');
    if (S.set) {
      const items = S.set.items, total = items.reduce((s, c) => s + P[c.id].price, 0);
      box.innerHTML = `<div class="info"><div class="name">Set “${esc(S.set.name)}” · ${items.length} món</div><div class="price">${vnd(total)} <small>giá tham khảo</small></div></div>
        <div class="acts"><button class="btn sm" data-act="addset">Thêm cả set vào giỏ</button></div>`;
      bar.classList.add('show'); return;
    }
    const p = S.sel && P[S.sel];
    if (!p) { bar.classList.remove('show'); return; }
    const vi = S.pick[p.id] || 0, slot = slotOf(p), on = S.wearing[slot] && S.wearing[slot].id === p.id;
    box.innerHTML = `<div class="info"><div class="name">${esc(p.name)}</div><div class="price">${vnd(p.price)} <small>· ${esc(p.variants[vi].name)}</small></div></div>
      <div class="acts">${on ? `<button class="btn sm ghost" data-act="off">Bỏ thử</button>` : ''}<button class="btn sm" data-act="add">Thêm vào giỏ</button></div>
      <div class="sw" role="group" aria-label="Chọn màu">${p.variants.map((v, i) =>
        `<button data-v="${i}" aria-pressed="${i === vi}"><i style="background:${v.color}"></i>${esc(v.name)}</button>`).join('')}</div>`;
    bar.classList.add('show');
  }

  /* ───── Giỏ hàng ───── */
  function addToCart(id, v) {
    if (S.cart.some(c => c.id === id && c.v === v)) return false;
    S.cart.push({ id, v }); store.set('tt_cart', S.cart); renderCartCount(); return true;
  }
  function renderCartCount() { $('#cartCount').textContent = S.cart.length; }
  function buyLinks(p, v) {
    const q = encodeURIComponent((p.kw || p.name) + ' ' + v.name.toLowerCase());
    const l = p.links || {};
    return `<a class="btn sm" target="_blank" rel="noopener sponsored" href="${esc(l.shopee || 'https://shopee.vn/search?keyword=' + q)}">${l.shopee ? 'Mua trên Shopee' : 'Tìm trên Shopee'}</a>
      <a class="btn sm dark" target="_blank" rel="noopener sponsored" href="${esc(l.tiktok || 'https://www.tiktok.com/search?q=' + q)}">${l.tiktok ? 'Mua trên TikTok Shop' : 'Tìm trên TikTok'}</a>`;
  }
  function renderCart() {
    const body = $('#cartBody'), foot = $('#cartFoot');
    if (!S.cart.length) {
      body.innerHTML = `<p class="empty">Giỏ còn trống. Dạo một vòng, thử vài món rồi bỏ vào đây nha.</p>`;
      foot.hidden = true; return;
    }
    body.innerHTML = S.cart.map((c, i) => {
      const p = P[c.id], v = p.variants[c.v], t = Avatar.thumb(p, v.color, 44, 44);
      return `<div class="row"><div class="th">${t.svg}</div>
        <div><div class="nm">${esc(p.name)}</div><div class="vr">${esc(v.name)} · ${vnd(p.price)}</div></div>
        <button class="rm" data-rm="${i}">Bỏ</button>
        <div class="buy">${buyLinks(p, v)}</div></div>`;
    }).join('') + `<p class="note">Mỗi món mua trực tiếp trên sàn qua nút bên dưới tên món. Giá tại tiệm là giá tham khảo; một số là link tiếp thị liên kết.</p>`;
    foot.hidden = false;
    foot.innerHTML = `<div class="total"><small>Tạm tính ${S.cart.length} món</small><b>${vnd(S.cart.reduce((s, c) => s + P[c.id].price, 0))}</b></div>
      <button class="btn ghost sm" data-wearcart>Mặc thử cả giỏ</button>`;
  }

  /* ───── Tư vấn set đồ ───── */
  const QUIZ = [
    { key: 'occ', q: 'Bạn sắm đồ cho dịp nào?', opts: Object.entries(LOOKS).map(([k, l]) => ({ v: k, t: l.name })) },
    { key: 'tone', q: 'Tông da của bạn gần với màu nào nhất?', opts: [
      { v: 'light', t: 'Da sáng', c: Avatar.SKIN.light }, { v: 'medium', t: 'Da trung bình', c: Avatar.SKIN.medium }, { v: 'tan', t: 'Da ngăm', c: Avatar.SKIN.tan }] },
    { key: 'budget', q: 'Ngân sách cho cả set khoảng bao nhiêu?', opts: [
      { v: 500000, t: 'Dưới 500.000₫' }, { v: 1000000, t: 'Dưới 1.000.000₫' }, { v: Infinity, t: 'Thoải mái, đẹp là được' }] },
  ];
  let quizAns = {}, quizStep = 0;
  function renderQuiz() {
    const st = QUIZ[quizStep];
    $('#quizBody').innerHTML = `<div class="steps">${QUIZ.map((_, i) => `<i class="${i <= quizStep ? 'done' : ''}"></i>`).join('')}</div>
      <p class="q">${st.q}</p><div class="opts">${st.opts.map((o, i) =>
        `<button data-opt="${i}">${o.c ? `<i style="background:${o.c}"></i>` : ''}${o.t}</button>`).join('')}</div>`;
  }
  function buildLook({ occ, tone, budget }) {
    const look = LOOKS[occ], items = []; let total = 0;
    for (const spec of look.items) {
      const [id, vName] = spec.split(':'), p = P[id];
      if (!p) continue;
      let v = vName ? p.variants.findIndex(x => x.name === vName) : -1;
      if (v < 0) v = p.variants.findIndex(x => x.tones && x.tones.includes(tone));
      if (v < 0) v = 0;
      if (total + p.price > budget) continue;
      items.push({ id, v }); total += p.price;
    }
    return { name: look.name, say: look.say, items, total };
  }
  function applyLook(look, tone) {
    S.tone = tone; store.set('tt_tone', tone);
    S.wearing = {}; S.sel = null;
    look.items.forEach(c => tryOn(c.id, c.v, true));
    S.set = look;
    if (S.mode === 'face') setMode('model');
    zoomTo('body');
    say(`<b>Set “${esc(look.name)}”</b> — ${esc(look.say)} Tổng ${look.items.length} món khoảng <b>${vnd(look.total)}</b>. Không ưng món nào, bạn cứ chạm món khác trên kệ để đổi.`);
    render();
  }

  /* ───── Sự kiện ───── */
  $('#store').addEventListener('click', e => { const it = e.target.closest('.item'); if (it) tryOn(it.dataset.id); });
  $('#worn').addEventListener('click', e => { const b = e.target.closest('[data-off]'); if (b) takeOff(b.dataset.off); });
  $('#pbarIn').addEventListener('click', e => {
    const sw = e.target.closest('[data-v]'), act = e.target.closest('[data-act]');
    if (sw) return tryOn(S.sel, +sw.dataset.v);
    if (!act) return;
    if (act.dataset.act === 'off') takeOff(slotOf(P[S.sel]));
    if (act.dataset.act === 'add') { const ok = addToCart(S.sel, S.pick[S.sel] || 0); toast(ok ? 'Đã thêm vào giỏ' : 'Món này có trong giỏ rồi'); }
    if (act.dataset.act === 'addset') { const n = S.set.items.filter(c => addToCart(c.id, c.v)).length; toast(n ? `Đã thêm ${n} món vào giỏ` : 'Cả set đã có trong giỏ'); S.set = null; renderBar(); }
  });
  document.querySelector('.tones').addEventListener('click', e => {
    const b = e.target.closest('.tone'); if (!b) return;
    S.tone = b.dataset.tone; store.set('tt_tone', S.tone); render();
    const p = S.sel && P[S.sel];
    if (p && COSMETIC.includes(slotOf(p))) say(esc(p.tip) + toneNote(p, S.pick[p.id] || 0));
  });
  $('#zoomBtn').onclick = () => zoomTo(S.zoom === 'face' ? 'body' : 'face');
  $('#resetBtn').onclick = () => { S.wearing = {}; S.sel = null; S.set = null; zoomTo('body'); render(); say('Rồi, mình thử lại từ đầu nha. Bạn thích món nào cứ chạm vào.'); };
  $('#modeModel').onclick = () => setMode('model');
  $('#modeFace').onclick = () => setMode('face');

  FaceTry.init($('#faceCanvas'), $('#faceVideo'), msg => { const el = $('#mirrorMsg'); el.hidden = !msg; el.textContent = msg; });
  const faceReady = () => { $('#faceStart').hidden = true; $('#faceCanvas').hidden = false; say('Lên hình rồi đó. Giờ bạn chạm son, má hồng hay phấn mắt trên kệ — màu sẽ lên thẳng mặt bạn.'); };
  $('#camBtn').onclick = async () => {
    try { $('#faceStart').hidden = true; $('#faceCanvas').hidden = false; await FaceTry.startCamera(); faceReady(); } catch (e) { faceError(e, true); }
  };
  $('#photoBtn').onclick = () => $('#photoInput').click();
  $('#photoInput').onchange = async e => {
    const f = e.target.files[0]; e.target.value = ''; if (!f) return;
    try { $('#faceStart').hidden = true; $('#faceCanvas').hidden = false; await FaceTry.usePhoto(f); faceReady(); } catch (err) { faceError(err, false); }
  };

  document.querySelectorAll('dialog').forEach(d => d.addEventListener('click', e => { if (e.target === d || e.target.closest('[data-close]')) d.close(); }));
  $('#cartBtn').onclick = () => { renderCart(); $('#cartDlg').showModal(); };
  $('#cartDlg').addEventListener('click', e => {
    const rm = e.target.closest('[data-rm]');
    if (rm) { S.cart.splice(+rm.dataset.rm, 1); store.set('tt_cart', S.cart); renderCartCount(); renderCart(); }
    if (e.target.closest('[data-wearcart]')) {
      S.wearing = {}; S.sel = null; S.set = null;
      S.cart.forEach(c => tryOn(c.id, c.v, true));
      if (S.mode === 'face') setMode('model');
      zoomTo('body'); render(); $('#cartDlg').close();
      say('Đây là cả giỏ của bạn khi lên người. Món nào cùng vị trí thì Mây mặc món thêm sau cùng.');
    }
  });
  $('#quizBtn').onclick = () => { quizAns = {}; quizStep = 0; renderQuiz(); $('#quizDlg').showModal(); };
  $('#quizBody').addEventListener('click', e => {
    const b = e.target.closest('[data-opt]'); if (!b) return;
    const st = QUIZ[quizStep]; quizAns[st.key] = st.opts[+b.dataset.opt].v;
    if (++quizStep < QUIZ.length) return renderQuiz();
    $('#quizDlg').close();
    applyLook(buildLook(quizAns), quizAns.tone);
  });

  buildStore(); renderCartCount(); render();
  say('Chào bạn, mình là <b>Mây</b>. Bạn cứ chạm món nào trên kệ là mình cho thử ngay lên gương. Chưa biết mặc gì thì bấm nút bên dưới, mình phối sẵn cả set.');
})();
