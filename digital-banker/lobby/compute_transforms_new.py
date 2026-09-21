import json
import numpy as np
import cv2
from PIL import Image

ROOT = r"c:\Users\Xeon\Documents\GitHub\Digital-Banker-screen-v1"

# ---------- 1. Wall layer size (arches now live in wall.png's own coordinate
# space, since they are architecturally part of the wall layer and must move
# with it in the two-speed parallax) ----------
wall = Image.open(f"{ROOT}/layers/wall.png")
WALL_W, WALL_H = wall.size
print("WALL:", WALL_W, WALL_H)

# ---------- 2. Template zone detection on layers/template-guide.png ----------
tpl = Image.open(f"{ROOT}/layers/template-guide.png").convert("RGBA")
assert tpl.size == (WALL_W, WALL_H)
tarr = np.array(tpl)

a = tarr[:, :, :3].astype(np.int16)
mx = np.max(a, axis=2)
mn = np.min(a, axis=2)
sat = (mx - mn) / np.clip(mx, 1, None)
mask = (sat < 0.12) & (mx > 150) & (tarr[:, :, 3] > 200)
mask_u8 = (mask * 255).astype(np.uint8)
kernel = np.ones((3, 3), np.uint8)
mask_clean = cv2.morphologyEx(mask_u8, cv2.MORPH_OPEN, kernel)

n, labels, stats, centroids = cv2.connectedComponentsWithStats(mask_clean, connectivity=8)
comps = []
for i in range(1, n):
    x, y, w, h, area = stats[i]
    if area > 5000:
        comps.append((x, i))
comps.sort()
assert len(comps) == 6, f"expected 6 zones, found {len(comps)}"

panel_corners = {}
for idx, (x0, label_id) in enumerate(comps):
    arch_id = idx + 1
    comp_mask = (labels == label_id).astype(np.uint8) * 255
    contours, _ = cv2.findContours(comp_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    c = max(contours, key=cv2.contourArea)
    peri = cv2.arcLength(c, True)
    approx = None
    for eps_frac in [0.01, 0.02, 0.03, 0.05, 0.08, 0.12]:
        cand = cv2.approxPolyDP(c, eps_frac * peri, True)
        if len(cand) == 4:
            approx = cand
            break
    assert approx is not None, f"zone {arch_id}: could not approximate a quad"
    pts = approx.reshape(-1, 2).astype(float)
    top2 = pts[np.argsort(pts[:, 1])[:2]]
    bot2 = pts[np.argsort(pts[:, 1])[2:]]
    TL = top2[np.argmin(top2[:, 0])]
    TR = top2[np.argmax(top2[:, 0])]
    BL = bot2[np.argmin(bot2[:, 0])]
    BR = bot2[np.argmax(bot2[:, 0])]
    panel_corners[arch_id] = {"TL": TL.tolist(), "TR": TR.tolist(), "BR": BR.tolist(), "BL": BL.tolist()}
    panel_w = ((TR[0] - TL[0]) ** 2 + (TR[1] - TL[1]) ** 2) ** 0.5
    print(f"zone {arch_id}: TL={TL} TR={TR} BR={BR} BL={BL}  top-edge-len={panel_w:.1f}")

# ---------- 3. FULL bbox + MAIN ARCH BBOX (largest connected alpha component) ----------
arches = {}
for i in range(1, 7):
    im = Image.open(f"{ROOT}/arches-new/{i}.png")
    arr = np.array(im)
    alpha = arr[:, :, 3]

    ys, xs = np.where(alpha > 0)
    fx0, fx1 = int(xs.min()), int(xs.max())
    fy0, fy1 = int(ys.min()), int(ys.max())
    full_bbox = {"x": fx0, "y": fy0, "w": fx1 - fx0 + 1, "h": fy1 - fy0 + 1}

    cropped = im.crop((fx0, fy0, fx1 + 1, fy1 + 1))
    cropped.save(f"{ROOT}/cropped-new/{i}.png")

    mask = (alpha > 0).astype(np.uint8) * 255
    ncomp, labels_img, stats, _ = cv2.connectedComponentsWithStats(mask, connectivity=8)
    comp_list = []
    for lbl in range(1, ncomp):
        x, y, w, h, area = stats[lbl]
        comp_list.append((int(area), int(x), int(y), int(w), int(h)))
    comp_list.sort(reverse=True)
    main_area, mx0, my0, mw, mh = comp_list[0]
    other_large = [c for c in comp_list[1:] if c[0] > 2000]

    main_arch_bbox = {"x": mx0, "y": my0, "w": mw, "h": mh}

    arches[i] = {
        "original_size": [im.size[0], im.size[1]],
        "full_bbox": full_bbox,
        "cropped_size": [full_bbox["w"], full_bbox["h"]],
        "main_arch_bbox": main_arch_bbox,
        "num_components": ncomp - 1,
        "main_component_area": main_area,
        "other_large_components": [
            {"area": a_, "x": x_, "y": y_, "w": w_, "h": h_} for (a_, x_, y_, w_, h_) in other_large
        ],
    }
    print(f"arch {i}: {ncomp-1} components, largest area={main_area} -> MAIN_ARCH_BBOX={main_arch_bbox}")
    if other_large:
        print(f"    other components with area>2000: {other_large}")

# ---------- 4. Homography: X from MAIN_ARCH_BBOX, Y from FULL bbox ----------
def homography_to_matrix3d(H):
    Hn = H / H[2, 2]
    a1, a2, tx = Hn[0, 0], Hn[0, 1], Hn[0, 2]
    b1, b2, ty = Hn[1, 0], Hn[1, 1], Hn[1, 2]
    w1, w2 = Hn[2, 0], Hn[2, 1]
    return [a1, b1, 0, w1, a2, b2, 0, w2, 0, 0, 1, 0, tx, ty, 0, 1.0]

def project(coefs, x, y):
    a1, a2, tx, b1, b2, ty, w1, w2 = coefs
    denom = w1 * x + w2 * y + 1
    return (a1 * x + a2 * y + tx) / denom, (b1 * x + b2 * y + ty) / denom

for i in range(1, 7):
    fb = arches[i]["full_bbox"]
    mb = arches[i]["main_arch_bbox"]
    c = panel_corners[i]

    lx0 = mb["x"] - fb["x"]
    lx1 = mb["x"] + mb["w"] - fb["x"]
    full_h = fb["h"]

    src = np.array([[lx0, 0], [lx1, 0], [lx1, full_h], [lx0, full_h]], dtype=np.float32)
    dst = np.array([c["TL"], c["TR"], c["BR"], c["BL"]], dtype=np.float32)

    Hmat = cv2.getPerspectiveTransform(src, dst)
    m3d = homography_to_matrix3d(Hmat)
    m3d = [round(v, 9) if abs(v) > 1e-12 else 0.0 for v in m3d]
    a1, b1, _, w1, a2, b2, _, w2, _, _, _, _, tx, ty, _, _ = m3d
    coefs = (a1, a2, tx, b1, b2, ty, w1, w2)

    errs = []
    for (sx, sy), (dx, dy) in zip(src, dst):
        px, py = project(coefs, sx, sy)
        errs.append(((px - dx) ** 2 + (py - dy) ** 2) ** 0.5)
    max_err = max(errs)

    full_w = arches[i]["cropped_size"][0]
    left_top = project(coefs, lx0, 0); left_bot = project(coefs, lx0, full_h)
    right_top = project(coefs, lx1, 0); right_bot = project(coefs, lx1, full_h)
    panel_top_w = ((c["TR"][0]-c["TL"][0])**2 + (c["TR"][1]-c["TL"][1])**2) ** 0.5
    panel_bot_w = ((c["BR"][0]-c["BL"][0])**2 + (c["BR"][1]-c["BL"][1])**2) ** 0.5
    arch_top_w = ((right_top[0]-left_top[0])**2 + (right_top[1]-left_top[1])**2) ** 0.5
    arch_bot_w = ((right_bot[0]-left_bot[0])**2 + (right_bot[1]-left_bot[1])**2) ** 0.5

    arches[i]["arch_x_local"] = {"lx0": lx0, "lx1": lx1}
    arches[i]["corners_px"] = {k: [round(v, 3) for v in c[k]] for k in ["TL", "TR", "BR", "BL"]}
    arches[i]["matrix3d"] = m3d
    arches[i]["max_corner_error_px"] = round(max_err, 6)
    arches[i]["fill_ratio_top"] = round(arch_top_w / panel_top_w, 4)
    arches[i]["fill_ratio_bottom"] = round(arch_bot_w / panel_bot_w, 4)
    print(f"arch {i}: max_corner_error_px={max_err:.6f}  fill_top={arches[i]['fill_ratio_top']*100:.1f}%  fill_bottom={arches[i]['fill_ratio_bottom']*100:.1f}%")

result = {
    "meta": {
        "coordinate_system_note": f"Arches now live in layers/wall.png's OWN pixel space ({WALL_W}x{WALL_H}), not the old 2546x900 BACKGROUND stage -- they are DOM children of the wall layer group so they inherit its translateX parallax and stay visually attached to the wall.",
        "arch_bbox_method": "Width of the source quad comes from the largest CONNECTED COMPONENT of the alpha mask (the actual arch body polygon) -- not the raw alpha>0 bbox. Height of the source quad spans the full (title+arch) cropped image, 0..full_h.",
        "alpha_threshold": "alpha > 0 for full_bbox export/crop. MAIN_ARCH_BBOX uses connectedComponentsWithStats over the same alpha>0 mask, keeping only the largest-area component.",
        "homography_method": "cv2.getPerspectiveTransform(src=[ (mainArchX0,0),(mainArchX1,0),(mainArchX1,full_h),(mainArchX0,full_h) ], dst=[TL,TR,BR,BL] of template-guide zone) -> CSS matrix3d, applied to the FULL (title+arch) cropped-new image element.",
    },
    "wall_layer": {"width": WALL_W, "height": WALL_H},
    "arches": arches,
}

with open(f"{ROOT}/arch_transforms_new.json", "w", encoding="utf-8") as f:
    json.dump(result, f, indent=2, ensure_ascii=False)

print("\nDone. Max error across all arches:", max(arches[i]["max_corner_error_px"] for i in arches))
