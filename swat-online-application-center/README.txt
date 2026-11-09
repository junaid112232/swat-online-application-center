SWAT ONLINE APPLICATION CENTER - Website (Python + HTML/CSS/JavaScript + WebGL)
================================================================================

1) CHALANE KA TAREEQA (apne computer par)
   - python.org se Python 3.8+ install karein ("Add Python to PATH" tick karein). Aur kuch install nahi karna.
   - START_WEBSITE.bat par double-click karein (Linux/Mac: ./start.sh).
   - Browser mein kholen:   http://localhost:8080          (website)
                            http://localhost:8080/admin    (aap ka control panel)

2) ADMIN LOGIN (pehli baar)
   Username: admin        Password: Swat@12345
   Login ke foran baad software khud naya password mangta hai - apna naya password rakh lein.

3) ADMIN PANEL SE AAP KYA KYA KAR SAKTE HAIN (sab kuch aap ke haath mein)
   - Branding & Contact : naam, phone, WhatsApp, EMAIL (yahan likhein, website par khud aa jayega),
                          address, timing, Google map, Facebook/Instagram/YouTube/TikTok, logo, share image
   - Hero & Background  : background ka type - animated Swat valley / AAP KI APNI VIDEO / apni image,
                          rang, din-raat cycle, headline aur buttons ka text
   - Services           : add / edit / delete / upar-neeche / price (English + Urdu)
   - Latest Updates     : job, admission, scholarship ke notices (last date ka countdown khud chalta hai)
   - How it works, Why choose us, Statistics, Gallery (apni photos upload), Reviews, FAQ
   - Applications       : website par jo form bharte hain wo yahan aate hain (naam, phone, service, documents),
                          status badlein (New / In Progress / Completed...), customer ko message likhein,
                          WhatsApp / Call ka button, CSV export, nayi application par beep + badge
   - Media library      : photos aur videos upload (images 40 MB, videos 600 MB tak)
   - Email alerts       : nayi application par aap ko email (Gmail App Password se)
   - Security & Backup  : password, poore data ka backup zip, purane versions wapas lana
   Tabdeeli ke baad upar "Save & Publish" dabayein - website foran update ho jati hai.

4) VIDEO WALLPAPER (8K jaisi quality)
   - Default: website ki animated Swat valley (subah, dopahar, shaam, raat badalti rehti hai). Ye
     computer ki graphics se live banti hai, is liye 4K/8K screen par bhi bilkul saaf rehti hai.
   - Apni video: Admin > Hero & Background > Background type = "My own video" > MP4 upload karein.
     Behtareen: 10-30 second ki seamless loop, H.264 MP4, 1080p ya 4K, 10-40 MB, bagair awaaz.
     (Video jitni high quality shoot hogi, website par utni hi saaf dikhegi - 8K video bohat bhari hoti hai,
      is liye 4K tak rakhna behtar hai.)

5) WEBSITE INTERNET PAR LAGANA (taake sab dekh sakein)
   Aap ko 2 cheezein chahiye: DOMAIN (jaise swatonlineapplicationcenter.pk) aur HOSTING.
   Aasan raaste:
   A) VPS / cloud server (Ubuntu, 1 GB RAM kaafi): folder copy karein, "python3 server.py" chalayein (systemd se
      hamesha chalta rakhein), aur Caddy/Nginx se HTTPS lagayein. Proxy ke peeche chalate waqt:
          TRUST_PROXY=1 HOST=127.0.0.1 PORT=8080 python3 server.py
      Caddy ki example file: Caddyfile  (domain.com { reverse_proxy 127.0.0.1:8080 })
   B) Dukaan ke computer se (bina server ke): Cloudflare Tunnel (muft) se apna domain computer ke server se jodein.
      Is surat mein computer 24 ghante on rehna chahiye.
   Hamesha: admin password mazboot rakhein aur hafte mein ek dafa backup download karein.

6) FOLDER KI BANAWAT
   server.py            - website ka server (Python)
   site/index.html      - website ka dhancha        site/assets/css/style.css - design
   site/assets/js/app.js - website ka logic          site/assets/js/scene.js   - WebGL animated valley (video wallpaper)
   site/admin/          - admin panel               default_content.json      - shuru ka text (English + Urdu)
   data/                - aap ka sara data (content, applications, uploads) - isay backup rakhein

7) IMPORTANT
   - "Sample" wali entries (Updates board) aur Statistics section default mein sirf namoona hain - asli
     maloomat se badal dein ya delete kar dein.
   - Footer mein likha hai ke aap kisi sarkari idare se mansalik nahi - ye theek rehta hai; Admin se badal sakte hain.
   - Applications mein CNIC jaise documents aate hain: data/ folder ko mehfooz rakhein aur kisi ko na dein.
