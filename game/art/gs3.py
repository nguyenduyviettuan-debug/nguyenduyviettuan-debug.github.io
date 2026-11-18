"""gs3.py - tách nền xanh bản nét cao -> WebM VP9 có alpha.
Khác gs2: giữ độ phân giải gốc (không thu về 480), tính viền ở độ phân giải GẤP ĐÔI rồi thu về (mép mịn, hết răng cưa),
ghim người đi bộ chính xác nửa điểm ảnh mà không làm nhoè, chỉ nén MỘT lần.

gs3.py <src.mp4> <out.webm> <pingpong|cycle|loop|once|plain> [cao chuẩn=672]
Biến môi trường: DESPILL=white (đồ trắng/tóc sáng) · SOFT=1 (thú cưng lông xám/trắng) · MAXS, THR (điểm cắt của 'once')
                 SECS (chỉ lấy N giây đầu) · SKIP (bỏ N giây đầu) · CRF (mặc định 28) · REPS (số vòng của 'cycle', mặc định 3)
Quy ước cỡ: clip đứng cao đúng <cao chuẩn> px; game hiển thị videoHeight*250/672 px."""
import sys, os, subprocess, json
import numpy as np
from scipy import ndimage
from PIL import Image

src, out, mode = sys.argv[1], sys.argv[2], sys.argv[3]
TH = int(sys.argv[4]) if len(sys.argv) > 4 else 672
FPS = 24
E = os.environ.get
SOFT = bool(E('SOFT')); WHITE = E('DESPILL') == 'white'
REPS = int(E('REPS') or 3); CRF = E('CRF') or '28'
PAD = 16

pr = json.loads(subprocess.run(['ffprobe', '-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height', '-of', 'json', src], capture_output=True, text=True).stdout)['streams'][0]
W, H = pr['width'], pr['height']
raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', src, '-vf', f'fps={FPS}', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], capture_output=True).stdout
fr = np.frombuffer(raw, np.uint8).reshape(-1, H, W, 3)
if E('SKIP'): fr = fr[int(float(E('SKIP')) * FPS):]
if E('SECS'): fr = fr[:int(float(E('SECS')) * FPS)]
N = len(fr)
info = {}

def raw_alpha(f, d0, r0):
    """f: float32 HxWx3 -> (alpha 0..1 chưa làm mịn, d)"""
    r, g, b = f[..., 0], f[..., 1], f[..., 2]
    mx = np.maximum(r, b); d = g - mx; ratio = d / np.maximum(g, 1)
    if SOFT:
        a_abs = np.clip((0.92 * d0 - d) / (0.27 * d0), 0, 1); a_rat = np.clip((0.92 * r0 - ratio) / (0.27 * r0), 0, 1)
        w = np.clip((g - 12) / 15, 0, 1)
    else:
        a_abs = np.clip((0.80 * d0 - d) / (0.45 * d0), 0, 1); a_rat = np.clip((0.70 * r0 - ratio) / (0.40 * r0), 0, 1)
        w = np.clip((g - 25) / 30, 0, 1)
    return a_abs * (1 - w) + np.minimum(a_abs, a_rat) * w, d

# ---------- 1. lượt nhanh ở độ phân giải gốc: mức xanh của nền, mặt nạ thô ----------
D0 = np.zeros(N, np.float32); R0 = np.zeros(N, np.float32); qa = np.zeros((N, H, W), bool)
for i in range(N):
    f = fr[i].astype(np.float32); g = f[..., 1]; d = g - np.maximum(f[..., 0], f[..., 2]); ratio = d / np.maximum(g, 1)
    bd = np.concatenate([d[:30].ravel(), d[:, :30].ravel(), d[:, -30:].ravel()])
    br = np.concatenate([ratio[:30].ravel(), ratio[:, :30].ravel(), ratio[:, -30:].ravel()])
    D0[i] = max(20.0, float(np.median(bd))); R0[i] = max(0.2, float(np.median(br)))
    m = raw_alpha(f, D0[i], R0[i])[0] > 0.5
    lab, n = ndimage.label(m[::2, ::2])
    if n > 1:
        sz = ndimage.sum(m[::2, ::2], lab, range(1, n + 1)); keep = np.isin(lab, 1 + np.nonzero(sz > 0.02 * sz.max())[0])
        m &= np.repeat(np.repeat(ndimage.binary_dilation(keep, iterations=2), 2, 0), 2, 1)[:H, :W]
    qa[i] = m

# ---------- 2. chọn dãy khung ----------
shift = np.zeros(N)                     # dịch ngang (px gốc) để ghim người đi bộ
blend = {}                              # vị trí trong dãy -> (khung a, khung b, trọng số b)
if mode == 'cycle':
    from scipy.signal import find_peaks
    hx = []; hh = []
    for m in qa:
        ys = np.where(m.any(1))[0]; y0, y1 = ys.min(), ys.max(); hh.append(y1 - y0)
        xs = np.where(m[y0:y0 + int((y1 - y0) * 0.14)].any(0))[0]; hx.append((xs.min() + xs.max()) / 2)
    hx = np.array(hx); t = np.arange(N); trend = np.polyval(np.polyfit(t, hx, 2), t)
    shift = W / 2 - trend
    st = np.stack([np.roll(qa[i], int(round(shift[i])), axis=1) for i in range(N)])
    spd = []
    for m in st:
        ys = np.where(m.any(1))[0]; band = m[ys.max() - int((ys.max() - ys.min()) * 0.12):ys.max() + 1]
        xs = np.where(band.any(0))[0]; spd.append(xs.max() - xs.min())
    spd = np.array(spd); pk, _ = find_peaks(spd, distance=6, prominence=0.15 * spd.max())
    P = float(np.median(np.diff(pk))); step_px = float(np.median(spd[pk]) - np.percentile(spd, 4))
    info.update(step_frames=round(P, 1), step_px=round(step_px), person_h=int(np.median(hh)), walk_px_per_s=round(step_px / P * FPS, 1))
    sm = st[:, ::4, ::4].astype(np.float32)
    best = (1e9, 0, 0); lo = int(FPS * 1.6); K = 3
    okd = set(dd for n2 in (4, 6, 8) for dd in range(int(round(n2 * P)) - 2, int(round(n2 * P)) + 3))
    for i in range(max(K, int(FPS * 0.5)), N - lo):
        for j in range(i + lo, N - 2):
            if (j - i) not in okd: continue
            e = float(np.mean((sm[i] - sm[j]) ** 2) + np.mean((sm[i + 1] - sm[j + 1]) ** 2) + np.mean((sm[i - 1] - sm[j - 1]) ** 2))
            e /= 1 + 0.02 * (j - i) / FPS
            if e < best[0]: best = (e, i, j)
    e, i, j = best; info.update(loop=[i, j], seam_err=round(e, 5))
    order = list(range(i, j))
    for k in range(K):
        blend[len(order) - K + k] = (j - K + k, i - K + k, (k + 1) / (K + 1))
    del st, sm
elif mode == 'pingpong':
    order = list(range(N)) + list(range(N - 2, 0, -1))
elif mode == 'loop':
    K = 10; order = list(range(K, N))
    for k in range(K):
        blend[len(order) - K + k] = (N - K + k, k, (k + 1) / (K + 1))
elif mode == 'once':
    sm = qa[:, ::6, ::6].astype(np.float32) + fr[:, ::6, ::6].mean(-1) / 255 * qa[:, ::6, ::6]
    mo = np.concatenate([[0], np.mean(np.abs(sm[1:] - sm[:-1]), axis=(1, 2))]); mo = ndimage.uniform_filter1d(mo, 7)
    act = np.where(mo > float(E('THR') or 0.30) * mo.max())[0]
    a0 = max(0, int(act.min()) - 8); a1 = min(N, max(int(act.max()) + 14, a0 + int(FPS * 2.5)))
    if E('MAXS'): a1 = min(a1, a0 + int(float(E('MAXS')) * FPS))
    info['once'] = [a0, a1]; order = list(range(a0, a1))
else:
    order = list(range(N))

used = sorted(set(order) | {x for a, b, _ in blend.values() for x in (a, b)})

# ---------- 3. khung cắt chung (theo toạ độ đã ghim) ----------
cols = np.zeros(W); rows = np.zeros(H)
for i in used[::2]:
    m = np.roll(qa[i], int(round(shift[i])), axis=1) if mode == 'cycle' else qa[i]
    cols += m.sum(0); rows += m.sum(1)
xs = np.where(cols > 0.004 * cols.max())[0]; ys = np.where(rows > 0.004 * rows.max())[0]
x0, x1 = max(0, xs.min() - PAD), min(W, xs.max() + PAD); y0, y1 = max(0, ys.min() - PAD), min(H, ys.max() + PAD)
w, h = int(x1 - x0), int(y1 - y0); w -= w % 2; h -= h % 2
rest_h = None
if mode == 'once':
    yy = np.where(qa[N - 1].any(1))[0]; rest_h = (yy.max() - yy.min()) + 2 * PAD
del qa

# ---------- 4. tách nền từng khung ở độ phân giải gấp đôi ----------
def matte(i):
    xa = x0 - shift[i]; xi = int(np.floor(xa)) - 1; off2 = int(round(2 * (xa - xi)))     # lệch ngang tính theo điểm ảnh 2x
    lo_, hi_ = xi, xi + w + 3
    c = np.zeros((h, hi_ - lo_, 3), np.uint8); c[..., 1] = 177
    sl, sh = max(0, lo_), min(W, hi_)
    if sh > sl: c[:, sl - lo_:sh - lo_] = fr[i][y0:y0 + h, sl:sh]
    if sl > lo_: c[:, :sl - lo_] = c[:, sl - lo_:sl - lo_ + 1]
    if sh < hi_: c[:, sh - lo_:] = c[:, sh - lo_ - 1:sh - lo_]
    big = np.asarray(Image.fromarray(c).resize((c.shape[1] * 2, h * 2), Image.BICUBIC), np.float32)[:, off2:off2 + 2 * w]
    a, d = raw_alpha(big, D0[i], R0[i]); d0 = D0[i]
    r, g, b = big[..., 0], big[..., 1], big[..., 2]; mx = np.maximum(r, b)
    lab, n = ndimage.label(a > 0.5)
    if n > 1:
        sz = ndimage.sum(a > 0.5, lab, range(1, n + 1)); keep = np.isin(lab, 1 + np.nonzero(sz > 0.02 * sz.max())[0])
        a = a * ndimage.binary_dilation(keep, iterations=6)
    if SOFT:
        solid = ndimage.binary_fill_holes(a > 0.5)
        a = np.maximum(a, (ndimage.binary_erosion(solid, iterations=4) & (d < 0.85 * d0)).astype(np.float32))
    # khử ám xanh
    if WHITE:
        avg = (r + b) / 2; spill = np.clip(g - avg, 0, None); bright = np.clip((np.minimum(r, b) - 90) / 60, 0, 1)
        g2 = g - spill * (0.55 + 0.45 * bright); g2 = np.where(d > 0, np.minimum(g2, mx + 2), g2)
        rgb = np.dstack([r + np.clip(b - r, 0, None) * 0.7 * bright * (spill > 2), g2, b])
    elif SOFT:
        g2 = np.where(d > 0, np.minimum(g, (r + b) / 2 + 0.25 * np.abs(r - b) + 2), g)
        k = np.clip((d - 0.55 * d0) / (0.2 * d0), 0, 1); lum = np.minimum(r, b) * 0.8
        rgb = np.dstack([r * (1 - k) + lum * k, g2 * (1 - k) + lum * k, b * (1 - k) + lum * k])
    else:
        rgb = np.dstack([r, np.where(d > 0, np.minimum(g, mx + 2), g), b])
    # mép: làm mịn rồi nắn lại cho gọn (bóp ~0.5px gốc), không dùng bộ lọc cực tiểu nên không răng cưa
    a = ndimage.gaussian_filter(a, 1.15); a = np.clip((a - 0.34) / 0.52, 0, 1); a = a * a * (3 - 2 * a)
    # viền lấy màu của điểm chắc chắn thuộc chủ thể gần nhất -> không viền xanh
    core = ndimage.binary_erosion(a > 0.97, iterations=3)
    if core.any():
        idx = ndimage.distance_transform_edt(~core, return_distances=False, return_indices=True)
        rgb = np.where((~core)[..., None], rgb[idx[0], idx[1]], rgb)
    # thu về 1x bằng trung bình 2x2
    A = a.reshape(h, 2, w, 2).mean((1, 3)); C = rgb.reshape(h, 2, w, 2, 3).mean((1, 3))
    # làm nét nhẹ phần màu (nguồn Muse hơi mềm)
    C = C + 0.45 * (C - ndimage.gaussian_filter(C, (1.0, 1.0, 0)))
    return np.dstack([C, A[..., None] * 255]).clip(0, 255).astype(np.uint8)

cache = {i: matte(i) for i in used}
if mode == 'once' and rest_h: TH = int(round(TH * h / rest_h / 2)) * 2
ow = int(round(w * TH / h / 2)) * 2
if mode == 'cycle': info['speed_css_px_per_s'] = round(info['walk_px_per_s'] * TH / h * 250 / 672, 1)

def frame(p):
    if p in blend:
        a, b, wt = blend[p]; return (cache[a].astype(np.float32) * (1 - wt) + cache[b].astype(np.float32) * wt).astype(np.uint8)
    return cache[order[p]]

vf = [] if (ow, TH) == (w, h) else ['-vf', f'scale={ow}:{TH}:flags=lanczos']
p = subprocess.Popen(['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgba', '-s', f'{w}x{h}', '-r', str(FPS), '-i', '-', *vf,
                      '-c:v', 'libvpx-vp9', '-pix_fmt', 'yuva420p', '-b:v', '0', '-crf', CRF, '-g', '48', '-auto-alt-ref', '0', '-row-mt', '1', '-an', out], stdin=subprocess.PIPE)
for _ in range(REPS if mode == 'cycle' else 1):
    for q in range(len(order)): p.stdin.write(frame(q).tobytes())
p.stdin.close(); p.wait()
idx = np.linspace(0, len(order) - 1, 6).astype(int)
for name, col in (('_dark', (24, 24, 28)), ('_light', (235, 235, 235))):
    sheet = Image.new('RGB', (w * 6, h), col)
    for k, t in enumerate(idx):
        im = Image.fromarray(frame(int(t)), 'RGBA'); sheet.paste(im, (k * w, 0), im)
    sheet.save(out.replace('.webm', name + '.jpg'), quality=92)
print(json.dumps({'out': os.path.basename(out), 'size': [ow, TH], 'crop': [int(x0), int(y0), w, h], 'frames': len(order), 'kb': os.path.getsize(out) // 1024, **info}))
