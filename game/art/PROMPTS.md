# Bộ lệnh tạo hình và video cho game "Lên Đời"

Dùng cho Muse AI hoặc công cụ tạo ảnh/video bất kỳ. Lệnh viết bằng tiếng Anh vì đa số công cụ hiểu tiếng Anh tốt hơn.

## 1. Quy ước chung

**Câu phong cách** (dán vào cuối MỌI lệnh để cả bộ đồng nhất):

> photorealistic, cinematic photography, real human proportions, realistic skin texture, soft cinematic lighting, Vietnamese setting, highly detailed, no text, no logo, no watermark

(Bản đầu dùng "3D animated film style"; từ 17/11/2026 cả bộ chuyển sang ảnh thật.)

**Kích thước**

| Loại | Khung | Ghi chú |
|---|---|---|
| Nhân vật | dọc 2:3, toàn thân, đứng thẳng nhìn về trước | nền một màu xanh lá hoặc trắng trơn để tách nền |
| Bối cảnh (ảnh) | ngang 4:3 | chừa 1/4 phía dưới là nền đất trống, KHÔNG có người |
| Video | ngang 4:3, 4–6 giây, máy quay đứng yên | cảnh đầu và cuối giống nhau để lặp mượt |

**Giữ cùng một gương mặt:** tạo hình "mốc 0" trước, rồi dùng nó làm ảnh tham chiếu cho mọi hình sau của nhân vật đó.

**Đặt tên file và thư mục** (đúng tên thì game tự nhận):

```
game/art/bom/look-0.png … look-4.png      nhân vật theo 5 chặng đời
game/art/bom/home-0.jpg … home-5.jpg      6 cấp nhà (có thể là .mp4)
game/art/bom/ride-1.mp4 … ride-5.mp4      cảnh chạy 5 cấp xe
game/art/bom/dream.mp4                    giấc mơ VIP
game/art/bg/<tên-cảnh>.jpg hoặc .mp4      bối cảnh dùng chung
game/art/npc/<tên>.png                    nhân vật phụ, tách nền
```
Thay `bom` bằng `na` hoặc `muop` cho hai nhân vật còn lại.

## 2. Nhân vật (mỗi nhân vật 5 hình)

Năm chặng: 0 = nghèo nhất, 1 = bắt đầu có việc, 2 = khá giả, 3 = giàu, 4 = đỉnh cao.

### Bờm (nam)
Mô tả gốc: `a 24-year-old Vietnamese man, slim, friendly round face, short black hair, full body, standing, facing camera`

| File | Thêm vào mô tả gốc |
|---|---|
| look-0 | messy hair, torn grey tank top, shorts, yellow plastic sandals, tired sad face |
| look-1 | delivery jacket, cheap t-shirt, jeans, sneakers, hopeful face |
| look-2 | neat side-part hair, white office shirt, tie, slacks, leather shoes, plastic watch, small smile |
| look-3 | slick undercut, black tailored suit, gold chain, sunglasses pushed up, confident smile |
| look-4 | platinum styled hair, white luxury suit with gold trim, diamond watch, proud grin, subtle golden glow |

### Na (nữ)
Mô tả gốc: `a 22-year-old Vietnamese woman, slim, gentle face, black hair, full body, standing, facing camera`

| File | Thêm vào mô tả gốc |
|---|---|
| look-0 | messy bun, faded brown ao ba ba, plastic slippers, carrying a plastic bag, worried face |
| look-1 | ponytail with a pink bow, plain t-shirt, apron, flat shoes, cloth bag, hopeful face |
| look-2 | soft curled hair, navy office dress, thin sandals, small leather bag, silver earrings, smile |
| look-3 | brown dyed wavy hair, pink designer dress, red high heels, mini designer handbag, gold necklace, confident |
| look-4 | glamorous long hair, purple evening gown, crystal heels, luxury handbag, diamond tiara, radiant smile, subtle golden glow |

### Mướp (mèo)
Mô tả gốc: `a cute tabby cat with big expressive eyes, full body, sitting upright, facing camera`

| File | Thêm vào mô tả gốc |
|---|---|
| look-0 | dirty matted grey fur with mud spots, old rope around neck, thin, sad teary eyes |
| look-1 | freshly washed brown tabby fur, red string collar, curious eyes |
| look-2 | fluffy orange fur, collar with a small gold bell, happy eyes |
| look-3 | glossy cream fur, leather name-tag collar, proud pose |
| look-4 | pure white fluffy fur with sparkle, diamond collar, tiny gold crown, smug happy face, subtle golden glow |

## 3. Nhà (6 cấp, mỗi nhân vật một bộ: home-0 … home-5)

| Cấp | Bờm | Na | Mướp |
|---|---|---|---|
| 0 | under a concrete bridge at night, small tent, trash fire | corner of a wet market at night, old umbrella stall, baskets | garbage dump at night, cardboard boxes, trash bins |
| 1 | tiny shabby rented room exterior, hanging laundry, dusk | (dùng chung với Bờm) | dark space under an old staircase, cardboard box bed |
| 2 | small apartment building street, daytime | (dùng chung) | cozy cat café interior, warm light, chairs, plants |
| 3 | three-storey Vietnamese townhouse, trees, sunny | (dùng chung) | bright modern apartment living room, sofa, window |
| 4 | modern villa with swimming pool, palm trees | villa with rose garden | villa garden with fountain |
| 5 | grand hilltop castle mansion, fireworks, sunset | (dùng chung với Bờm) | royal cat palace hall, red velvet, golden throne |

## 4. Bối cảnh dùng chung (thư mục `bg/`, tên file = tên cảnh)

| Tên file | Lệnh |
|---|---|
| road | suburban Vietnamese street, trees, daytime, side view |
| market | busy Vietnamese wet market, fish and vegetable stalls |
| street | sidewalk street food corner, plastic stools, convenience store |
| office | open-plan office, desks, computers, big window |
| cafe | small Vietnamese coffee shop, lanterns, wooden tables |
| park | city park at sunrise, trees, fountain, jogging path |
| gym | modern gym interior, weights, mirrors |
| golf | green golf course, sunny morning |
| shop | small fashion boutique interior, clothing racks |
| boss | executive office, glass wall, city skyline |
| tower | rooftop boardroom at sunset, skyscrapers |
| fair | night funfair, ferris wheel, colorful lights |
| cinema | movie theater interior, red seats, glowing screen |
| date | romantic rooftop restaurant at night, candles, city lights |
| beach | tropical beach, palm trees, turquoise sea |
| pub | Vietnamese beer restaurant, round tables, lanterns |
| bar | nightclub with disco ball, neon purple lights |
| yacht | luxury yacht deck at sunset, sea |
| rain | rainy street at dusk, wet reflections, shop awning |
| alley | dark narrow alley at night, single street lamp |
| yoga | bright yoga studio, mats, plants |
| spa | luxury spa room, bathtub, flowers |
| live | small room set up for livestream selling, ring light, boxes |
| atelier | fashion design studio, mannequins, sketches, fabric |
| runway | fashion show runway, spotlights, photographers at the sides |
| mall | shopping mall interior, luxury storefronts |
| party | high-society gala hall, chandeliers, champagne |
| sofa | cozy living room, big sofa, sunny window |
| studio | photo studio, softbox lights, white backdrop |
| roof | tiled rooftops at night, full moon |

## 5. Cái nào nên làm video

Nhân vật nên là ảnh tách nền, vì video AI không có nền trong suốt. Video dùng cho cảnh toàn màn hình:

1. **Cảnh chạy xe** (`ride-1` … `ride-5`): nhân vật ngồi trên xe, cảnh trôi ngang. Đây là cảnh thưởng quan trọng nhất.
   - Bờm, Na: old bicycle / old motorbike / big motorcycle (Na: modern scooter) / sedan car (Na: pink car) / convertible supercar
   - Mướp: cardboard box pulled by a string / wicker basket carried by a girl / astronaut cat backpack / pet stroller / royal velvet carriage
2. **Giấc mơ VIP** (`dream.mp4`): nhân vật ở look-4 đứng trước nhà cấp 5, ánh sáng lấp lánh, máy quay lia chậm.
3. **Nhà** (`home-0` … `home-5`): cùng lệnh như mục 3, thêm chuyển động nhẹ: `gentle ambient motion, flickering fire / swaying trees / fireworks`.
4. **Bối cảnh đông vui:** fair, bar, beach, party, runway, cinema.

Các bối cảnh còn lại để ảnh tĩnh là đủ.

## 6. Nhân vật phụ (thư mục `npc/`, tách nền, toàn thân)

boss (ông sếp cau có), landlady (bà chủ trọ), girlfriend (bạn gái của Bờm), boyfriend (bạn trai của Na), owner-girl (cô chủ nhỏ của Mướp), old-friend (bạn cũ rủ đầu tư), beggar (người ăn xin), stranger (người lạ áo đen), partner (đối tác mặc vest), lottery-granny (bà cụ bán vé số), dog (chó dữ), kitten (mèo con), rival-cat (mèo đen hàng xóm).

## 7. Thứ tự nên làm

1. 3 hình `look-0` để chốt gương mặt và phong cách.
2. 12 hình `look-1` … `look-4` còn lại.
3. Nhà và 6 bối cảnh dùng nhiều nhất: road, market, street, office, cafe, park.
4. Video chạy xe và giấc mơ.
5. Phần còn lại.

## 8. Hiện trạng bộ hình (17–18/11/2026, tạo bằng Muse AI)

Đã có đủ và game đã nạp qua `art/manifest.json` (thiếu file nào game tự dùng lại hình emoji):

- Nhân vật: `look-0` … `look-4` cho `bom`, `na`, `muop` (PNG nền trong suốt, đã cắt sát người).
- Nhà: `home-0` … `home-5` cho cả ba; Na dùng chung cấp 1, 2, 3, 5 với Bờm.
- Bối cảnh: 30 cảnh trong `bg/`.
- Nhân vật phụ: 13 hình mục 6 + 3 phản diện trong `npc/`.
- Video: `ride-1` … `ride-5` và `dream.mp4` cho cả ba (640x546, đúng tỉ lệ khung sân khấu 540x460, không tiếng).

Game ánh xạ 10 mốc đời sang 5 hình: mốc 0 → look-0, mốc 1–2 → look-1, mốc 3–4 → look-2, mốc 5–6 → look-3, mốc 7–9 → look-4.

Khi thêm hoặc bớt file trong `art/`, nhớ cập nhật danh sách trong `art/manifest.json`.

### Phản diện riêng (file `npc/villain-<nhân vật>.png`, emoji 😈 trong mã)

| Nhân vật | Phản diện | Mô tả |
|---|---|---|
| Bờm | Thiếu gia Khang | arrogant handsome 26-year-old rich heir, slicked-back undercut, burgundy velvet blazer, black turtleneck, gold watch, showing off a car key, contemptuous smirk |
| Na | Tiểu thư Trâm Anh | glamorous haughty 24-year-old rich girl, long glossy straight hair, red lipstick, red blazer dress, high heels, arms crossed, plain black handbag, mocking smile |
| Mướp | Đại ca Sẹo | big fat tough dark grey alley boss cat, one torn ear, scar across one eye, spiked black collar, menacing squint |

### Kinh nghiệm khi tạo bằng Muse

- Mỗi lượt tối đa 4 ảnh hoặc 3 clip (Muse tự làm lại tối đa 6 video mỗi lượt); clip luôn ra 1280x720, 10 giây.
- Chốt gương mặt trước, rồi tạo **bộ ảnh nhiều góc** (3/4 và nghiêng 90 độ) và đính kèm vào mọi lệnh video; không có ảnh nghiêng thì mặt trong cảnh chạy xe bị sai người.
- Lệnh video phải ghi rõ: máy quay ngang hông chạy song song, khoảng cách cố định, hướng chạy trái sang phải, xe chiếm bao nhiêu phần khung, từng món trang phục, cảnh nền, và danh sách cấm (biển hiệu, chữ, logo, kính, mũ).
- Xe hơi luôn bị phóng to gần kín khung; khi đưa vào game phải thu nhỏ và độn nền mờ trên dưới.
- Không xuống dòng khi dán lệnh vào ô chat của Muse (mỗi lần xuống dòng là gửi đi một tin).

## 9. Bản đánh bóng 18/11/2026: âm thanh, pet, cảnh ngủ, hoạt cảnh có hành động

Phần mã nằm ở khối "POLISH LAYER" cuối `game/index.html`.

### File mới (game tự nhận theo `art/manifest.json`)

```
game/art/<nv>/pet-1.png … pet-5.png        thú cưng của Bờm / ổ nằm của Mướp (nền trong suốt)
game/art/<nv>/sleep-0.jpg … sleep-5.jpg    nhân vật ngủ trong chỗ ở theo 6 cấp nhà
game/art/<nv>/act-<buổi>-<cảnh>-<mốc>.mp4  hoạt cảnh có hành động, vd act-2-street-0.mp4 = buổi tối, vỉa hè, mốc đời 0
game/snd/*.mp3                              nhạc nền theo mood + tiếng động
```

Tên clip hoạt cảnh lấy từ `ph`, `bg`, `min` của từng mục trong `ACTS`. Việc nào chưa có clip thì game vẫn dùng nền tĩnh + nhân vật.

### Âm thanh

- Nhạc nền lặp theo mood, tự đổi theo tình huống: `day`, `day2`, `rich` (ban ngày theo mốc đời), `night` (ngủ), `love` (hẹn hò), `dream` (giấc mơ VIP), `tense` / `sad` (biến cố), `choice` (ngã rẽ). Nhạc do mã tổng hợp, không dùng bài có bản quyền.
- Tiếng động lấy từ thư viện SFX của chủ kênh (nhóm sparkle, cash, impact, whoosh).
- Quà tặng ăn mừng theo mức: 1 xu (ting), 10 xu (tada + cha-ching), 100 xu (tada lớn + pháo giấy), 1000 xu (boom + lấp lánh + rung màn hình).
- Biến cố: tiếng hồi hộp khi mở, nhịp tim suốt lúc đếm giờ; ngã rẽ: tiếng báo khi mở, tiếng bấm khi khán giả gõ 1 / 2, tiếng đúng / sai khi chốt.

### Đồ áp lên người

Hình nhân vật giờ chọn theo đồ đang mặc: trung bình bậc của tóc, áo, giày, phụ kiện (mèo: bộ lông và vòng cổ), không thấp hơn mốc đời quá một bậc. Món vừa nhận bay vào người, hiện thành thẻ nhỏ dưới chân; đổi hình thì có hiệu ứng loé sáng.

### Gợi ý kết game

Giấc mơ VIP chỉ hiện vào đêm của ngày chia hết cho 3 (ngày 3, 6, 9, 12, 15).

### Ghi chú khi tạo bằng Muse lần này

- Muse chỉ trả ảnh xem trước rộng 498px trong khung chat (trước đó là 1280px); pet đủ nét, cảnh ngủ phải phóng lên nên hơi mềm.
- Muse từ chối cảnh họp đông người quay lưng ở tiền cảnh và cảnh tiệc có đầm hở vai; đổi sang một mình trong phòng làm việc hoặc trang phục kín đáo thì được.
- Máy quay của Muse luôn đứng gần hơn yêu cầu; khi đưa vào game cắt giữa khung 846x720 rồi thu về 640x546.

## 10. Nhân vật động nền trong suốt (18/11/2026)

Nhân vật là video nền trong suốt (WebM VP9 alpha) đặt trên bối cảnh tĩnh, nên cảnh không đổi khi nhân vật cử động. Mã nằm ở mục "NHÂN VẬT ĐỘNG" trong khối POLISH LAYER của `game/index.html`.

```
game/art/<nv>/anim-<hình>-idle.webm   đứng thở, theo từng bộ đồ (hình 0..4)
game/art/<nv>/anim-<hình>-walk.webm   bước đi tại chỗ, nhìn ngang, mặt hướng sang phải
game/art/<nv>/gs-<buổi>-<cảnh>-<mốc>.webm  hành động có đạo cụ; có file này thì game không dùng clip toàn cảnh act-*.mp4
```

- Tạo bằng Muse trên phông xanh #00B140 (nền và sàn liền một mảng, không bóng đổ, máy khoá cứng, 10 giây), đính kèm ảnh mặt chính diện, 3/4, nghiêng và ảnh toàn thân của bộ đồ.
- Tách nền bằng `gs2.py` (lưu cạnh thư mục ảnh gốc): `gs2.py <clip.mp4> <ra.webm> <pingpong|cycle|plain> [cao] [fps] [số vòng]`. `cycle` dành cho bước đi: ghim người theo đầu, cắt vòng lặp đúng số bước chẵn, in ra `speed_css_px_per_s` để điền vào bảng `WALKV` trong game. Đồ trắng hoặc tóc sáng thì chạy kèm `DESPILL=white`.
- Clip ngồi mà Muse quay sát (chân chạm mép dưới) được game tự phóng to và neo vào mép dưới khung cảnh.
- Safari / iPhone không phát được WebM alpha: game tự quay về ảnh tĩnh.
- Đã có: Bờm đủ 5 bộ đồ (đứng, đi) và 11 hành động. Na và Mướp chưa làm.

### Bổ sung 18/11/2026: đồ tặng, cảm ơn, pet động, hoạt cảnh lặp xuôi

```
game/art/<nv>/anim-<hình>-thx1.webm … thx4.webm   cảm ơn theo 4 mức quà (1, 10, 100, 1000 xu), phát một lần sau khi mở rương xong
game/art/<nv>/pet-<bậc>-idle.webm, pet-<bậc>-walk.webm   thú cưng đứng chơi / di chuyển
```

- Đồ được tặng là mặc thật: món mặc được (tóc, áo, giày, phụ kiện) có bậc cao nhất quyết định cả bộ đồ của nhân vật. Không còn icon dán trên người. Video người thật không ghép lẻ từng món được, nên mỗi món quà nâng cả bộ.
- 4 mức cảm ơn: (1) gật đầu, vẫy tay; (2) chắp tay cúi nhẹ, giơ ngón cái; (3) tay lên ngực, cúi gập 45 độ, làm trái tim; (4) sững sờ, nhảy reo, cúi gập 90 độ, lau nước mắt.
- `gs2.py` có thêm chế độ: `loop` (lặp xuôi, hoà 10 khung cuối về đầu clip; dùng cho hành động và pet), `once` (phát một lần, tự cắt đoạn đứng yên; biến `MAXS`, `THR` chỉnh điểm cắt), `SOFT=1` (thú cưng lông xám/trắng hắt xanh).
- Muse hay cắt ngang đùi ở clip ít cử động: thêm câu "cảnh toàn thân cực rộng, máy cách 6 mét, nhân vật chỉ cao 70% khung" thì ra đúng.
- Danh sách video trong khung chat Muse là danh sách ảo, cuộn ngược (scrollTop âm): phải cuộn quét rồi lọc theo đường dẫn đã tải, nếu không sẽ lấy nhầm clip lượt trước.

## 11. Tương tác live và mảnh ký ức có hình (19/11/2026)

- Sự kiện xoay vòng 3 kiểu, khoảng 45–70 giây một lần (`CFG.eventEvery`): ngã rẽ (bình luận 1/2/3; tặng quà sau khi chọn thì phiếu nặng hơn), biến cố (thả tim, gõ từ khoá `kw` tính x5, tặng quà là cứu ngay), đoán đúng ăn điểm (`GUESS`, đáp án ngẫu nhiên, người đoán trúng được xướng tên). Chuyện đã ra không lặp lại cho tới khi hết danh sách. Kết game có dòng "Cầm lái số phận" (người chọn trúng hướng đi nhiều nhất).
- Ảnh mảnh ký ức: `game/art/<nv>/clue-1.jpg … clue-6.jpg` (vật chứng, hiện trong bảng báo khi nhặt được) và `clue-0.jpg` (bức ảnh sự thật, nằm dưới 6 ô ghép trong khung 🧩 và hiện ở kết cục bí mật). Tạo bằng Muse, ngang 4:3, tông phim cũ, không chữ đọc được.

## 12. Na động (19/11/2026)

- Na đủ 5 bộ đồ × (đứng, đi, 4 mức cảm ơn) = 30 clip trong `game/art/na/`, tách nền bằng `gs3.py` (cùng quy cách Bờm). Na cũng áp luật đủ bộ (`FULLSET` trong game): tóc, váy áo, giày, túi xách cùng bậc mới thay cả bộ.
- Kinh nghiệm Muse với Na: ảnh mặt mẫu có nơ hồng / tóc đuôi ngựa hay bị lây sang bộ khác, nên dặn rõ "Ảnh 1-2 chỉ lấy gương mặt" và dùng ảnh nghiêng tóc xõa (`na_goc-4.jpg`) cho các bộ tóc thả. Clip đi bộ với đầm dài phải dặn "xẻ tà phía chân gần máy quay, gấu chạm mắt cá" thì mới thấy bước chân. Lỗi hay gặp: nhân đôi người, tự zoom giữa clip, mặt nhòe khi lau nước mắt (đã bỏ động tác này ở mức 4).

## 13. Hoà nhân vật vào cảnh, giao diện gọn, nhân vật phụ ảnh thật (19/11/2026)

- Khối "REAL LAYER" cuối `game/index.html`: khung cảnh cao 570px (trước 460), ô đồ / nhiệm vụ / bảng quà thu gọn; nhân vật cao 250 × `ACTK`(1.12).
- Hoà vào cảnh: chỉnh màu + độ bão hoà theo ảnh nền (`toneSync`), sắc trời theo giờ phủ cả nhân vật, hạt phim chung cả cảnh, mưa rơi ở cảnh `rain`, bóng đổ thật vẽ từ khung hình đang chiếu theo hướng nắng từng cảnh (bảng `LIGHT`: `dx` ngả trái/phải, `fw` ngược sáng, `rf` phản chiếu nền bóng/ướt), viền sáng khi ngược sáng. Bóng neo đúng đế giày nhờ đo khoảng trống dưới chân từng clip.
- Na có 14 hoạt cảnh hành động `gs-*.webm` (ăn vặt, bán rong, phụ quán, gọi điện, livestream, xưởng may, điều hành, trà sữa, xem phim, hẹn hò, dự tiệc, du thuyền, yoga, spa). Clip máy đoán sai cảnh cận / toàn thân thì chỉ định trong `GSCUT`. Đang làm việc có đạo cụ thì nhân vật đứng tại chỗ.
- 16 nhân vật phụ ảnh thật mới trong `game/art/npc/` (quản lý chợ, kẻ móc túi, nữ trưởng phòng, quý cô chảnh, hai cô bạn, con buôn hàng nhái, PT gym, đại gia golf, cậu bé bán vòng ốc, em bé, fan quay clip, nhiếp ảnh gia, chó poodle, mèo trắng, cụ già khiếm thị, người đoàn kiểm tra), bảng emoji → ảnh `NPC`, cỡ con vật / trẻ em `NPCH`. Tách nền ảnh tĩnh bằng `art/keyimg.py` (xoá cả khe kín giữa tay và thân). Vật chưa có ảnh hiện trong huy hiệu tròn.
- Sửa: có biến lúc đang ngủ thì nền đổi hẳn, không còn ảnh ngủ sau lưng nhân vật.

## 14. Hệ quả của lựa chọn (19/11/2026)

- Ảnh kết quả `game/art/<nv>/out-<số ngã rẽ>-<a|b|c>[f].jpg` (số ngã rẽ = vị trí trong mảng `CHOICES` của nhân vật, đã gồm ngã rẽ phản diện; `f` = chơi liều rồi thua). Hiện trong bảng chốt lựa chọn và trong bảng "Nhân quả". Tạo bằng Muse, mỗi lượt 4 ảnh, ngang 4:3, đính kèm ảnh mặt nhân vật ở lượt đầu của đoạn chat.
- Clip phản ứng `anim-<hình>-yay|sad|shock.webm` (vui sướng / buồn bã / sững sờ), tách nền `gs3.py once`. Muse rất hay tự zoom cận ở cảnh buồn: dặn "quay như camera an ninh cố định, người chỉ cao 60% khung" thì Na đạt, Bờm vẫn hay hỏng; clip nào bị cắt chân thì bỏ, game tự dùng hiệu ứng dự phòng (xụ xuống / giật mình).
- Mã ở khối "HỆ QUẢ" cuối `index.html`: thanh Nhân phẩm trên HUD, số nhân phẩm bay lên, nhân vật phụ nhảy/lắc theo kết quả, nhân quả quay lại sau 1–2 ngày với lựa chọn nhân phẩm ±2 trở lên (`S.cbq`), một số lựa chọn đổi đồ thật (`eq:{xe:1}`…).

## 15. Âm thanh v2 và rà lỗi Na (19/11/2026)
- Nhạc nền viết lại bằng `art/music2.py` (ngoài repo, `D:\Tuan\Test Game\art\`): lofi/ambient có đoạn A-A-B-A, giai điệu, vang, mỗi bài 40-115 giây, độ lớn trung bình khoảng -23 dB (bản cũ -13 dB). Độ dài vòng lặp ghi vào `MUSIC` trong POLISH LAYER.
- Nhạc tự hạ (ducking) khi có tiếng quan trọng: bảng `KEY` (tên tiếng → [mức nhạc còn lại, số giây giữ]). Mở sự kiện chỉ còn một tiếng rõ (`notify` / `dundun` / `thunder`), chốt kết quả `snap` → `right`/`wrong`/`dundun`; tiếng thả tim và bình luận nhỏ và thưa hơn.
- `gs3.py` có thêm chế độ `seam`: nối vòng ở cặp khung giống nhau nhất, chỉ hoà 3 khung; dùng thay `loop` (hoà 10 khung đầu-cuối gây bóng ma khi người đổi tư thế).
- `GSLOOK` trong game: hoạt cảnh chỉ hiện khi bộ đồ trong clip trùng bộ Na đang mặc, tránh nhảy đồ.
- Na bộ 1 đi bộ: làm lại vì bản cũ khuỵu gối; lệnh Muse phải dặn "lưng thẳng, chân duỗi thẳng khi chạm đất, không khuỵu gối, không nhún".
