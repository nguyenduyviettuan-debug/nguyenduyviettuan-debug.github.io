/* Người mẫu ảo + toàn bộ hình vẽ sản phẩm (SVG). Hệ toạ độ: 300 x 640. */
(function () {
  const SKIN = { light: '#f7d9c6', medium: '#e9bc98', tan: '#c98f68' };
  const HAIR = '#2b1d19';

  function shade(hex, amt) { // amt < 0: tối đi, > 0: sáng lên
    const n = parseInt(hex.slice(1), 16);
    const ch = [n >> 16, (n >> 8) & 255, n & 255].map(v => {
      const t = amt < 0 ? 0 : 255;
      return Math.round(v + (t - v) * Math.abs(amt));
    });
    return '#' + ch.map(v => v.toString(16).padStart(2, '0')).join('');
  }
  const lum = hex => { const n = parseInt(hex.slice(1), 16); return (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255; };
  // màu nét chi tiết: tối hơn với vải sáng, sáng hơn với vải tối
  const line = c => lum(c) > 0.35 ? shade(c, -0.22) : shade(c, 0.28);
  const mirror = s => s + `<g transform="translate(300 0) scale(-1 1)">${s}</g>`;
  const ARM = 'M105 157 L95 245 L92 316';
  const sleeve = (c, d, w) => mirror(`<path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`);

  /* Mỗi kiểu dáng: slot (vị trí trên người), draw(màu) → SVG, box = khung cắt cho ảnh trên kệ, hang = kiểu móc treo */
  const G = {
    tee: { slot: 'top', box: [78, 104, 144, 176], hang: 'top', draw: c => {
      const l = line(c);
      return sleeve(c, 'M105 156 L99 196', 27) +
        `<path d="M104 148 Q126 141 136 137 Q150 152 164 137 Q174 141 196 148 L191 264 Q150 271 109 264 Z" fill="${c}"/>
         <path d="M136 137 Q150 152 164 137" fill="none" stroke="${l}" stroke-width="2.4"/>
         <path d="M110 263 Q150 270 190 263" fill="none" stroke="${l}" stroke-width="1.2" opacity=".7"/>`;
    } },
    crop: { slot: 'top', box: [78, 104, 144, 136], hang: 'top', draw: c => {
      const l = line(c); let ribs = '';
      for (let x = 118; x <= 182; x += 8) ribs += `<path d="M${x} 150 L${x + (x < 150 ? 1 : -1)} 218" stroke="${l}" stroke-width=".8" opacity=".55"/>`;
      return sleeve(c, 'M105 155 L101 178', 26) +
        `<path d="M104 148 Q124 142 133 138 Q150 158 167 138 Q176 142 196 148 L189 220 Q150 226 111 220 Z" fill="${c}"/>${ribs}
         <path d="M133 138 Q150 158 167 138" fill="none" stroke="${l}" stroke-width="2.2"/>`;
    } },
    tank: { slot: 'top', box: [78, 104, 144, 176], hang: 'top', draw: c => {
      const l = line(c);
      return `<path d="M127 141 L131 141 Q134 170 150 174 Q166 170 169 141 L173 141 Q176 166 186 176 L189 262 Q150 269 111 262 L114 176 Q124 166 127 141 Z" fill="${c}"/>
        <path d="M131 141 Q134 170 150 174 Q166 170 169 141" fill="none" stroke="${l}" stroke-width="1.4"/>
        <path d="M122 200 Q150 214 178 200" fill="none" stroke="${shade(c, 0.35)}" stroke-width="5" opacity=".35" stroke-linecap="round"/>`;
    } },
    shirt: { slot: 'top', box: [70, 104, 160, 240], hang: 'top', draw: c => {
      const l = line(c);
      return sleeve(c, ARM, 25) + mirror(`<path d="M88 306 L98 308" stroke="${l}" stroke-width="1.4"/>`) +
        `<path d="M103 148 Q124 141 137 136 L150 150 L163 136 Q176 141 197 148 L193 276 Q150 283 107 276 Z" fill="${c}"/>
         <path d="M150 150 L150 280" stroke="${l}" stroke-width="1.3"/>
         <path d="M137 136 L150 150 L141 162 L131 141 Z M163 136 L150 150 L159 162 L169 141 Z" fill="${shade(c, lum(c) > .35 ? -.06 : .12)}" stroke="${l}" stroke-width="1"/>
         ${[176, 204, 232, 260].map(y => `<circle cx="150" cy="${y}" r="1.7" fill="${l}"/>`).join('')}
         <path d="M166 186 h14 v16 h-14 Z" fill="none" stroke="${l}" stroke-width="1"/>`;
    } },
    blazer: { slot: 'outer', box: [68, 104, 164, 252], hang: 'top', draw: c => {
      const l = line(c), lap = shade(c, lum(c) > .35 ? -.1 : .14);
      return sleeve(c, ARM, 28) +
        mirror(`<path d="M102 148 L134 136 L147 206 L143 294 L105 294 L109 236 Z" fill="${c}"/>
          <path d="M134 136 L147 206 L126 178 L132 166 L124 158 Z" fill="${lap}" stroke="${l}" stroke-width=".9"/>
          <path d="M112 252 h22" stroke="${l}" stroke-width="1.4"/>`) +
        `<circle cx="146" cy="222" r="2.6" fill="${l}"/><circle cx="145" cy="250" r="2.6" fill="${l}"/>`;
    } },
    cardigan: { slot: 'outer', box: [68, 104, 164, 240], hang: 'top', draw: c => {
      const l = line(c);
      return sleeve(c, ARM, 27) + mirror(`<path d="M86 302 L100 305" stroke="${l}" stroke-width="5" stroke-linecap="round" opacity=".5"/>`) +
        mirror(`<path d="M102 148 L132 137 Q140 180 144 214 L142 284 L106 284 L110 232 Z" fill="${c}"/>
          <path d="M132 137 Q140 180 144 214 L142 284" fill="none" stroke="${l}" stroke-width="3.4" opacity=".6"/>
          <path d="M107 279 L141 279" stroke="${l}" stroke-width="4" opacity=".5"/>`) +
        [226, 246, 266].map(y => `<circle cx="141" cy="${y}" r="2.2" fill="${shade(c, -.35)}"/>`).join('');
    } },
    jeans: { slot: 'bottom', box: [84, 214, 132, 376], hang: 'clip', draw: c => {
      const l = line(c);
      return `<path d="M112 244 L188 244 L192 300 L189 582 L154 582 L150 334 L146 582 L111 582 L108 300 Z" fill="${c}"/>
        <path d="M112 244 h76 v9 h-76 Z" fill="${shade(c, -.1)}"/>
        <path d="M150 253 L150 334 M116 258 Q122 276 136 276 M184 258 Q178 276 164 276" fill="none" stroke="${l}" stroke-width="1.2"/>
        <path d="M112 574 h33 M155 574 h33" stroke="${l}" stroke-width="1.2" stroke-dasharray="2 2"/>
        <circle cx="150" cy="248.5" r="2" fill="#d9b36a"/>`;
    } },
    wide: { slot: 'bottom', box: [78, 214, 144, 380], hang: 'clip', draw: c => {
      const l = line(c);
      return `<path d="M112 244 L188 244 L197 320 L207 586 L157 586 L150 338 L143 586 L93 586 L103 320 Z" fill="${c}"/>
        <path d="M112 244 h76 v8 h-76 Z" fill="${shade(c, lum(c) > .35 ? -.1 : .12)}"/>
        <path d="M130 254 L120 584 M170 254 L180 584" stroke="${l}" stroke-width="1" opacity=".6"/>`;
    } },
    shorts: { slot: 'bottom', box: [84, 214, 132, 148], hang: 'clip', draw: c => {
      const l = line(c);
      return `<path d="M112 244 L188 244 L195 300 L198 354 L154 354 L150 322 L146 354 L102 354 L105 300 Z" fill="${c}"/>
        <path d="M112 244 h76 v8 h-76 Z" fill="${shade(c, -.1)}"/>
        <path d="M150 252 L150 322 M117 256 Q122 272 134 272 M183 256 Q178 272 166 272" fill="none" stroke="${l}" stroke-width="1.1"/>
        <circle cx="150" cy="248" r="2" fill="${l}"/>`;
    } },
    mini: { slot: 'bottom', box: [80, 214, 140, 142], hang: 'clip', draw: c => {
      const l = line(c); let pl = '';
      for (let i = 0; i <= 8; i++) pl += `<path d="M${120 + i * 7.5} 254 L${102 + i * 12} 346" stroke="${l}" stroke-width="1" opacity=".7"/>`;
      return `<path d="M113 244 L187 244 L205 346 L95 346 Z" fill="${c}"/>${pl}
        <path d="M113 244 h74 v9 h-74 Z" fill="${shade(c, lum(c) > .35 ? -.08 : .12)}"/>`;
    } },
    midi: { slot: 'bottom', box: [72, 214, 156, 272], hang: 'clip', draw: c => {
      return `<path d="M113 244 L187 244 L211 468 Q150 482 89 468 Z" fill="${c}"/>
        <path d="M113 244 h74 v7 h-74 Z" fill="${shade(c, -.14)}"/>
        <path d="M132 262 Q124 370 112 462 M168 262 Q178 370 190 462" fill="none" stroke="${shade(c, .3)}" stroke-width="5" opacity=".28" stroke-linecap="round"/>`;
    } },
    slip: { slot: 'dress', box: [66, 104, 168, 336], hang: 'top', draw: c => {
      const l = line(c);
      return `<path d="M128 141 L131 172 M172 141 L169 172" stroke="${c}" stroke-width="2.6" stroke-linecap="round"/>
        <path d="M118 176 Q131 166 133 172 Q150 190 167 172 Q169 166 182 176 L187 250 L214 418 Q150 434 86 418 L113 250 Z" fill="${c}"/>
        <path d="M133 172 Q150 190 167 172" fill="none" stroke="${l}" stroke-width="1.2"/>
        <path d="M128 262 Q116 350 104 414 M172 262 Q184 350 196 414" fill="none" stroke="${shade(c, .35)}" stroke-width="6" opacity=".22" stroke-linecap="round"/>`;
    } },
    babydoll: { slot: 'dress', box: [62, 104, 176, 300], hang: 'top', draw: c => {
      const l = line(c);
      return mirror(`<ellipse cx="103" cy="166" rx="16" ry="20" fill="${c}"/><path d="M92 182 Q103 190 115 184" fill="none" stroke="${l}" stroke-width="1.6"/>`) +
        `<path d="M110 148 L128 142 L130 164 L170 164 L172 142 L190 148 L188 214 L112 214 Z" fill="${c}"/>
         <path d="M128 142 L130 164 L170 164 L172 142" fill="none" stroke="${l}" stroke-width="1.4"/>
         <path d="M112 210 L188 210 L216 378 Q150 392 84 378 Z" fill="${c}"/>
         <path d="M112 212 Q150 220 188 212 M98 300 Q150 312 202 300" fill="none" stroke="${l}" stroke-width="1.3"/>
         ${[126, 142, 158, 174].map(x => `<path d="M${x} 216 L${150 + (x - 150) * 1.5} 298" stroke="${l}" stroke-width=".8" opacity=".5"/>`).join('')}`;
    } },
    sneakers: { slot: 'shoes', box: [102, 566, 96, 52], hang: 'none', draw: c => {
      const l = line(c);
      return mirror(`<path d="M113 603 Q112 582 128 580 L140 580 Q146 584 146 596 L146 606 L113 606 Z" fill="${c}"/>
        <path d="M111 604 h36 v6 q0 3 -3 3 h-30 q-3 0 -3 -3 Z" fill="#fff" stroke="${shade(c, -.25)}" stroke-width=".8"/>
        <path d="M122 588 h12 M121 593 h13 M120 598 h14" stroke="${l}" stroke-width="1.2"/>`);
    } },
    heels: { slot: 'shoes', box: [102, 566, 96, 52], hang: 'none', draw: c => {
      return mirror(`<path d="M117 598 Q128 590 141 598 L143 607 Q128 615 111 609 Z" fill="${c}"/>
        <path d="M139 600 l3 13 h-3 Z" fill="${shade(c, -.25)}"/>
        <path d="M118 600 Q128 594 140 600" fill="none" stroke="${shade(c, .35)}" stroke-width="1" opacity=".6"/>`);
    } },
    boots: { slot: 'shoes', box: [98, 500, 104, 120], hang: 'none', draw: c => {
      const l = line(c);
      return mirror(`<path d="M113 524 L146 524 L147 600 L147 608 L110 608 Q108 594 114 586 Z" fill="${c}"/>
        <path d="M109 606 h39 v6 h-39 Z" fill="${shade(c, -.35)}"/>
        <path d="M113 524 h33" stroke="${l}" stroke-width="2"/><path d="M140 530 L141 598" stroke="${l}" stroke-width="1" opacity=".7"/>`);
    } },
    tote: { slot: 'bag', box: [176, 140, 84, 220], hang: 'none', draw: c => {
      const l = line(c);
      return `<path d="M197 150 Q212 220 206 286 M190 152 Q224 214 232 286" fill="none" stroke="${shade(c, -.12)}" stroke-width="3.6" stroke-linecap="round"/>
        <path d="M194 284 h50 l3 62 q0 4 -4 4 h-48 q-4 0 -4 -4 Z" fill="${c}" stroke="${l}" stroke-width="1"/>
        <path d="M210 310 q9 -9 18 0 q-9 12 -18 0 Z" fill="none" stroke="${l}" stroke-width="1.3"/>`;
    } },
    baguette: { slot: 'bag', box: [180, 136, 76, 110], hang: 'none', draw: c => {
      const l = line(c);
      return `<path d="M196 148 Q232 160 222 204 M204 150 Q214 180 204 204" fill="none" stroke="${shade(c, -.1)}" stroke-width="3" stroke-linecap="round"/>
        <path d="M196 204 Q197 198 204 198 L236 198 Q243 198 244 204 L246 226 Q246 234 238 234 L202 234 Q194 234 194 226 Z" fill="${c}" stroke="${l}" stroke-width="1"/>
        <path d="M196 208 Q220 220 244 208" fill="none" stroke="${l}" stroke-width="1.2"/><rect x="216" y="211" width="8" height="5" rx="1" fill="#d9b36a"/>`;
    } },
    sunglasses: { slot: 'eyewear', box: [116, 66, 68, 28], hang: 'none', draw: c => {
      return mirror(`<rect x="125" y="73" width="22" height="14.5" rx="4.5" fill="${c}" opacity=".9"/>
        <path d="M128 76 l6 0" stroke="#fff" stroke-width="1.4" opacity=".45" stroke-linecap="round"/>
        <path d="M125 78 L117 76" stroke="${c}" stroke-width="1.6"/>`) +
        `<path d="M147 78 Q150 75.5 153 78" fill="none" stroke="${c}" stroke-width="1.8"/>`;
    } },
    earrings: { slot: 'ear', box: [104, 82, 92, 30], hang: 'none', draw: c => {
      return mirror(`<path d="M116.5 90 v5" stroke="#d4a94e" stroke-width="1"/><circle cx="116.5" cy="98.5" r="4" fill="${c}" stroke="${shade(c, -.25)}" stroke-width=".6"/>
        <circle cx="115.3" cy="97.3" r="1.1" fill="#fff" opacity=".8"/>`);
    } },
    bucket: { slot: 'hat', box: [92, 14, 116, 62], hang: 'none', draw: c => {
      const l = line(c);
      return `<path d="M119 54 Q119 22 150 21 Q181 22 181 54 Z" fill="${c}"/>
        <path d="M97 64 Q104 46 119 50 Q150 58 181 50 Q196 46 203 64 Q150 76 97 64 Z" fill="${shade(c, lum(c) > .35 ? -.07 : .1)}"/>
        <path d="M119 51 Q150 59 181 51" fill="none" stroke="${l}" stroke-width="1.3"/>
        <path d="M104 62 Q150 71 196 62" fill="none" stroke="${l}" stroke-width="1" stroke-dasharray="2 2" opacity=".7"/>`;
    } },
    // mỹ phẩm: chỉ có slot, vẽ thẳng lên mặt
    lip: { slot: 'lip' }, blush: { slot: 'blush' }, eye: { slot: 'eye' },
  };

  const ORDER = ['shoes', 'bottom', 'top', 'dress', 'outer', 'bag']; // thứ tự vẽ dưới đầu
  const OVER = ['ear', 'eyewear', 'hat']; // vẽ đè lên mặt/tóc

  /* wearing: { slot: {shape, color, finish?, shimmer?} }  */
  function renderAvatar(wearing, tone) {
    const s = SKIN[tone] || SKIN.medium, sd = shade(s, -0.16), sl = shade(s, -0.3);
    const w = wearing || {};
    const g = slot => w[slot] && G[w[slot].shape].draw ? `<g data-slot="${slot}">${G[w[slot].shape].draw(w[slot].color)}</g>` : '';
    const lipC = w.lip ? w.lip.color : '#c98a82';
    const lipOp = w.lip ? 1 : 0.75;
    const gloss = w.lip && w.lip.finish === 'gloss';
    const base = '#f2e8dc';

    return `
<defs>
  <filter id="avBlur" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3"/></filter>
  <filter id="avSoft" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation=".7"/></filter>
</defs>
<ellipse cx="150" cy="618" rx="74" ry="9" fill="#000" opacity=".12"/>
<path d="M113 74 C106 18 194 18 187 74 C190 118 199 158 197 194 Q150 206 103 194 C101 158 110 118 113 74 Z" fill="${HAIR}"/>
${mirror(`<path d="M131 300 L129 592" stroke="${s}" stroke-width="30" stroke-linecap="round"/><ellipse cx="127" cy="603" rx="15" ry="8.5" fill="${s}"/>`)}
${mirror(`<path d="${ARM}" fill="none" stroke="${s}" stroke-width="17" stroke-linecap="round" stroke-linejoin="round"/><circle cx="92" cy="326" r="9.5" fill="${s}"/>`)}
<path d="M106 146 Q150 136 194 146 L187 245 Q194 280 196 312 L104 312 Q106 280 113 245 Z" fill="${s}"/>
<rect x="139.5" y="106" width="21" height="38" rx="6" fill="${s}"/>
<path d="M139.5 121 Q150 131 160.5 121 L160.5 116 L139.5 116 Z" fill="${sd}" opacity=".55"/>
<path d="M118 166 Q150 158 182 166 L184 200 Q150 208 116 200 Z" fill="${base}"/>
<path d="M108 286 Q150 278 192 286 L196 318 L154 318 L150 310 L146 318 L104 318 Z" fill="${base}"/>
${ORDER.map(g).join('')}
${mirror(`<ellipse cx="116.5" cy="84" rx="4.2" ry="7" fill="${s}"/>`)}
<path d="M117 72 C117 40 183 40 183 72 C183 100 168 122 150 122 C132 122 117 100 117 72 Z" fill="${s}"/>
${w.blush ? mirror(`<ellipse cx="128" cy="95" rx="9.5" ry="6" fill="${w.blush.color}" opacity=".62" filter="url(#avBlur)"/>`) : ''}
${w.eye ? mirror(`<path d="M125.5 81 Q128 69.5 137 69.8 Q145 70.8 146.8 80 Q136 73.6 125.5 81 Z" fill="${w.eye.color}" opacity=".8" filter="url(#avSoft)"/>` +
      (w.eye.shimmer ? `<circle cx="134" cy="73.5" r=".8" fill="#fff"/><circle cx="139" cy="72.8" r=".6" fill="#fff"/><circle cx="130.5" cy="75.5" r=".5" fill="#fff"/>` : '')) : ''}
${mirror(`<path d="M128.5 80.5 Q136 75 143.5 80.5 Q136 85 128.5 80.5 Z" fill="#fff"/>
  <circle cx="136.3" cy="80.3" r="3.5" fill="#4b2f22"/><circle cx="136.3" cy="80.3" r="1.7" fill="#1c1210"/><circle cx="137.5" cy="79" r=".9" fill="#fff"/>
  <path d="M127.6 80.8 Q136 74 144.2 80.6" fill="none" stroke="#231613" stroke-width="1.4" stroke-linecap="round"/>
  <path d="M127.6 80.8 L125.8 79.2" stroke="#231613" stroke-width="1" stroke-linecap="round"/>
  <path d="M126.5 70.5 Q134 66 144.5 69.5" fill="none" stroke="${HAIR}" stroke-width="2" stroke-linecap="round" opacity=".85"/>`)}
<path d="M150 85 Q147.2 93.5 148.6 96 Q150.5 97.3 152.6 96" fill="none" stroke="${sl}" stroke-width="1" stroke-linecap="round" opacity=".75"/>
<g opacity="${lipOp}">
  <path d="M140.5 104.5 Q144 101 147.5 100.6 Q150 102 152.5 100.6 Q156 101 159.5 104.5 Q150 106 140.5 104.5 Z" fill="${shade(lipC, -0.1)}"/>
  <path d="M140.5 104.5 Q150 106 159.5 104.5 Q156 111 150 111.3 Q144 111 140.5 104.5 Z" fill="${lipC}"/>
  <path d="M141 104.6 Q150 106.2 159 104.6" fill="none" stroke="${shade(lipC, -0.35)}" stroke-width=".6"/>
  ${gloss ? `<ellipse cx="150" cy="108.3" rx="4.2" ry="1.1" fill="#fff" opacity=".65"/><ellipse cx="146" cy="102.6" rx="1.6" ry=".5" fill="#fff" opacity=".5"/>` : ''}
</g>
<path d="M115 80 C109 40 134 27 153 29 C174 27 192 44 185 82 C183 64 173 50 157 45 C147 58 129 63 120 63 C117 68 115.6 74 115 80 Z" fill="${HAIR}"/>
<path d="M150 33 Q168 34 178 50" fill="none" stroke="#fff" stroke-width="2.5" opacity=".1" stroke-linecap="round"/>
${OVER.map(g).join('')}`;
  }

  /* ───── Hình trưng bày trên kệ ───── */
  const hangerTop = `<path d="M150 124 q7 -9 0 -14 q-8 -3 -9 5" fill="none" stroke="#b9a48a" stroke-width="2.4" stroke-linecap="round"/>
    <path d="M150 124 L106 147 Q150 139 194 147 Z" fill="#cdb89c" stroke="#a8916f" stroke-width="1"/>`;
  const hangerClip = `<path d="M150 234 q7 -9 0 -14 q-8 -3 -9 5" fill="none" stroke="#b9a48a" stroke-width="2.4" stroke-linecap="round"/>
    <path d="M108 236 h84" stroke="#b9a48a" stroke-width="3" stroke-linecap="round"/>
    <rect x="114" y="233" width="8" height="15" rx="2" fill="#a8916f"/><rect x="178" y="233" width="8" height="15" rx="2" fill="#a8916f"/>`;

  function cosmeticThumb(p, c) {
    if (p.shape === 'lip') {
      const gloss = p.finish === 'gloss';
      return { w: 46, h: 104, svg: gloss
        ? `<svg viewBox="0 0 46 104" width="46" height="104"><rect x="14" y="4" width="18" height="34" rx="4" fill="#2b2320"/><rect x="14" y="34" width="18" height="4" fill="#d9b36a"/>
           <rect x="11" y="38" width="24" height="62" rx="7" fill="${c}"/><rect x="11" y="38" width="24" height="62" rx="7" fill="#fff" opacity=".12"/>
           <rect x="15" y="44" width="4" height="48" rx="2" fill="#fff" opacity=".5"/></svg>`
        : `<svg viewBox="0 0 46 104" width="46" height="104"><path d="M15 34 L15 14 Q16 6 31 4 L31 34 Z" fill="${c}"/><path d="M15 34 L15 14 Q16 6 31 4" fill="none" stroke="#fff" stroke-width="2" opacity=".25"/>
           <rect x="13" y="34" width="20" height="22" fill="#e3c27a"/><rect x="13" y="34" width="5" height="22" fill="#fff" opacity=".35"/>
           <rect x="9" y="56" width="28" height="46" rx="3" fill="#2b2320"/><rect x="12" y="58" width="4" height="42" rx="2" fill="#fff" opacity=".18"/><rect x="9" y="56" width="28" height="4" fill="#d9b36a"/></svg>` };
    }
    if (p.shape === 'blush') {
      return { w: 84, h: 92, svg: `<svg viewBox="0 0 84 92" width="84" height="92">
        <ellipse cx="42" cy="34" rx="32" ry="30" fill="#e9d2c2"/><ellipse cx="42" cy="34" rx="26" ry="24" fill="#f7f1ec"/><path d="M26 22 Q36 12 50 14" stroke="#fff" stroke-width="4" fill="none" stroke-linecap="round" opacity=".9"/>
        <ellipse cx="42" cy="70" rx="38" ry="19" fill="#d9b9a5"/><ellipse cx="42" cy="67" rx="38" ry="19" fill="#f0d9c9"/>
        <ellipse cx="42" cy="67" rx="29" ry="13" fill="${c}"/><ellipse cx="34" cy="63" rx="12" ry="4" fill="#fff" opacity=".22"/></svg>` };
    }
    // eye
    if (p.shimmer) {
      return { w: 62, h: 70, svg: `<svg viewBox="0 0 62 70" width="62" height="70"><rect x="10" y="4" width="42" height="24" rx="5" fill="#2b2320"/><rect x="10" y="24" width="42" height="4" fill="#d9b36a"/>
        <rect x="6" y="28" width="50" height="40" rx="9" fill="${c}"/><rect x="6" y="28" width="50" height="40" rx="9" fill="#fff" opacity=".18"/>
        ${[[18, 40], [30, 52], [42, 38], [24, 58], [46, 56], [36, 44]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.6" fill="#fff" opacity=".9"/>`).join('')}</svg>` };
    }
    const pans = [shade(c, .45), shade(c, .15), c, shade(c, -.3)];
    return { w: 96, h: 76, svg: `<svg viewBox="0 0 96 76" width="96" height="76"><rect x="2" y="4" width="92" height="70" rx="10" fill="#3a2d28"/><rect x="2" y="4" width="92" height="70" rx="10" fill="none" stroke="#d9b36a" stroke-width="1.5"/>
      ${pans.map((pc, i) => `<rect x="${10 + (i % 2) * 40}" y="${11 + (i > 1 ? 30 : 0)}" width="36" height="26" rx="5" fill="${pc}"/><rect x="${13 + (i % 2) * 40}" y="${14 + (i > 1 ? 30 : 0)}" width="14" height="4" rx="2" fill="#fff" opacity=".25"/>`).join('')}</svg>` };
  }

  /* Trả về {svg, w, h} — hình sản phẩm để đặt lên kệ. maxW/maxH: kích thước tối đa (px) */
  function thumb(p, color, maxW, maxH) {
    const def = G[p.shape];
    if (!def.draw) {
      const t = cosmeticThumb(p, color);
      const k = Math.min(1, maxW / t.w, maxH / t.h);
      return { w: t.w * k, h: t.h * k, svg: t.svg.replace(/width="\d+" height="\d+"/, `width="${t.w * k}" height="${t.h * k}"`) };
    }
    const [x, y, w, h] = def.box;
    const big = { earrings: 2.2, sunglasses: 1.5, sneakers: 1.2, heels: 1.2 }[p.shape] || 1;
    const k = Math.min(maxW / w, maxH / h, 0.62 * big);
    const hanger = def.hang === 'top' ? hangerTop : def.hang === 'clip' ? hangerClip : '';
    return { w: w * k, h: h * k, svg: `<svg viewBox="${x} ${y} ${w} ${h}" width="${(w * k).toFixed(1)}" height="${(h * k).toFixed(1)}">${hanger}${def.draw(color)}</svg>` };
  }

  window.Avatar = { render: renderAvatar, thumb, slotOf: shape => G[shape].slot, SKIN, shade };
})();
