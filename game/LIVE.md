# Chơi Lên Đời trên TikTok LIVE thật

Game nhận quà, bình luận, tim, follow và share của người xem qua **TikFinity**. TikFinity là phần mềm miễn phí, đọc sự kiện của phiên live rồi chuyển sang game qua địa chỉ `ws://localhost:21213`.

## Chuẩn bị (một lần)
1. Tài khoản TikTok phải được phép LIVE, hoặc có quyền dùng TikTok LIVE Studio.
2. Cài **TikFinity bản máy tính (Desktop App)** từ trang chính thức `tikfinity.zerody.one`. Đăng nhập rồi nhập tên kênh TikTok. Game cần bản máy tính, vì chỉ bản này mở cổng `localhost:21213`.
3. Cài OBS hoặc dùng TikTok LIVE Studio.

## Mỗi lần live
1. Mở TikFinity, bấm kết nối vào phiên live đang phát.
2. Trong OBS hoặc LIVE Studio, thêm nguồn **Trình duyệt (Browser Source)**:
   - Địa chỉ: `https://nguyenduyviettuan-debug.github.io/game/?char=bom&live=1` (đổi `bom` thành `na` hoặc `muop`).
   - Kích thước: **1080 × 1920** (khung dọc).
   - Bật "Control audio via OBS" để chỉnh tiếng game riêng.
3. Góc trên bên trái game hiện trạng thái kết nối:
   - 🟢 Đã nối TikTok LIVE: chữ tự ẩn sau 5 giây.
   - 🟡 Đang nối.
   - 🔴 Chưa nối được TikFinity: kiểm tra TikFinity đã mở và đã kết nối phiên live chưa.
4. Khi người xem tương tác thật lần đầu, game tự bấm "Bắt đầu".

## Phím tắt
Bấm chuột phải vào nguồn trong OBS → Interact, rồi dùng các phím:

| Phím | Việc |
|---|---|
| Space | Bắt đầu |
| M | Bật/tắt tiếng |
| E | Gọi sự kiện (ngã rẽ / biến cố) ngay |
| P | Hiện bảng giả lập để thử |
| N | Sang nhân vật mới |
| H | Ẩn/hiện bảng phím tắt |

## Luật đổi quà
- Quà combo (bấm Hoa hồng liên tục) được tính **một lần** khi chuỗi kết thúc, theo tổng số xu.
- Quà trên 1.000 xu tăng chậm dần, tối đa tương đương 1.500 xu. Ví dụ Sư tử 29.999 xu tính như khoảng 1.443 xu. Nhờ vậy một món quà không kết thúc cả đời nhân vật trong vài giây.
- Mỗi người follow hoặc share chỉ được tính **một lần** mỗi đời, để tránh follow rồi bỏ follow để kiếm lượt quay.
- Bình luận `1`, `2`, `3` dùng để bỏ phiếu ngã rẽ. Gõ đúng từ khoá thì cứu biến cố.

## Lưu ý
- TikTok không có cổng chính thức công khai để đọc quà. TikFinity đọc theo cách không chính thức nên đôi khi chậm hoặc rớt; game tự nối lại sau 3 giây.
- Muốn nối nguồn khác (máy chủ riêng) thì dùng `?tt=ws://địa-chỉ:cổng`. Dạng tin nhắn giống TikTok-Live-Connector: `{"event":"gift","data":{...}}`.
