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
