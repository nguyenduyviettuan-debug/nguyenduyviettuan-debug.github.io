/*
  DANH SÁCH SẢN PHẨM — sửa file này để lên kệ hàng thật.

  Mỗi sản phẩm:
    id      : mã riêng, không trùng
    name    : tên hiển thị
    cat     : kệ trưng bày — 'lip' | 'face' | 'top' | 'bottom' | 'dress' | 'shoes' | 'acc'
    shape   : kiểu dáng để thử lên người mẫu (xem danh sách trong avatar.js)
    price   : giá tham khảo (VNĐ)
    variants: các màu — { name, color, tones? }  (tones: tông da hợp — 'light' | 'medium' | 'tan')
    finish  : (son) 'matte' | 'gloss'      shimmer: (mắt) true nếu là nhũ
    tip     : câu tư vấn của nhân viên
    kw      : từ khoá tìm kiếm dùng khi chưa có link affiliate
    links   : { shopee: 'link affiliate', tiktok: 'link affiliate' }  — để trống thì nút mua sẽ mở trang tìm kiếm
    image   : (tuỳ chọn) đường dẫn ảnh sản phẩm thật, hiện trong thẻ sản phẩm
    overlay : (khuyên tai, kính — đặt trong sản phẩm hoặc trong từng màu) ảnh PNG nền trong suốt để gắn lên mặt thật khi thử bằng camera/ảnh
              khuyên tai: { src, size: chiều cao so với mặt (mặc định 0.27), anchor: [x, y] vị trí lỗ xỏ trên ảnh (tỉ lệ 0–1),
                            hide: [[x, y], …] vùng khuyên nằm sau dái tai cần che đi (tỉ lệ 0–1) }
              kính 3D   : { model: { lensW, lensH, bridge (mm), rim: độ dày vành, square: độ vuông của tròng, taper: độ thu hẹp ở đáy } } — đúng ở mọi góc quay đầu
              kính ảnh  : { src, eyes: [[x, y], [x, y]] tâm tròng trái và phải trên ảnh (px), faces: 'right' | 'left' nếu ảnh chụp nghiêng,
                            temple: { hinge: [x, y] bản lề, tip: [x, y] chỗ càng bắt đầu uốn xuống sau tai } (px) }
*/
window.PRODUCTS = [
  // ───────── Son ─────────
  { id: 'son-li', name: 'Son kem lì Velvet', cat: 'lip', shape: 'lip', finish: 'matte', price: 129000,
    variants: [
      { name: 'Đỏ gạch', color: '#a8402f', tones: ['medium', 'tan'] },
      { name: 'Hồng đất', color: '#b5646a', tones: ['light', 'medium'] },
      { name: 'Cam cháy', color: '#c2562c', tones: ['tan', 'medium'] },
      { name: 'Đỏ rượu', color: '#7d1f33', tones: ['light', 'tan'] },
    ],
    tip: 'Chất kem lì mịn như nhung, lên màu chuẩn ngay lần quẹt đầu. Thoa lòng môi rồi tán ra là có ngay môi mọng kiểu Hàn.',
    kw: 'son kem lì', links: { shopee: '', tiktok: '' } },
  { id: 'son-bong', name: 'Son bóng Glassy Dew', cat: 'lip', shape: 'lip', finish: 'gloss', price: 99000,
    variants: [
      { name: 'Hồng đào', color: '#e07f88', tones: ['light', 'medium'] },
      { name: 'Cam sữa', color: '#e58f6c', tones: ['medium', 'tan'] },
      { name: 'Đỏ cherry', color: '#c22f45', tones: ['light', 'medium', 'tan'] },
    ],
    tip: 'Bóng như tráng gương mà không dính. Hợp đánh riêng cho ngày thường hoặc phủ lên son lì để môi căng hơn.',
    kw: 'son bóng', links: { shopee: '', tiktok: '' } },
  { id: 'son-tint', name: 'Son tint Nước Dâu', cat: 'lip', shape: 'lip', finish: 'gloss', price: 79000,
    variants: [
      { name: 'Dâu chín', color: '#cf4a5c', tones: ['light', 'medium'] },
      { name: 'Hồng san hô', color: '#e8736a', tones: ['medium', 'tan'] },
    ],
    tip: 'Tint nước mỏng nhẹ, bám màu cả ngày — ăn uống vẫn còn lớp màu trong môi. Hợp các bạn thích tự nhiên.',
    kw: 'son tint', links: { shopee: '', tiktok: '' } },

  // ───────── Má & mắt ─────────
  { id: 'ma-kem', name: 'Má hồng kem Blush Pop', cat: 'face', shape: 'blush', price: 115000,
    variants: [
      { name: 'Hồng baby', color: '#f08fa0', tones: ['light'] },
      { name: 'Cam đào', color: '#f2976f', tones: ['medium', 'tan'] },
      { name: 'Hồng mận', color: '#c9607a', tones: ['medium', 'tan'] },
    ],
    tip: 'Dạng kem tán bằng tay là xong, má ửng như vừa chạy bộ về. Chấm thêm lên sống mũi cho kiểu say nắng.',
    kw: 'má hồng kem', links: { shopee: '', tiktok: '' } },
  { id: 'ma-phan', name: 'Phấn má Sunset', cat: 'face', shape: 'blush', price: 149000,
    variants: [
      { name: 'Hồng nude', color: '#dc8f8a', tones: ['light', 'medium'] },
      { name: 'Cam đất', color: '#d47c55', tones: ['tan', 'medium'] },
    ],
    tip: 'Phấn nén mịn, dễ kiểm soát độ đậm nhạt — an toàn cho người mới tập đánh má.',
    kw: 'phấn má hồng', links: { shopee: '', tiktok: '' } },
  { id: 'mat-4o', name: 'Bảng mắt 4 ô Cà Phê Sữa', cat: 'face', shape: 'eye', price: 189000,
    variants: [
      { name: 'Nâu sữa', color: '#a06f4c', tones: ['light', 'medium', 'tan'] },
      { name: 'Hồng khói', color: '#b47a86', tones: ['light', 'medium'] },
      { name: 'Cam đất', color: '#b9673f', tones: ['medium', 'tan'] },
    ],
    tip: 'Bốn ô đủ nhạt – trung – đậm – nhũ cho một lớp mắt hoàn chỉnh, đi học đi làm đều ổn.',
    kw: 'bảng phấn mắt 4 ô', links: { shopee: '', tiktok: '' } },
  { id: 'mat-nhu', name: 'Nhũ mắt Stardust', cat: 'face', shape: 'eye', shimmer: true, price: 89000,
    variants: [
      { name: 'Champagne', color: '#d9b587', tones: ['light', 'medium', 'tan'] },
      { name: 'Hồng nhũ', color: '#e09aa6', tones: ['light', 'medium'] },
    ],
    tip: 'Chấm giữa bầu mắt là mắt long lanh liền. Đi tiệc tối bắt đèn cực xinh.',
    kw: 'nhũ mắt', links: { shopee: '', tiktok: '' } },

  // ───────── Áo ─────────
  { id: 'ao-thun', name: 'Áo thun baby tee', cat: 'top', shape: 'tee', price: 119000,
    variants: [{ name: 'Trắng', color: '#fbf8f3' }, { name: 'Đen', color: '#262223' }, { name: 'Hồng phấn', color: '#f3bcc4' }],
    tip: 'Form ôm vừa, vải cotton co giãn. Món này phối gì cũng hợp — nên có ít nhất một chiếc trắng.',
    kw: 'áo thun baby tee nữ', links: { shopee: '', tiktok: '' } },
  { id: 'ao-crop', name: 'Áo croptop gân', cat: 'top', shape: 'crop', price: 99000,
    variants: [{ name: 'Kem', color: '#efe3d0' }, { name: 'Nâu', color: '#7a5240' }, { name: 'Xanh sage', color: '#a9b89a' }],
    tip: 'Vải gân ôm tôn eo. Mặc với quần cạp cao hoặc chân váy là dáng dài hẳn ra.',
    kw: 'áo croptop gân nữ', links: { shopee: '', tiktok: '' } },
  { id: 'ao-2day', name: 'Áo hai dây lụa', cat: 'top', shape: 'tank', price: 129000,
    variants: [{ name: 'Champagne', color: '#e9d3b4' }, { name: 'Đen', color: '#262223' }],
    tip: 'Lụa satin mềm rủ. Mặc riêng thì quyến rũ, khoác thêm blazer là đi làm được luôn.',
    kw: 'áo hai dây lụa satin', links: { shopee: '', tiktok: '' } },
  { id: 'ao-somi', name: 'Sơ mi oversize', cat: 'top', shape: 'shirt', price: 219000,
    variants: [{ name: 'Trắng', color: '#fbf9f5' }, { name: 'Xanh baby', color: '#bcd3ea' }],
    tip: 'Form rộng thoải mái, chất kate ít nhăn. Sơ vin nửa vạt cho đỡ luộm thuộm nha.',
    kw: 'áo sơ mi oversize nữ', links: { shopee: '', tiktok: '' } },
  { id: 'ao-blazer', name: 'Blazer dáng suông', cat: 'top', shape: 'blazer', price: 359000,
    variants: [{ name: 'Be', color: '#d8c3a5' }, { name: 'Đen', color: '#2a2627' }],
    tip: 'Khoác lên là sang hẳn. Vai đứng vừa phải nên người nhỏ mặc không bị nuốt dáng.',
    kw: 'áo blazer nữ dáng suông', links: { shopee: '', tiktok: '' } },
  { id: 'ao-cardigan', name: 'Cardigan len mỏng', cat: 'top', shape: 'cardigan', price: 249000,
    variants: [{ name: 'Kem', color: '#f1e6d2' }, { name: 'Hồng đào', color: '#f0b9ad' }],
    tip: 'Len mỏng mặc phòng máy lạnh vừa đẹp. Khoác ngoài đầm hai dây là chuẩn nàng thơ.',
    kw: 'áo cardigan len mỏng nữ', links: { shopee: '', tiktok: '' } },

  // ───────── Quần & váy ─────────
  { id: 'quan-jeans', name: 'Jeans ống suông', cat: 'bottom', shape: 'jeans', price: 289000,
    variants: [{ name: 'Xanh nhạt', color: '#9db7d1' }, { name: 'Xanh đậm', color: '#3f5878' }],
    tip: 'Cạp cao, ống suông che khuyết điểm chân. Lên dáng đẹp nhất khi đi với giày đế bằng.',
    kw: 'quần jeans ống suông nữ', links: { shopee: '', tiktok: '' } },
  { id: 'quan-rong', name: 'Quần ống rộng', cat: 'bottom', shape: 'wide', price: 239000,
    variants: [{ name: 'Đen', color: '#2a2627' }, { name: 'Be', color: '#d9c7ab' }],
    tip: 'Vải rủ, đi lại bay bay rất thích. Phối với áo ôm phía trên cho cân đối.',
    kw: 'quần ống rộng nữ', links: { shopee: '', tiktok: '' } },
  { id: 'quan-short', name: 'Quần short kaki', cat: 'bottom', shape: 'shorts', price: 149000,
    variants: [{ name: 'Be', color: '#dccbb0' }, { name: 'Trắng', color: '#f8f4ec' }],
    tip: 'Cạp cao, ống hơi xoè nên chân trông thon hơn. Đi biển hay cà phê đều hợp.',
    kw: 'quần short kaki nữ', links: { shopee: '', tiktok: '' } },
  { id: 'vay-tennis', name: 'Chân váy tennis', cat: 'bottom', shape: 'mini', price: 169000,
    variants: [{ name: 'Trắng', color: '#fbf8f3' }, { name: 'Đen', color: '#2a2627' }, { name: 'Xám', color: '#a9a9ad' }],
    tip: 'Xếp ly có quần lót trong, năng động mà vẫn điệu. Đi với sneaker trắng là hết bài.',
    kw: 'chân váy tennis xếp ly', links: { shopee: '', tiktok: '' } },
  { id: 'vay-midi', name: 'Chân váy midi lụa', cat: 'bottom', shape: 'midi', price: 229000,
    variants: [{ name: 'Nâu mocha', color: '#8a6450' }, { name: 'Xanh rêu', color: '#6f7d5c' }],
    tip: 'Lụa bóng nhẹ, dài qua gối — nữ tính và che được bắp chân.',
    kw: 'chân váy midi lụa', links: { shopee: '', tiktok: '' } },

  // ───────── Đầm ─────────
  { id: 'dam-2day', name: 'Đầm hai dây lụa', cat: 'dress', shape: 'slip', price: 279000,
    variants: [{ name: 'Đen', color: '#262223' }, { name: 'Đỏ rượu', color: '#7d2436' }, { name: 'Champagne', color: '#e6cfae' }],
    tip: 'Dáng suông chữ A, lụa rủ theo người. Một chiếc đầm đi được cả tiệc lẫn hẹn hò.',
    kw: 'đầm hai dây lụa', links: { shopee: '', tiktok: '' } },
  { id: 'dam-baby', name: 'Đầm babydoll tay phồng', cat: 'dress', shape: 'babydoll', price: 259000,
    variants: [{ name: 'Trắng kem', color: '#f6efe2' }, { name: 'Hồng', color: '#f1b6c1' }, { name: 'Xanh pastel', color: '#b9d2e6' }],
    tip: 'Tay phồng cổ vuông, xoè nhẹ che bụng. Mặc lên trẻ ra vài tuổi.',
    kw: 'đầm babydoll tay phồng', links: { shopee: '', tiktok: '' } },

  // ───────── Giày ─────────
  { id: 'giay-sneaker', name: 'Sneaker trắng basic', cat: 'shoes', shape: 'sneakers', price: 329000,
    variants: [{ name: 'Trắng', color: '#fdfbf7' }, { name: 'Kem viền nâu', color: '#eadcc5' }],
    tip: 'Đế cao 3cm ăn gian chiều cao, êm chân. Đôi này cân mọi set đồ.',
    kw: 'giày sneaker trắng nữ', links: { shopee: '', tiktok: '' } },
  { id: 'giay-caogot', name: 'Cao gót mũi nhọn 5cm', cat: 'shoes', shape: 'heels', price: 299000,
    variants: [{ name: 'Đen', color: '#262223' }, { name: 'Nude', color: '#d9b49a' }, { name: 'Đỏ', color: '#b3263a' }],
    tip: 'Gót 5cm vừa đủ tôn dáng mà không mỏi. Màu nude giúp chân trông dài hơn.',
    kw: 'giày cao gót mũi nhọn 5cm', links: { shopee: '', tiktok: '' } },
  { id: 'giay-boots', name: 'Boots cổ lửng', cat: 'shoes', shape: 'boots', price: 399000,
    variants: [{ name: 'Đen', color: '#2a2627' }, { name: 'Nâu', color: '#6d4a37' }],
    tip: 'Da mềm, cổ ôm chân. Phối với chân váy ngắn là cá tính liền.',
    kw: 'boots cổ lửng nữ', links: { shopee: '', tiktok: '' } },

  // ───────── Phụ kiện ─────────
  { id: 'tui-tote', name: 'Túi tote vải canvas', cat: 'acc', shape: 'tote', price: 89000,
    variants: [{ name: 'Kem', color: '#eee2cb' }, { name: 'Đen', color: '#2a2627' }],
    tip: 'Đựng vừa laptop 14 inch, có khoá kéo. Rẻ mà dùng được mỗi ngày.',
    kw: 'túi tote vải canvas', links: { shopee: '', tiktok: '' } },
  { id: 'tui-kep', name: 'Túi kẹp nách da', cat: 'acc', shape: 'baguette', price: 199000,
    variants: [{ name: 'Đen', color: '#262223' }, { name: 'Trắng kem', color: '#f2e9da' }, { name: 'Nâu bò', color: '#8a5a3c' }],
    tip: 'Nhỏ gọn đựng vừa điện thoại, son, ví. Món nâng tầm set đồ nhanh nhất.',
    kw: 'túi kẹp nách nữ', links: { shopee: '', tiktok: '' } },
  { id: 'kinh-mat', name: 'Kính mát gọng vuông', cat: 'acc', shape: 'sunglasses', price: 129000,
    variants: [{ name: 'Đen', color: '#1f1b1c' }, { name: 'Trà', color: '#7a5136' }],
    tip: 'Gọng vuông hợp mặt tròn và mặt trái xoan. Có chống UV400.',
    kw: 'kính mát nữ gọng vuông', links: { shopee: '', tiktok: '' } },
  { id: 'khuyen-tai', name: 'Khuyên tai ngọc trai', cat: 'acc', shape: 'earrings', price: 59000,
    variants: [{ name: 'Trắng ngà', color: '#f7f1e6', overlay: { src: 'img/earring-pearl.png' } }, { name: 'Vàng gold', color: '#d4a94e', overlay: { src: 'img/earring-gold.png' } }],
    tip: 'Nhỏ xinh, đeo hằng ngày không bị nặng tai. Mặt sáng lên thấy rõ.',
    kw: 'khuyên tai ngọc trai', links: { shopee: '', tiktok: '' } },
  // Hai món dưới đây dùng ảnh sản phẩm thật đã tách nền. CHƯA có giá và link — điền vào trước khi quảng bá.
  { id: 'khuyen-no', name: 'Khuyên tai nơ bạc', cat: 'acc', shape: 'earrings', price: 0,
    variants: [{ name: 'Bạc', color: '#d9dcdf' }],
    overlay: { src: 'img/earring-bow.png', size: 0.115, anchor: [0.66, 0.07], hide: [[0.45, -0.1], [1.1, -0.1], [1.1, 0.1], [0.45, 0.1]] },
    tip: 'Khuyên tròn ôm dái tai, đính nơ nhỏ — đeo hằng ngày nhẹ nhàng mà vẫn có điểm nhấn.',
    kw: 'khuyên tai nơ bạc', links: { shopee: '', tiktok: '' } },
  { id: 'kinh-gong', name: 'Kính gọng kim loại bạc', cat: 'acc', shape: 'glasses', price: 0,
    variants: [{ name: 'Bạc', color: '#b9bec3' }],
    overlay: { model: { lensW: 47, lensH: 39, bridge: 21, rim: 0.9, square: 3.4, taper: 0.12 } },   // kính dựng 3D, kích thước theo mm
    tip: 'Gọng kim loại mảnh, dáng vuông bo góc — hợp mặt tròn và mặt trái xoan, đeo lên trông gọn gàng tri thức.',
    kw: 'kính gọng kim loại bạc', links: { shopee: '', tiktok: '' } },
  { id: 'mu-bucket', name: 'Mũ bucket', cat: 'acc', shape: 'bucket', price: 99000,
    variants: [{ name: 'Be', color: '#dccbb0' }, { name: 'Đen', color: '#2a2627' }],
    tip: 'Vành cụp che nắng tốt, gấp gọn bỏ túi được. Hôm nào tóc xấu thì đội.',
    kw: 'mũ bucket nữ', links: { shopee: '', tiktok: '' } },
];

/* Các kệ trưng bày, theo thứ tự hiển thị */
window.SHELVES = [
  { cat: 'lip', title: 'Quầy son', sub: 'Chạm một thỏi để thử ngay lên môi', kind: 'plank' },
  { cat: 'face', title: 'Má hồng & mắt', sub: 'Thử chồng nhiều lớp cùng lúc', kind: 'plank' },
  { cat: 'top', title: 'Áo & áo khoác', sub: 'Chạm để mặc thử', kind: 'rail' },
  { cat: 'bottom', title: 'Quần & chân váy', sub: 'Phối với áo đang mặc', kind: 'rail' },
  { cat: 'dress', title: 'Đầm', sub: 'Một món là xong cả set', kind: 'rail' },
  { cat: 'shoes', title: 'Giày', sub: '', kind: 'plank' },
  { cat: 'acc', title: 'Túi & phụ kiện', sub: 'Món chốt cho set đồ', kind: 'plank' },
];

/* Set đồ gợi ý của nhân viên tư vấn — xếp theo độ ưu tiên, món đứng trước được giữ lại khi ngân sách hẹp */
window.LOOKS = {
  hoc: { name: 'Đi học, đi chơi', say: 'Set này thoải mái cả ngày mà lên hình vẫn xinh.',
    items: ['ao-thun:Trắng', 'quan-jeans:Xanh nhạt', 'giay-sneaker', 'son-tint', 'tui-tote', 'ma-kem', 'khuyen-tai'] },
  lam: { name: 'Đi làm', say: 'Gọn gàng, chỉn chu, mà không bị già.',
    items: ['ao-somi:Trắng', 'quan-rong:Đen', 'giay-caogot:Nude', 'son-li', 'ao-blazer:Be', 'tui-kep:Đen', 'mat-4o'] },
  henho: { name: 'Hẹn hò', say: 'Ngọt ngào vừa đủ, nhìn là muốn rủ đi tiếp lần sau.',
    items: ['dam-baby:Trắng kem', 'giay-caogot:Nude', 'son-bong', 'ma-kem', 'khuyen-tai', 'tui-kep:Trắng kem', 'mat-nhu', 'ao-cardigan:Hồng đào'] },
  tiec: { name: 'Đi tiệc', say: 'Đơn giản nhưng nổi bật — để thỏi son làm nhân vật chính.',
    items: ['dam-2day:Đen', 'giay-caogot:Đen', 'son-li:Đỏ rượu', 'khuyen-tai:Vàng gold', 'mat-nhu', 'tui-kep:Đen', 'ma-phan'] },
  bien: { name: 'Du lịch, đi biển', say: 'Mát mẻ, năng động, chụp góc nào cũng có ảnh đăng.',
    items: ['ao-crop:Kem', 'quan-short:Be', 'giay-sneaker', 'mu-bucket:Be', 'son-tint', 'kinh-mat', 'tui-tote', 'ma-kem'] },
};
