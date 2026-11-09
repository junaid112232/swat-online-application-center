"""Default artwork generator: renders the WebGL valley scene at 4K to JPEG, plus logo + OG image.
Needs: pip install playwright pillow  (and: playwright install chromium).  Optional - assets are already shipped."""
import os, base64
from PIL import Image, ImageDraw, ImageFont
from playwright.sync_api import sync_playwright

ROOT = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(ROOT, "site", "assets", "defaults")
SCENE = os.path.join(ROOT, "site", "assets", "js", "scene.js")
os.makedirs(OUT, exist_ok=True)
HTML = """<!DOCTYPE html><html><body style="margin:0"><canvas id="c" style="width:800px;height:450px"></canvas>
<script src="file://%s"></script><script>
window.render=function(pal,t,w,h){var c=document.getElementById('c');var k=SwatScene.start(c,{still:true,cycle:false,palette:pal,time:t,fixedSize:[w,h]});if(!k)return null;return c.toDataURL('image/jpeg',0.93);}
</script></body></html>""" % SCENE

JOBS = [("swat-1", 0, 30), ("swat-2", 1, 12), ("swat-3", 2, 25), ("swat-4", 3, 18), ("swat-5", 4, 40), ("swat-6", 0, 75)]

def shot(pg, pal, t, w, h, path):
    data = pg.evaluate("render(%d,%f,%d,%d)" % (pal, t, w, h))
    assert data, "WebGL render failed"
    open(path, "wb").write(base64.b64decode(data.split(",")[1]))

if __name__ == "__main__":
    with sync_playwright() as p:
        b = p.chromium.launch(args=["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist", "--allow-file-access-from-files"])
        pg = b.new_page()
        h = os.path.join(OUT, "_h.html"); open(h, "w").write(HTML)
        pg.goto("file://" + h)
        for nm, pal, t in JOBS:
            path = os.path.join(OUT, nm + ".jpg")
            shot(pg, pal, t, 3840, 2160, path)
            im = Image.open(path)
            im.resize((960, 540), Image.LANCZOS).save(os.path.join(OUT, nm + "-s.jpg"), quality=78, optimize=True, progressive=True)
            print("made", nm, os.path.getsize(path) // 1024, "KB")
        shot(pg, 0, 30, 1920, 1080, os.path.join(OUT, "poster.jpg"))
        shot(pg, 0, 30, 1200, 630, os.path.join(OUT, "og_base.jpg"))
        b.close()
        os.remove(h)
    og = Image.open(os.path.join(OUT, "og_base.jpg")).convert("RGB")
    dr = ImageDraw.Draw(og, "RGBA")
    dr.rectangle([0, 0, 1200, 630], fill=(2, 8, 18, 130))
    F = "/usr/share/fonts/truetype/google-fonts/Poppins-Bold.ttf"
    try:
        fb, fm = ImageFont.truetype(F, 78), ImageFont.truetype(F, 32)
    except OSError:
        fb = fm = ImageFont.load_default(size=60)
    dr.text((70, 190), "Swat Online", font=fb, fill=(255, 255, 255, 255))
    dr.text((70, 278), "Application Center", font=fb, fill=(245, 181, 10, 255))
    dr.text((72, 392), "Jobs  |  Admissions  |  Scholarships  |  Passport & CNIC", font=fm, fill=(220, 238, 245, 255))
    dr.text((72, 450), "WhatsApp / Call  0346 0553153", font=fm, fill=(25, 227, 177, 255))
    og.save(os.path.join(OUT, "og.jpg"), quality=88, optimize=True)
    os.remove(os.path.join(OUT, "og_base.jpg"))
    LOGO = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#19e3b1"/><stop offset="1" stop-color="#0b6e8a"/></linearGradient><linearGradient id="m" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#bfeee6"/></linearGradient></defs><rect width="128" height="128" rx="30" fill="url(#g)"/><circle cx="92" cy="38" r="11" fill="#f5b50a"/><path d="M12 92 50 32l20 30 12-16 34 46z" fill="url(#m)"/><path d="M50 32l-9 14 9-4 7 7 4-6z" fill="#fff" opacity=".9"/><path d="M38 98l15 15 37-37" fill="none" stroke="#0b1f2a" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/></svg>'''
    open(os.path.join(OUT, "logo.svg"), "w").write(LOGO)
    open(os.path.join(OUT, "favicon.svg"), "w").write(LOGO)
    print("assets done")
