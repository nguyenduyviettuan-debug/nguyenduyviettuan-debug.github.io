"""track.py <thư mục chứa webm> [mẫu tên...]  -> ghi <tên>.trk.json cạnh mỗi clip.
Mốc từng khung để game ghép từng món: đỉnh đầu (top), tâm chỏm đầu (hcx), đáy bàn chân (bot), tâm hai chân (fcx),
khoảng cách đỉnh đầu -> cổ (neck, hằng số cả clip) và đáy -> mắt cá (ank). Đơn vị: điểm ảnh của clip."""
import sys, os, glob, json, subprocess, numpy as np
from scipy import ndimage
d = sys.argv[1]; pats = sys.argv[2:] or ['anim-*.webm']
for pat in pats:
    for p in sorted(glob.glob(os.path.join(d, pat))):
        pr = json.loads(subprocess.run(['ffprobe', '-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height', '-of', 'json', p], capture_output=True, text=True).stdout)['streams'][0]
        w, h = pr['width'], pr['height']
        raw = subprocess.run(['ffmpeg', '-v', 'error', '-c:v', 'libvpx-vp9', '-i', p, '-vf', 'alphaextract,format=gray', '-f', 'rawvideo', '-'], capture_output=True).stdout
        al = np.frombuffer(raw, np.uint8).reshape(-1, h, w) > 128
        M = []; off = []
        for a in al:
            ys = np.where(a.any(1))[0]
            if not len(ys): M.append(M[-1] if M else [0, h, 0, w / 2, h, w / 2]); continue
            top, bot = ys.min(), ys.max(); ph = bot - top; wd = a.sum(1)
            nk = top + int(ph * .10) + int(np.argmin(wd[top + int(ph * .10):top + max(int(ph * .22), int(ph * .10) + 2)])); off.append(nk - top)
            xs = np.where(a[top:top + max(4, int(ph * .05))].any(0))[0]; hcx = (xs.min() + xs.max()) / 2
            xs2 = np.where(a[top + int(ph * .915):bot + 1].any(0))[0]; fcx = (xs2.min() + xs2.max()) / 2
            M.append([top, ph, 0, hcx, bot, fcx])
        M = np.array(M, np.float32); Hm = float(np.median(M[:, 1]))
        M = ndimage.uniform_filter1d(ndimage.median_filter(M, size=(5, 1), mode='nearest'), 5, axis=0, mode='nearest')
        r = lambda x: [round(float(v), 1) for v in x]
        json.dump({'n': len(M), 'w': w, 'h': h, 'neck': round(float(np.median(off)), 1), 'ank': round(0.085 * Hm, 1), 'top': r(M[:, 0]), 'hcx': r(M[:, 3]), 'bot': r(M[:, 4]), 'fcx': r(M[:, 5])},
                  open(p[:-5] + '.trk.json', 'w'), separators=(',', ':'))
        print(os.path.basename(p), len(M), 'neck', round(float(np.median(off)), 1))
