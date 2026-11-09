/* Swat Online Application Center - front end */
(function () {
  "use strict";
  var C = window.__SITE__ || { settings: {}, hero: {} };
  var S = C.settings || {};
  var PREVIEW = !!window.__PREVIEW__;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var MAP = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return MAP[c]; }); }
  function ls(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }
  function url(u) { u = String(u || ""); return /^(https?:\/\/|\/(?!\/)|mailto:|tel:|#)/i.test(u) ? u : ""; }

  var lang = ls("soac_lang") || ((navigator.language || "").slice(0, 2) === "ur" ? "ur" : "en");

  /* ------------------------------------------------ UI strings */
  var UI = {
    en: {
      nav_home: "Home", nav_services: "Services", nav_process: "How it works", nav_updates: "Updates", nav_gallery: "Swat", nav_faq: "FAQ", nav_contact: "Contact", call: "Call now", lang: "اردو", brand_small: "Swat · KPK",
      svc_k: "What we do", svc_t: "Services for <em>every</em> application", svc_p: "Choose a service, tell us what you need — we handle the paperwork.", apply_now: "Apply now",
      proc_k: "Simple process", proc_t: "How it <em>works</em>", proc_p: "Four easy steps from the first message to a successful submission.",
      why_k: "Why choose us", why_t: "Done right, <em>every time</em>", why_p: "Small details decide whether an application is accepted. We take care of all of them.",
      up_k: "Latest updates", up_t: "Jobs, admissions & <em>scholarships</em>", up_p: "Fresh notices — check back often, deadlines move fast.",
      all: "All", jobs: "Jobs", admissions: "Admissions", scholarships: "Scholarships", other: "Other", sample: "Sample", read_more: "Read notice", apply_with_us: "Apply with us",
      last_today: "Last date is today!", closed: "Closed", left: "left", day: "day", days: "days", last_date: "Last date", no_updates: "No notices in this category yet.",
      gal_k: "Beautiful Swat", gal_t: "The <em>Switzerland</em> of the East", gal_p: "Mountains, rivers and green valleys — this is the home we serve from.",
      tm_k: "Happy clients", tm_t: "What people <em>say</em>", faq_k: "FAQ", faq_t: "Questions? <em>Answers.</em>",
      ap_k: "Get started", ap_t: "Apply with <em>us</em>", ap_p: "Fill the form — we will contact you on WhatsApp or by phone. You can upload your documents right here.",
      tab_apply: "Apply", tab_track: "Track application",
      f_name: "Full name", f_phone: "Phone / WhatsApp", f_city: "City", f_email: "Email (optional)", f_service: "Service", f_choose: "Choose a service", f_other: "Other / not sure",
      f_msg: "Tell us what you need", f_docs: "Upload documents (optional)", f_docs_h: "JPG, PNG, PDF · up to 6 files · 8 MB each", f_submit: "Submit request", f_sending: "Sending…",
      ok_title: "Request received!", ok_text: "Save your reference number to track the application. We will contact you shortly.", ok_ref: "Reference number", copy: "Copy", copied: "Copied!",
      ok_wa: "Send details on WhatsApp", new_req: "New request", demo_note: "(Demo preview - on the live site this is saved for the team.)",
      err_name: "Please enter your name.", err_phone: "Please enter a valid phone number.", err_net: "Could not reach the server — opening WhatsApp instead.", err_file: "File is too large or not supported (JPG, PNG, PDF up to 8 MB).", err_files: "You can attach up to 6 files.",
      tr_ref: "Reference number", tr_phone: "Phone number used", tr_check: "Check status", tr_hint: "Enter the reference number you received and your phone number.",
      st_received: "Received", st_progress: "In progress", st_waiting: "Waiting for documents", st_completed: "Completed", st_cancelled: "Cancelled", st_for: "Service", st_on: "Submitted on", st_note: "Message from us",
      ct_k: "Contact", ct_t: "Visit us or <em>message</em> anytime", ct_p: "We reply fastest on WhatsApp.", c_phone: "Phone", c_wa: "WhatsApp", c_email: "Email", c_addr: "Address", c_hours: "Opening hours", soon: "Coming soon", c_map: "Our location",
      ft_links: "Quick links", ft_contact: "Contact", rights: "All rights reserved.", chat_wa: "Chat on WhatsApp", callus: "Call us",
      wa_default: "Assalam o Alaikum, I need help with an online application.", wa_service: "Assalam o Alaikum, I need help with: ", hero_latest: "Latest updates", hero_call: "Call or WhatsApp",
      b1: "Quick replies on WhatsApp", b2: "Your documents stay private", b3: "Free guidance before you pay"
    },
    ur: {
      nav_home: "ہوم", nav_services: "خدمات", nav_process: "طریقۂ کار", nav_updates: "تازہ اعلانات", nav_gallery: "سوات", nav_faq: "سوالات", nav_contact: "رابطہ", call: "ابھی کال کریں", lang: "English", brand_small: "سوات · کے پی کے",
      svc_k: "ہم کیا کرتے ہیں", svc_t: "ہر درخواست کے لیے <em>خدمات</em>", svc_p: "خدمت منتخب کریں، اپنی ضرورت بتائیں — کاغذی کارروائی ہم سنبھالتے ہیں۔", apply_now: "ابھی اپلائی کریں",
      proc_k: "آسان طریقہ", proc_t: "یہ کیسے <em>کام کرتا ہے</em>", proc_p: "پہلے پیغام سے کامیاب جمع کروانے تک چار آسان مراحل۔",
      why_k: "ہمیں کیوں چنیں", why_t: "ہر بار <em>درست کام</em>", why_p: "چھوٹی چھوٹی باتیں طے کرتی ہیں کہ درخواست منظور ہوگی یا نہیں۔ ان سب کا خیال ہم رکھتے ہیں۔",
      up_k: "تازہ اعلانات", up_t: "نوکریاں، داخلے اور <em>اسکالرشپ</em>", up_p: "نئے اعلانات — بار بار دیکھتے رہیں، آخری تاریخیں جلد آ جاتی ہیں۔",
      all: "سب", jobs: "نوکریاں", admissions: "داخلے", scholarships: "اسکالرشپ", other: "دیگر", sample: "نمونہ", read_more: "اعلان دیکھیں", apply_with_us: "ہمارے ساتھ اپلائی کریں",
      last_today: "آج آخری تاریخ ہے!", closed: "بند", left: "باقی", day: "دن", days: "دن", last_date: "آخری تاریخ", no_updates: "اس زمرے میں ابھی کوئی اعلان نہیں۔",
      gal_k: "خوبصورت سوات", gal_t: "مشرق کا <em>سوئٹزرلینڈ</em>", gal_p: "پہاڑ، دریا اور سرسبز وادیاں — یہی ہمارا گھر ہے جہاں سے ہم آپ کی خدمت کرتے ہیں۔",
      tm_k: "خوش گاہک", tm_t: "لوگ کیا <em>کہتے ہیں</em>", faq_k: "سوالات", faq_t: "سوالات؟ <em>جوابات۔</em>",
      ap_k: "شروع کریں", ap_t: "ہمارے ساتھ <em>اپلائی</em> کریں", ap_p: "فارم بھریں — ہم واٹس ایپ یا فون پر رابطہ کریں گے۔ اپنے ڈاکومنٹس بھی یہیں اپ لوڈ کر سکتے ہیں۔",
      tab_apply: "اپلائی", tab_track: "درخواست ٹریک کریں",
      f_name: "پورا نام", f_phone: "فون / واٹس ایپ", f_city: "شہر", f_email: "ای میل (اختیاری)", f_service: "خدمت", f_choose: "خدمت منتخب کریں", f_other: "دیگر / معلوم نہیں",
      f_msg: "اپنی ضرورت بتائیں", f_docs: "ڈاکومنٹس اپ لوڈ کریں (اختیاری)", f_docs_h: "JPG، PNG، PDF · 6 فائلیں تک · ہر ایک 8 MB", f_submit: "درخواست بھیجیں", f_sending: "بھیجا جا رہا ہے…",
      ok_title: "درخواست موصول ہو گئی!", ok_text: "اپنا ریفرنس نمبر محفوظ کر لیں تاکہ درخواست ٹریک کر سکیں۔ ہم جلد رابطہ کریں گے۔", ok_ref: "ریفرنس نمبر", copy: "کاپی", copied: "کاپی ہو گیا!",
      ok_wa: "واٹس ایپ پر تفصیل بھیجیں", new_req: "نئی درخواست", demo_note: "(یہ صرف ڈیمو ہے - اصل ویب سائٹ پر یہ ٹیم کے لیے محفوظ ہوتی ہے۔)",
      err_name: "براہِ کرم اپنا نام لکھیں۔", err_phone: "براہِ کرم درست فون نمبر لکھیں۔", err_net: "سرور سے رابطہ نہیں ہوا — واٹس ایپ کھولا جا رہا ہے۔", err_file: "فائل بہت بڑی ہے یا قبول نہیں (JPG، PNG، PDF، 8 MB تک)۔", err_files: "زیادہ سے زیادہ 6 فائلیں لگا سکتے ہیں۔",
      tr_ref: "ریفرنس نمبر", tr_phone: "استعمال شدہ فون نمبر", tr_check: "حالت دیکھیں", tr_hint: "موصول ہونے والا ریفرنس نمبر اور اپنا فون نمبر لکھیں۔",
      st_received: "موصول", st_progress: "کام جاری", st_waiting: "ڈاکومنٹس کا انتظار", st_completed: "مکمل", st_cancelled: "منسوخ", st_for: "خدمت", st_on: "جمع کروانے کی تاریخ", st_note: "ہماری طرف سے پیغام",
      ct_k: "رابطہ", ct_t: "تشریف لائیں یا <em>پیغام</em> کریں", ct_p: "واٹس ایپ پر جواب سب سے جلدی ملتا ہے۔", c_phone: "فون", c_wa: "واٹس ایپ", c_email: "ای میل", c_addr: "پتہ", c_hours: "اوقاتِ کار", soon: "جلد آ رہا ہے", c_map: "ہمارا مقام",
      ft_links: "فوری لنکس", ft_contact: "رابطہ", rights: "جملہ حقوق محفوظ ہیں۔", chat_wa: "واٹس ایپ پر بات کریں", callus: "کال کریں",
      wa_default: "السلام علیکم، مجھے ایک آن لائن درخواست میں مدد چاہیے۔", wa_service: "السلام علیکم، مجھے اس میں مدد چاہیے: ", hero_latest: "تازہ اعلانات", hero_call: "کال یا واٹس ایپ",
      b1: "واٹس ایپ پر فوری جواب", b2: "آپ کے ڈاکومنٹس نجی رہتے ہیں", b3: "ادائیگی سے پہلے مفت رہنمائی"
    }
  };
  function T(k) { return (UI[lang] && UI[lang][k]) || UI.en[k] || k; }
  function L(o, k) { if (!o) return ""; return o[k + "_" + lang] || o[k + "_en"] || o[k] || ""; }

  /* ------------------------------------------------ icons */
  var P = {
    briefcase: '<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>',
    cap: '<path d="M22 10 12 5 2 10l10 5 10-5z"/><path d="M6 12v5c3 2 9 2 12 0v-5"/>',
    award: '<circle cx="12" cy="8" r="6"/><path d="M15.5 13.5 17 22l-5-3-5 3 1.5-8.5"/>',
    id: '<rect x="2" y="5" width="20" height="14" rx="2"/><circle cx="8" cy="11" r="2"/><path d="M14 10h5M14 14h5M5 17c.5-2 5.500-2 6 0"/>',
    globe: '<circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20"/>',
    car: '<path d="M3 13l2-6h14l2 6v5H3z"/><circle cx="7.500" cy="16" r="1.500"/><circle cx="16.500" cy="16" r="1.500"/><path d="M3 13h18"/>',
    file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h8"/>',
    print: '<path d="M6 9V2h12v7"/><rect x="6" y="14" width="12" height="8"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>',
    wallet: '<path d="M20 12V8H6a2 2 0 0 1 0-4h12v4"/><path d="M4 6v12a2 2 0 0 0 2 2h14v-4"/><path d="M18 12a2 2 0 0 0 0 4h4v-4z"/>',
    chart: '<path d="M3 3v18h18"/><path d="m7 15 4-4 3 3 5-6"/>',
    laptop: '<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M2 20h20"/>',
    building: '<rect x="4" y="2" width="16" height="20" rx="2"/><path d="M9 22v-4h6v4M8 6h.01M12 6h.01M16 6h.01M8 10h.01M12 10h.01M16 10h.01M8 14h.01M12 14h.01M16 14h.01"/>',
    bolt: '<path d="M13 2 3 14h9l-1 8 10-12h-9z"/>',
    shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/>',
    check: '<circle cx="12" cy="12" r="10"/><path d="m8 12 3 3 5-6"/>',
    coin: '<circle cx="12" cy="12" r="10"/><path d="M15 9a3 3 0 0 0-3-1.500c-2 0-3 1.200-3 2.500s1 2 3 2 3 .8 3 2-1 2.500-3 2.500A3 3 0 0 1 9 15M12 6v1.500M12 16.500V18"/>',
    chat: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
    pin: '<path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>',
    phone: '<path d="M22 16.900v3a2 2 0 0 1-2.200 2 19.800 19.800 0 0 1-8.600-3.100 19.500 19.500 0 0 1-6-6A19.800 19.800 0 0 1 2.100 4.200 2 2 0 0 1 4.100 2h3a2 2 0 0 1 2 1.700c.1 1 .4 1.900.7 2.800a2 2 0 0 1-.5 2.100L8.100 9.900a16 16 0 0 0 6 6l1.300-1.300a2 2 0 0 1 2.100-.4c.9.3 1.800.6 2.800.7a2 2 0 0 1 1.700 2z"/>',
    mail: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/>',
    clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>',
    cal: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
    wa: '<path d="M20 12a8 8 0 0 1-11.800 7L4 20l1.100-4A8 8 0 1 1 20 12z"/><path d="M9 8.500c0 3 3 6.500 6.500 6.500l1-1.500-2-1-1 .8c-1-.4-1.800-1.200-2.200-2.200l.8-1-1-2z"/>',
    fb: '<path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>',
    ig: '<rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><path d="M17.500 6.500h.01"/>',
    yt: '<path d="M22.500 6.400a3 3 0 0 0-2.100-2.100C18.500 3.800 12 3.800 12 3.800s-6.500 0-8.400.5A3 3 0 0 0 1.500 6.400C1 8.300 1 12 1 12s0 3.700.5 5.600a3 3 0 0 0 2.100 2.100c1.900.5 8.400.5 8.400.5s6.500 0 8.400-.5a3 3 0 0 0 2.100-2.100c.5-1.900.5-5.600.5-5.600s0-3.700-.5-5.600z"/><path d="m10 15 5-3-5-3z"/>',
    tt: '<path d="M9 12a4 4 0 1 0 4 4V3c.5 2.500 2.500 4 5 4"/>',
    up: '<path d="m18 15-6-6-6 6"/>'
  };
  function icon(n, cls) { return '<svg class="i ' + (cls || "") + '" viewBox="0 0 24 24" aria-hidden="true">' + (P[n] || P.file) + "</svg>"; }
  var ARR = icon("arrow", "arr");

  /* ------------------------------------------------ helpers */
  function digits(s) { return String(s || "").replace(/\D/g, ""); }
  function waNum() { var d = digits(S.whatsapp || S.phone); if (d.indexOf("0") === 0) d = "92" + d.slice(1); return d; }
  function waLink(text) { return "https://wa.me/" + waNum() + (text ? "?text=" + encodeURIComponent(text) : ""); }
  function telLink() { return "tel:+" + waNum(); }
  function isOn(v) { return v === "yes" || v === true; }
  function daysLeft(d) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(d || "")) return null;
    var t = new Date(); t.setHours(0, 0, 0, 0);
    var x = new Date(d + "T00:00:00");
    return Math.round((x - t) / 86400000);
  }
  function leftText(n) {
    if (n === null) return "";
    if (n < 0) return T("closed");
    if (n === 0) return T("last_today");
    return n + " " + (n === 1 ? T("day") : T("days")) + " " + T("left");
  }
  var CATS = ["jobs", "admissions", "scholarships", "other"];

  /* ------------------------------------------------ renderers */
  function renderNav() {
    var upd = isOn(C.updates_on) && (C.updates || []).length, gal = isOn(C.gallery_on) && (C.gallery || []).length;
    var links = [["home", "nav_home"], ["services", "nav_services"], ["process", "nav_process"]];
    if (upd) links.push(["updates", "nav_updates"]);
    if (gal) links.push(["gallery", "nav_gallery"]);
    links.push(["faq", "nav_faq"], ["contact", "nav_contact"]);
    $("#nav").innerHTML = '<div class="wrap"><a class="brand" href="#home"><img src="' + esc(url(S.logo) || "/assets/defaults/logo.svg") + '" alt="" width="44" height="44"><span><b>' + esc(L(S, "site_name")) +
      "</b><small>" + esc(T("brand_small")) + '</small></span></a><nav class="links" id="links">' +
      links.map(function (l) { return '<a href="#' + l[0] + '" data-sec="' + l[0] + '">' + esc(T(l[1])) + "</a>"; }).join("") +
      '</nav><button class="lang" id="langBtn" type="button">' + esc(T("lang")) + '</button><a class="btn btn-p call sm mag" href="' + esc(telLink()) + '">' + icon("phone") + " " + esc(T("call")) +
      '</a><button class="burger" id="burger" aria-label="Menu" type="button"><span></span></button></div>';
  }

  function renderHero() {
    var h = C.hero || {}, words = L(h, "title").split(/\s+/).filter(Boolean), n = words.length;
    var title = words.map(function (w, i) { return '<span class="w"><span class="' + (i >= n - 2 ? "g" : "") + '" style="--i:' + i + '">' + esc(w) + "</span></span> "; }).join("");
    var ups = (C.updates || []).slice(0, 3);
    var card = '<aside class="hero-card">' +
      (isOn(C.updates_on) && ups.length ? "<h3><i></i>" + esc(T("hero_latest")) + "</h3>" + ups.map(function (u) {
        return '<a class="mini" href="#updates"><span class="tag ' + esc(CATS.indexOf(u.cat) > -1 ? u.cat : "other") + '">' + esc(T(CATS.indexOf(u.cat) > -1 ? u.cat : "other")) + "</span><span>" + esc(L(u, "title")) + "</span></a>";
      }).join("") : "") +
      '<a class="call-row" href="' + esc(telLink()) + '">' + icon("phone") + "<span><small>" + esc(T("hero_call")) + "</small><b>" + esc(S.phone || "") + "</b></span></a></aside>";
    $("#heroInner").innerHTML = "<div><span class=\"eyebrow\">" + esc(L(h, "eyebrow")) + "</span><h1 class=\"hero-title\">" + title + "</h1><p class=\"hero-sub\">" + esc(L(h, "sub")) + "</p>" +
      '<div class="hero-cta"><a class="btn btn-p mag" target="_blank" rel="noopener" href="' + esc(waLink(T("wa_default"))) + '">' + icon("wa") + " " + esc(L(h, "cta1") || T("chat_wa")) + '</a><a class="btn btn-g mag" href="#services">' + esc(L(h, "cta2")) + " " + ARR + "</a></div>" +
      '<div class="chips">' + [1, 2, 3].map(function (i) { var t = L(h, "chip" + i); return t ? '<span class="chip">' + icon("check") + esc(t) + "</span>" : ""; }).join("") + "</div></div>" + card;
  }

  function renderTicker() {
    var ups = isOn(C.updates_on) ? (C.updates || []) : [];
    if (!ups.length) { $("#ticker").innerHTML = ""; return; }
    var one = ups.map(function (u) {
      var dl = daysLeft(u.last_date);
      return '<a href="#updates"><span class="tag ' + esc(CATS.indexOf(u.cat) > -1 ? u.cat : "other") + '">' + esc(T(CATS.indexOf(u.cat) > -1 ? u.cat : "other")) + "</span>" + esc(L(u, "title")) + (dl !== null && dl >= 0 ? " — " + esc(leftText(dl)) : "") + "</a>";
    }).join("");
    $("#ticker").innerHTML = '<div class="tk">' + one + one + "</div>";
  }

  function head(k, centered) {
    return '<div class="sec-head rv ' + (centered ? "c" : "") + '"><span class="kicker">' + esc(T(k + "_k")) + '</span><h2 class="t">' + T(k + "_t") + "</h2>" + (T(k + "_p") !== k + "_p" ? "<p>" + esc(T(k + "_p")) + "</p>" : "") + "</div>";
  }

  function secServices() {
    var list = C.services || [];
    return '<section class="sec" id="services"><div class="wrap">' + head("svc", true) + '<div class="grid g-svc">' + list.map(function (s, i) {
      return '<article class="card svc tilt rv" style="--d:' + (i % 3) * 80 + 'ms"><div class="ico">' + icon(s.icon) + "</div><h3>" + esc(L(s, "title")) + "</h3><p>" + esc(L(s, "desc")) + '</p><div class="foot"><span class="price">' +
        esc(L(s, "price")) + '</span><button class="go" type="button" data-apply="' + i + '">' + esc(T("apply_now")) + " " + ARR + "</button></div></article>";
    }).join("") + "</div></div></section>";
  }

  function secSteps() {
    var list = C.steps || [];
    return '<section class="sec alt" id="process"><div class="wrap">' + head("proc", true) + '<div class="steps rv" id="steps">' + list.map(function (s, i) {
      return '<div class="step"><div class="n">' + (i + 1) + "</div><h3>" + esc(L(s, "title")) + "</h3><p>" + esc(L(s, "desc")) + "</p></div>";
    }).join("") + "</div></div></section>";
  }

  function secWhy() {
    var list = C.why || [];
    return '<section class="sec" id="why"><div class="wrap">' + head("why", true) + '<div class="grid g-why">' + list.map(function (s, i) {
      return '<div class="card why tilt rv" style="--d:' + (i % 3) * 80 + 'ms"><div class="ico">' + icon(s.icon) + "</div><div><h3>" + esc(L(s, "title")) + "</h3><p>" + esc(L(s, "desc")) + "</p></div></div>";
    }).join("") + "</div></div></section>";
  }

  function secStats() {
    var list = C.stats || [];
    if (!isOn(C.stats_on) || !list.length) return "";
    return '<section class="sec alt" id="stats"><div class="wrap"><div class="stats">' + list.map(function (s, i) {
      return '<div class="card stat rv" style="--d:' + i * 80 + 'ms"><b data-to="' + esc(parseInt(s.value, 10) || 0) + '" data-suf="' + esc(s.suffix || "") + '">0' + esc(s.suffix || "") + "</b><span>" + esc(L(s, "label")) + "</span></div>";
    }).join("") + "</div></div></section>";
  }

  var updFilter = "all";
  function updItems() {
    var list = (C.updates || []).slice();
    list.sort(function (a, b) {
      var da = daysLeft(a.last_date), db = daysLeft(b.last_date);
      var ca = da !== null && da < 0, cb = db !== null && db < 0;
      if (ca !== cb) return ca ? 1 : -1;
      if (da === null) return 1; if (db === null) return -1;
      return da - db;
    });
    if (updFilter !== "all") list = list.filter(function (u) { return (CATS.indexOf(u.cat) > -1 ? u.cat : "other") === updFilter; });
    if (!list.length) return '<div class="empty">' + esc(T("no_updates")) + "</div>";
    return '<div class="grid g-up">' + list.map(function (u, i) {
      var cat = CATS.indexOf(u.cat) > -1 ? u.cat : "other", dl = daysLeft(u.last_date), link = url(u.link);
      return '<article class="card up"><div class="row"><span class="tag ' + cat + '">' + esc(T(cat)) + "</span>" + (u.sample === "yes" ? '<span class="tag sample">' + esc(T("sample")) + "</span>" : "") + "</div><h3>" + esc(L(u, "title")) + "</h3>" +
        (dl !== null ? '<div class="left ' + (dl < 0 ? "closed" : dl <= 3 ? "urgent" : "") + '">' + icon("cal") + esc(T("last_date")) + ": " + esc(u.last_date) + " · " + esc(leftText(dl)) + "</div>" : "") +
        '<div class="actions">' + (link ? '<a class="go" target="_blank" rel="noopener" href="' + esc(link) + '">' + esc(T("read_more")) + " " + ARR + "</a>" : "") +
        '<button class="go" type="button" data-apply-text="' + esc(L(u, "title")) + '">' + esc(T("apply_with_us")) + " " + ARR + "</button></div></article>";
    }).join("") + "</div>";
  }
  function secUpdates() {
    var list = C.updates || [];
    if (!isOn(C.updates_on) || !list.length) return "";
    var present = CATS.filter(function (c) { return list.some(function (u) { return (CATS.indexOf(u.cat) > -1 ? u.cat : "other") === c; }); });
    return '<section class="sec alt" id="updates"><div class="wrap">' + head("up") + '<div class="filters rv" id="filters">' + ["all"].concat(present).map(function (c) {
      return '<button type="button" class="fbtn ' + (c === updFilter ? "on" : "") + '" data-f="' + c + '">' + esc(T(c)) + "</button>";
    }).join("") + '</div><div id="updList">' + updItems() + "</div></div></section>";
  }

  function secGallery() {
    var g = C.gallery || [];
    if (!isOn(C.gallery_on) || !g.length) return "";
    return '<section class="sec" id="gallery"><div class="wrap">' + head("gal", true) + '<div class="gal">' + g.slice(0, 6).map(function (x, i) {
      return '<figure class="rv" style="--d:' + i * 70 + 'ms" data-i="' + i + '"><img loading="lazy" decoding="async" src="' + esc(url(x.thumb) || url(x.img)) + '" alt="' + esc(L(x, "caption")) + '"><figcaption>' + esc(L(x, "caption")) + "</figcaption></figure>";
    }).join("") + "</div></div></section>";
  }

  function secTestimonials() {
    var t = C.testimonials || [];
    if (!isOn(C.testimonials_on) || !t.length) return "";
    return '<section class="sec alt" id="reviews"><div class="wrap">' + head("tm", true) + '<div class="grid g-tm">' + t.map(function (x, i) {
      return '<div class="card tm rv" style="--d:' + i * 80 + 'ms"><div class="stars">★★★★★</div><q>' + esc(L(x, "text")) + "</q><b>" + esc(x.name) + "</b><small>" + esc(L(x, "role")) + "</small></div>";
    }).join("") + "</div></div></section>";
  }

  function secFaq() {
    var f = C.faq || [];
    if (!f.length) return "";
    return '<section class="sec" id="faq"><div class="wrap">' + head("faq", true) + '<div class="faq">' + f.map(function (x, i) {
      return '<div class="card qa rv" style="--d:' + i * 60 + 'ms"><button type="button" aria-expanded="false"><span>' + esc(L(x, "q")) + '</span><span class="plus">+</span></button><div class="ans"><div><p>' + esc(L(x, "a")) + "</p></div></div></div>";
    }).join("") + "</div></div></section>";
  }

  var STAT_KEYS = ["New", "In Progress", "Waiting for Documents", "Completed"];
  function serviceOptions() {
    return '<option value="">' + esc(T("f_choose")) + "</option>" + (C.services || []).map(function (s) { return '<option value="' + esc(s.title_en || L(s, "title")) + '">' + esc(L(s, "title")) + "</option>"; }).join("") + '<option value="Other">' + esc(T("f_other")) + "</option>";
  }
  function secApply() {
    var bul = [["bolt", "b1"], ["shield", "b2"], ["coin", "b3"]].map(function (b) { return '<div class="card info rv"><div class="ico">' + icon(b[0]) + "</div><b>" + esc(T(b[1])) + "</b></div>"; }).join("");
    return '<section class="sec alt" id="apply"><div class="wrap apply"><div>' + head("ap") + '<div class="info-list">' + bul + '</div><div class="hero-cta" style="opacity:1;animation:none;margin-top:28px"><a class="btn btn-wa mag" target="_blank" rel="noopener" href="' + esc(waLink(T("wa_default"))) + '">' + icon("wa") + " " + esc(T("chat_wa")) +
      '</a><a class="btn btn-g mag" href="' + esc(telLink()) + '">' + icon("phone") + ' <span style="direction:ltr">' + esc(S.phone || "") + "</span></a></div></div>" +
      '<div class="card formcard rv" id="formcard"><div class="tabs"><button type="button" class="on" data-tab="apply">' + esc(T("tab_apply")) + '</button><button type="button" data-tab="track">' + esc(T("tab_track")) + "</button></div>" +
      '<div id="pane-apply"><form id="applyForm" novalidate><div class="fgrid"><div><label class="f" for="f_name">' + esc(T("f_name")) + '</label><input class="fi" id="f_name" name="name" autocomplete="name" maxlength="80" required></div>' +
      '<div><label class="f" for="f_phone">' + esc(T("f_phone")) + '</label><input class="fi" id="f_phone" name="phone" type="tel" inputmode="tel" autocomplete="tel" dir="ltr" placeholder="03XX XXXXXXX" required></div>' +
      '<div><label class="f" for="f_city">' + esc(T("f_city")) + '</label><input class="fi" id="f_city" name="city" maxlength="60"></div>' +
      '<div><label class="f" for="f_email">' + esc(T("f_email")) + '</label><input class="fi" id="f_email" name="email" type="email" autocomplete="email" dir="ltr" maxlength="100"></div>' +
      '<div class="full"><label class="f" for="f_service">' + esc(T("f_service")) + '</label><select class="fi" id="f_service" name="service">' + serviceOptions() + "</select></div>" +
      '<div class="full"><label class="f" for="f_msg">' + esc(T("f_msg")) + '</label><textarea class="fi" id="f_msg" name="message" maxlength="2000"></textarea></div>' +
      '<div class="full"><label class="f">' + esc(T("f_docs")) + '</label><label class="drop" id="drop">' + icon("upload") + '<span><b>' + esc(T("f_docs")) + "</b><br><small>" + esc(T("f_docs_h")) + '</small></span><input type="file" id="f_files" multiple accept=".jpg,.jpeg,.png,.webp,.pdf,image/*,application/pdf"></label><div class="files" id="fileList"></div></div></div>' +
      '<input class="hp" name="website" tabindex="-1" autocomplete="off" aria-hidden="true"><div class="msg" id="applyMsg"></div>' +
      '<button class="btn btn-p mag" type="submit" id="applyBtn" style="width:100%;margin-top:20px">' + esc(T("f_submit")) + " " + ARR + "</button></form></div>" +
      '<div id="pane-track" hidden><p style="color:var(--mu);margin-bottom:16px">' + esc(T("tr_hint")) + '</p><form id="trackForm" novalidate><div class="fgrid"><div><label class="f" for="t_ref">' + esc(T("tr_ref")) + '</label><input class="fi" id="t_ref" dir="ltr" placeholder="SOAC-123456"></div>' +
      '<div><label class="f" for="t_phone">' + esc(T("tr_phone")) + '</label><input class="fi" id="t_phone" type="tel" dir="ltr"></div></div><div class="msg" id="trackMsg"></div><button class="btn btn-p mag" type="submit" style="width:100%;margin-top:18px">' + esc(T("tr_check")) + '</button></form><div id="trackOut"></div></div></div></div></section>';
  }

  function infoRow(ic, label, valueHtml) { return '<div class="card info rv"><div class="ico">' + icon(ic) + "</div><div><small>" + esc(label) + "</small><b>" + valueHtml + "</b></div></div>"; }
  function secContact() {
    var mail = S.email ? '<a href="mailto:' + esc(S.email) + '" dir="ltr">' + esc(S.email) + "</a>" : '<span class="soon">' + esc(T("soon")) + "</span>";
    var map = /^https:\/\/(www\.google\.com\/maps|maps\.google\.com|www\.openstreetmap\.org)/i.test(S.map_embed || "") ? '<iframe loading="lazy" referrerpolicy="no-referrer-when-downgrade" src="' + esc(S.map_embed) + '" title="Map"></iframe>' :
      '<div class="ph">' + icon("pin") + "<b>" + esc(L(S, "address")) + "</b><span>" + esc(T("c_map")) + "</span></div>";
    return '<section class="sec" id="contact"><div class="wrap">' + head("ct") + '<div class="contact"><div class="info-list" style="margin-top:0">' +
      infoRow("phone", T("c_phone"), '<a class="num" href="' + esc(telLink()) + '">' + esc(S.phone) + "</a>") + infoRow("wa", T("c_wa"), '<a class="num" target="_blank" rel="noopener" href="' + esc(waLink("")) + '">' + esc(S.phone) + "</a>") +
      infoRow("mail", T("c_email"), mail) + infoRow("pin", T("c_addr"), esc(L(S, "address"))) + infoRow("clock", T("c_hours"), esc(L(S, "hours"))) + '</div><div class="map rv">' + map + "</div></div></div></section>";
  }

  function renderFooter() {
    var soc = [["facebook", "fb"], ["instagram", "ig"], ["youtube", "yt"], ["tiktok", "tt"]].filter(function (x) { return url(S[x[0]]); }).map(function (x) {
      return '<a href="' + esc(url(S[x[0]])) + '" target="_blank" rel="noopener" aria-label="' + x[0] + '">' + icon(x[1]) + "</a>";
    }).join("");
    $("#footer").innerHTML = '<div class="wrap"><div class="f-grid"><div><a class="brand" href="#home"><img src="' + esc(url(S.logo) || "/assets/defaults/logo.svg") + '" alt="" width="44" height="44"><span><b>' + esc(L(S, "site_name")) + "</b></span></a><p style=\"color:var(--mu);margin-top:14px;max-width:380px\">" + esc(L(S, "tagline")) + '</p><div class="soc">' + soc + "</div></div>" +
      "<div><h4>" + esc(T("ft_links")) + '</h4><ul><li><a href="#services">' + esc(T("nav_services")) + '</a></li><li><a href="#process">' + esc(T("nav_process")) + '</a></li><li><a href="#faq">' + esc(T("nav_faq")) + '</a></li><li><a href="#apply">' + esc(T("tab_apply")) + "</a></li></ul></div>" +
      "<div><h4>" + esc(T("ft_contact")) + '</h4><ul><li><a href="' + esc(telLink()) + '" dir="ltr">' + esc(S.phone) + "</a></li>" + (S.email ? '<li><a href="mailto:' + esc(S.email) + '">' + esc(S.email) + "</a></li>" : "") + "<li>" + esc(L(S, "address")) + "</li><li>" + esc(L(S, "hours")) + "</li></ul></div></div>" +
      '<div class="disc"><span>' + esc(L(S, "disclaimer")) + "</span><span>© " + new Date().getFullYear() + " " + esc(L(S, "site_name")) + ". " + esc(T("rights")) + "</span></div></div>";
    $("#fab").innerHTML = '<button class="top" id="toTop" aria-label="Top" type="button">' + icon("up") + '</button><a class="ph" href="' + esc(telLink()) + '" aria-label="Call">' + icon("phone") + '</a><a class="wa" href="' + esc(waLink(T("wa_default"))) + '" target="_blank" rel="noopener" aria-label="WhatsApp">' + icon("wa") + "</a>";
  }

  function render() {
    var d = document.documentElement;
    d.lang = lang; d.dir = lang === "ur" ? "rtl" : "ltr";
    document.title = L(S, "site_name") + " | " + L(S, "tagline");
    if (S.accent) d.style.setProperty("--ac", /^#[0-9a-f]{3,8}$/i.test(S.accent) ? S.accent : "#19e3b1");
    if (S.accent2) d.style.setProperty("--ac2", /^#[0-9a-f]{3,8}$/i.test(S.accent2) ? S.accent2 : "#f5b50a");
    renderNav(); renderHero(); renderTicker();
    $("#main").innerHTML = secServices() + secSteps() + secWhy() + secStats() + secUpdates() + secGallery() + secTestimonials() + secFaq() + secApply() + secContact();
    renderFooter();
    bindEffects();
  }

  /* ------------------------------------------------ effects */
  var io, spy, counted = {};
  function bindEffects() {
    if (io) io.disconnect();
    io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add("in"); io.unobserve(e.target);
        if (!e.target.classList.contains("steps")) (function (el) { setTimeout(function () { el.classList.remove("rv", "in"); }, 1700); })(e.target);
        $$("b[data-to]", e.target).forEach(countUp);
        if (e.target.matches("b[data-to]")) countUp(e.target);
      });
    }, { threshold: 0.14, rootMargin: "0px 0px -6% 0px" });
    $$(".rv").forEach(function (el) { io.observe(el); });
    if (spy) spy.disconnect();
    spy = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) $$(".links a").forEach(function (a) { a.classList.toggle("on", a.getAttribute("data-sec") === e.target.id); }); });
    }, { rootMargin: "-45% 0px -50% 0px" });
    $$("section[id]").forEach(function (s) { spy.observe(s); });
    if (window.matchMedia && matchMedia("(hover:hover)").matches) {
      $$(".tilt").forEach(function (el) {
        el.addEventListener("pointermove", function (e) {
          var r = el.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
          el.style.setProperty("--rx", ((y / r.height - 0.5) * -7).toFixed(2) + "deg"); el.style.setProperty("--ry", ((x / r.width - 0.5) * 9).toFixed(2) + "deg");
          el.style.setProperty("--mx", x + "px"); el.style.setProperty("--my", y + "px");
        });
        el.addEventListener("pointerleave", function () { el.style.setProperty("--rx", "0deg"); el.style.setProperty("--ry", "0deg"); });
      });
      $$(".mag").forEach(function (el) {
        el.addEventListener("pointermove", function (e) { var r = el.getBoundingClientRect(); el.style.transform = "translate(" + ((e.clientX - r.left - r.width / 2) * 0.14).toFixed(1) + "px," + ((e.clientY - r.top - r.height / 2) * 0.22).toFixed(1) + "px)"; });
        el.addEventListener("pointerleave", function () { el.style.transform = ""; });
      });
    }
  }
  function countUp(el) {
    var to = parseInt(el.getAttribute("data-to"), 10) || 0, suf = el.getAttribute("data-suf") || "", t0 = null;
    function step(t) { if (!t0) t0 = t; var p = Math.min(1, (t - t0) / 1600), v = Math.round(to * (1 - Math.pow(1 - p, 3))); el.textContent = v + suf; if (p < 1) requestAnimationFrame(step); }
    requestAnimationFrame(step);
  }

  /* ------------------------------------------------ gallery lightbox */
  var lbIndex = 0;
  function lbShow(i) {
    var g = C.gallery || []; if (!g.length) return;
    lbIndex = (i + g.length) % g.length;
    var x = g[lbIndex], box = $("#lightbox");
    box.hidden = false; document.body.style.overflow = "hidden";
    box.innerHTML = '<button class="lb-x" type="button" data-lb="x" aria-label="Close">✕</button><button class="lb-btn prev" type="button" data-lb="prev" aria-label="Previous">‹</button><div><img src="' + esc(url(x.img)) + '" alt="' + esc(L(x, "caption")) + '"><p>' + esc(L(x, "caption")) + '</p></div><button class="lb-btn next" type="button" data-lb="next" aria-label="Next">›</button>';
  }
  function lbClose() { $("#lightbox").hidden = true; document.body.style.overflow = ""; }

  /* ------------------------------------------------ forms */
  var files = [];
  function showMsg(id, cls, text) { var m = $(id); if (!m) return; m.className = "msg " + cls; m.textContent = text; }
  function renderFiles() {
    var box = $("#fileList"); if (!box) return;
    box.innerHTML = files.map(function (f, i) { return "<span>" + esc(f.name.slice(0, 26)) + ' <button type="button" data-rm="' + i + '" aria-label="Remove">✕</button></span>'; }).join("");
  }
  function addFiles(list) {
    Array.prototype.forEach.call(list, function (f) {
      var okType = /\.(jpe?g|png|webp|pdf)$/i.test(f.name);
      if (!okType || f.size > 8 * 1024 * 1024) { showMsg("#applyMsg", "err", T("err_file")); return; }
      if (files.length >= 6) { showMsg("#applyMsg", "err", T("err_files")); return; }
      files.push(f);
    });
    renderFiles();
  }
  function pickService(i, text) {
    var sel = $("#f_service"), msg = $("#f_msg");
    if (i !== null && C.services && C.services[i] && sel) sel.value = C.services[i].title_en || L(C.services[i], "title");
    if (text && msg) msg.value = text;
    var tgt = $("#apply"); if (tgt) tgt.scrollIntoView({ behavior: "smooth", block: "start" });
    setTimeout(function () { var n = $("#f_name"); if (n) n.focus({ preventScroll: true }); }, 700);
  }
  function waSummary(d, ref) {
    return T("wa_service") + (d.service || "—") + "\n" + T("f_name") + ": " + d.name + "\n" + T("f_phone") + ": " + d.phone + (d.city ? "\n" + T("f_city") + ": " + d.city : "") + (d.message ? "\n" + d.message : "") + (ref ? "\n" + T("ok_ref") + ": " + ref : "");
  }
  function showSuccess(d, ref, note) {
    $("#pane-apply").innerHTML = '<div class="success"><div class="okc">✓</div><h3 style="font-family:var(--head);font-size:1.5rem">' + esc(T("ok_title")) + "</h3><p style=\"color:var(--mu);margin-top:6px\">" + esc(T("ok_text")) + "</p>" +
      '<div class="refbox"><span id="refTxt">' + esc(ref) + '</span><button class="btn btn-g sm" type="button" id="copyRef">' + esc(T("copy")) + "</button></div>" + (note ? '<p style="color:var(--mu);font-size:.85rem">' + esc(note) + "</p>" : "") +
      '<div style="display:grid;gap:12px;margin-top:10px"><a class="btn btn-wa" target="_blank" rel="noopener" href="' + esc(waLink(waSummary(d, ref))) + '">' + icon("wa") + " " + esc(T("ok_wa")) + '</a><button class="btn btn-g" type="button" id="againBtn">' + esc(T("new_req")) + "</button></div></div>";
  }
  function submitApply(form) {
    var d = { name: form.name.value.trim(), phone: form.phone.value.trim(), city: form.city.value.trim(), email: form.email.value.trim(), service: form.service.value, message: form.message.value.trim(), website: form.website.value };
    if (d.name.length < 2) return showMsg("#applyMsg", "err", T("err_name"));
    var dg = digits(d.phone); if (dg.length < 10 || dg.length > 13) return showMsg("#applyMsg", "err", T("err_phone"));
    var btn = $("#applyBtn"); btn.disabled = true; btn.textContent = T("f_sending"); showMsg("#applyMsg", "", "");
    if (PREVIEW) { setTimeout(function () { showSuccess(d, "SOAC-" + (100000 + Math.floor(Math.random() * 899999)), T("demo_note")); }, 700); return; }
    fetch("/api/inquiry", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(d) })
      .then(function (r) { return r.json(); })
      .then(function (j) {
        if (!j.ok) { btn.disabled = false; btn.innerHTML = esc(T("f_submit")) + " " + ARR; return showMsg("#applyMsg", "err", j.error || "Error"); }
        var chain = Promise.resolve();
        files.forEach(function (f) {
          chain = chain.then(function () { return fetch("/api/upload-doc?ref=" + encodeURIComponent(j.ref) + "&token=" + encodeURIComponent(j.token) + "&name=" + encodeURIComponent(f.name), { method: "POST", body: f }).then(function (r) { return r.json(); }); });
        });
        return chain.then(function () { files = []; showSuccess(d, j.ref); });
      })
      .catch(function () {
        showMsg("#applyMsg", "err", T("err_net"));
        btn.disabled = false; btn.innerHTML = esc(T("f_submit")) + " " + ARR;
        setTimeout(function () { window.open(waLink(waSummary(d, "")), "_blank"); }, 900);
      });
  }
  function submitTrack(ref, phone) {
    var out = $("#trackOut"); out.innerHTML = ""; showMsg("#trackMsg", "", "");
    if (!ref || digits(phone).length < 10) return showMsg("#trackMsg", "err", T("err_phone"));
    if (PREVIEW) { return renderTrack({ status: "In Progress", service: "Passport & CNIC Applications", created: new Date().toISOString().slice(0, 10), note: "Demo status" }); }
    fetch("/api/track", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ref: ref, phone: phone }) }).then(function (r) { return r.json(); })
      .then(function (j) { if (!j.ok) return showMsg("#trackMsg", "err", j.error); renderTrack(j); }).catch(function () { showMsg("#trackMsg", "err", T("err_net")); });
  }
  function renderTrack(j) {
    var names = [T("st_received"), T("st_progress"), T("st_waiting"), T("st_completed")], idx = Math.max(0, STAT_KEYS.indexOf(j.status));
    var html = j.status === "Cancelled" ? '<p class="msg err" style="display:block">' + esc(T("st_cancelled")) + "</p>" :
      '<div class="timeline">' + names.map(function (n, i) { return '<div class="' + (i < idx ? "done" : i === idx ? "done now" : "") + '"><i></i>' + esc(n) + "</div>"; }).join("") + "</div>";
    $("#trackOut").innerHTML = '<div style="margin-top:22px">' + html + '<div class="info" style="padding:14px 4px;display:block"><small style="color:var(--mu)">' + esc(T("st_for")) + "</small><br><b>" + esc(j.service || "—") + "</b>" +
      "<br><small style=\"color:var(--mu)\">" + esc(T("st_on")) + ": " + esc(j.created) + "</small>" + (j.note ? "<br><br><small style=\"color:var(--mu)\">" + esc(T("st_note")) + "</small><br><b>" + esc(j.note) + "</b>" : "") + "</div></div>";
  }

  /* ------------------------------------------------ global events (delegated, bound once) */
  document.addEventListener("click", function (e) {
    var t = e.target;
    var el = t.closest ? t.closest("[data-apply],[data-apply-text],[data-f],[data-tab],[data-lb],[data-rm],.qa button,#langBtn,#burger,#toTop,#copyRef,#againBtn,.gal figure,.links a,a[href^='#']") : null;
    if (!el) return;
    if (el.hasAttribute("data-apply")) return pickService(parseInt(el.getAttribute("data-apply"), 10), "");
    if (el.hasAttribute("data-apply-text")) return pickService(null, el.getAttribute("data-apply-text"));
    if (el.hasAttribute("data-f")) { updFilter = el.getAttribute("data-f"); $$("#filters .fbtn").forEach(function (b) { b.classList.toggle("on", b === el); }); $("#updList").innerHTML = updItems(); return; }
    if (el.hasAttribute("data-tab")) { var tab = el.getAttribute("data-tab"); $$(".tabs button").forEach(function (b) { b.classList.toggle("on", b === el); }); $("#pane-apply").hidden = tab !== "apply"; $("#pane-track").hidden = tab !== "track"; return; }
    if (el.hasAttribute("data-lb")) { var a = el.getAttribute("data-lb"); return a === "x" ? lbClose() : lbShow(lbIndex + (a === "next" ? 1 : -1)); }
    if (el.hasAttribute("data-rm")) { files.splice(parseInt(el.getAttribute("data-rm"), 10), 1); return renderFiles(); }
    if (el.matches(".qa button")) { var q = el.parentNode, open = q.classList.toggle("open"); el.setAttribute("aria-expanded", open); return; }
    if (el.id === "langBtn") { lang = lang === "en" ? "ur" : "en"; ls("soac_lang", lang); files = []; var y = window.scrollY; render(); window.scrollTo(0, y); return; }
    if (el.id === "burger") { document.body.classList.toggle("menu-open"); $("#nav").classList.toggle("menu-open"); return; }
    if (el.id === "toTop") return window.scrollTo({ top: 0, behavior: "smooth" });
    if (el.id === "copyRef") { var txt = $("#refTxt").textContent; try { navigator.clipboard.writeText(txt); } catch (x) { } el.textContent = T("copied"); return; }
    if (el.id === "againBtn") { files = []; render(); return $("#apply").scrollIntoView(); }
    if (el.matches(".gal figure")) return lbShow(parseInt(el.getAttribute("data-i"), 10));
    if (el.matches(".links a, a[href^='#']")) { $("#nav").classList.remove("menu-open"); document.body.classList.remove("menu-open"); }
  });
  document.addEventListener("submit", function (e) {
    if (e.target.id === "applyForm") { e.preventDefault(); submitApply(e.target); }
    if (e.target.id === "trackForm") { e.preventDefault(); submitTrack($("#t_ref").value.trim(), $("#t_phone").value.trim()); }
  });
  document.addEventListener("change", function (e) { if (e.target.id === "f_files") { addFiles(e.target.files); e.target.value = ""; } });
  document.addEventListener("dragover", function (e) { var d = e.target.closest && e.target.closest("#drop"); if (d) { e.preventDefault(); d.classList.add("over"); } });
  document.addEventListener("dragleave", function (e) { var d = e.target.closest && e.target.closest("#drop"); if (d) d.classList.remove("over"); });
  document.addEventListener("drop", function (e) { var d = e.target.closest && e.target.closest("#drop"); if (d) { e.preventDefault(); d.classList.remove("over"); addFiles(e.dataTransfer.files); } });
  document.addEventListener("keydown", function (e) {
    if ($("#lightbox").hidden) return;
    if (e.key === "Escape") lbClose(); else if (e.key === "ArrowRight") lbShow(lbIndex + (lang === "ur" ? -1 : 1)); else if (e.key === "ArrowLeft") lbShow(lbIndex + (lang === "ur" ? 1 : -1));
  });
  var tick = false;
  function onScroll() {
    if (tick) return; tick = true;
    requestAnimationFrame(function () {
      tick = false;
      var y = window.scrollY, h = document.documentElement.scrollHeight - window.innerHeight;
      $("#progress").style.width = (h > 0 ? (y / h) * 100 : 0) + "%";
      $("#nav").classList.toggle("scrolled", y > 40);
      var tt = $("#toTop"); if (tt) tt.classList.toggle("show", y > 700);
      var hi = $("#heroInner"); if (hi && y < window.innerHeight) { hi.style.transform = "translateY(" + (y * 0.16).toFixed(1) + "px)"; hi.style.opacity = Math.max(0, 1 - y / (window.innerHeight * 0.85)).toFixed(2); }
    });
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("pointermove", function (e) { var g = $("#glow"); if (g) { g.style.opacity = 1; g.style.left = e.clientX + "px"; g.style.top = e.clientY + "px"; } }, { passive: true });

  /* ------------------------------------------------ hero background */
  function startScene() {
    if (!window.SwatScene) return;
    var c = $("#scene");
    var ctl = SwatScene.start(c, { dprMax: S.quality === "ultra" ? 3 : 2, cycle: S.scene_cycle !== "no", palette: parseInt(S.scene_palette, 10) || 0 });
    if (ctl) c.classList.add("live");
  }
  function startHero() {
    var poster = url(S.hero_poster), hero = $("#home");
    if (poster) hero.style.setProperty("--poster", 'url("' + poster.replace(/"/g, "") + '")');
    var mode = S.hero_mode || "scene";
    if (mode === "video" && url(S.hero_video)) {
      var v = $("#herovid"); v.hidden = false; v.muted = true; v.setAttribute("muted", ""); v.src = url(S.hero_video); if (poster) v.poster = poster;
      $("#scene").style.display = "none";
      var p = v.play(); if (p && p.catch) p.catch(function () { v.hidden = true; $("#scene").style.display = ""; startScene(); });
      return;
    }
    if (mode === "image" && url(S.hero_image)) { var im = $("#heroimg"); im.src = url(S.hero_image); im.hidden = false; $("#scene").style.display = "none"; return; }
    startScene();
  }

  function visitPing() {
    if (PREVIEW) return;
    var vid = ls("soac_vid"); if (!vid) { vid = Math.random().toString(36).slice(2, 12) + Date.now().toString(36); ls("soac_vid", vid); }
    try { fetch("/api/visit", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ vid: vid }), keepalive: true }); } catch (e) { }
  }

  function boot() {
    render(); onScroll(); startHero(); visitPing();
    var ld = $("#loader"), hide = function () { ld.classList.add("done"); };
    if (document.readyState === "complete") setTimeout(hide, 450); else { window.addEventListener("load", function () { setTimeout(hide, 450); }); setTimeout(hide, 3500); }
  }
  window.SOAC = { render: render, setLang: function (l) { lang = l; render(); } };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
})();
