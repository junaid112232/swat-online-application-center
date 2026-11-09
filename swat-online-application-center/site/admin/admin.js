/* Admin panel */
(function () {
  "use strict";
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var MAP = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return MAP[c]; }); }
  var CONTENT = null, DIRTY = false, VIEW = "dash", NEW = 0, OPEN = {}, uid = 0, pollT = null, ME = null;

  function toast(m, bad) {
    var d = document.createElement("div"); d.textContent = m; if (bad) d.className = "bad";
    $("#toast").appendChild(d); setTimeout(function () { d.remove(); }, bad ? 5000 : 2800);
  }
  function setDirty(v) { DIRTY = v; $("#dirty").hidden = !v; }
  window.addEventListener("beforeunload", function (e) { if (DIRTY) { e.preventDefault(); e.returnValue = ""; } });

  /* ---------------------------------------------------------------- api */
  function api(path, opt) {
    opt = opt || {};
    var h = { "X-Requested-With": "soac" }, body;
    if (opt.json !== undefined) { h["Content-Type"] = "application/json"; body = JSON.stringify(opt.json); }
    return fetch("/api/admin/" + path, { method: opt.method || (body !== undefined ? "POST" : "GET"), headers: h, body: body, credentials: "same-origin" }).then(function (r) {
      return r.json().catch(function () { return { ok: false, error: "Server error" }; }).then(function (j) {
        if (r.status === 401 && path !== "login") { showLogin(); throw new Error("auth"); }
        if (r.status === 403 && j.must_change) { forcePassword(); throw new Error("must_change"); }
        if (j.ok === false) { if (!opt.quiet) toast(j.error || "Error", true); throw new Error(j.error || "Error"); }
        return j;
      });
    });
  }
  function upload(file, prog) {
    return new Promise(function (res, rej) {
      var x = new XMLHttpRequest();
      x.open("POST", "/api/admin/upload?name=" + encodeURIComponent(file.name));
      x.setRequestHeader("X-Requested-With", "soac");
      x.upload.onprogress = function (e) { if (e.lengthComputable && prog) prog(e.loaded / e.total); };
      x.onload = function () { var j = {}; try { j = JSON.parse(x.responseText); } catch (e) { } if (x.status === 200 && j.ok) res(j); else rej(new Error(j.error || "Upload failed")); };
      x.onerror = function () { rej(new Error("Network error")); };
      x.send(file);
    });
  }
  function getPath(o, p) { return p.split(".").reduce(function (a, k) { return a == null ? a : a[k]; }, o); }
  function setPath(o, p, v) { var ks = p.split("."), last = ks.pop(), t = ks.reduce(function (a, k) { return a[k]; }, o); t[last] = v; }

  /* ---------------------------------------------------------------- login */
  function showLogin() { $("#app").hidden = true; $("#login").hidden = false; clearInterval(pollT); }
  $("#loginForm").addEventListener("submit", function (e) {
    e.preventDefault(); $("#lerr").textContent = "";
    api("login", { json: { u: $("#lu").value, p: $("#lp").value }, quiet: true }).then(function (j) { $("#lp").value = ""; start(j.must_change); }).catch(function (er) { $("#lerr").textContent = er.message === "auth" ? "" : er.message; });
  });
  function forcePassword() {
    modal('<h3>Set a new password</h3><p class="mu" style="margin:8px 0 14px">Security ke liye pehle apna password badlein. Naya password kam az kam 8 characters ka ho.</p>' +
      '<label>Current password<input id="pw0" type="password" autocomplete="current-password"></label><label>New username (optional)<input id="pwu" autocomplete="username" placeholder="owner"></label>' +
      '<label>New password<input id="pw1" type="password" autocomplete="new-password"></label><label>Repeat new password<input id="pw2" type="password" autocomplete="new-password"></label><div id="pwe" class="err"></div>' +
      '<button class="btn p" id="pwGo">Save new password</button>', true);
    $("#pwGo").onclick = function () {
      if ($("#pw1").value !== $("#pw2").value) { $("#pwe").textContent = "Passwords match nahi karte"; return; }
      api("password", { json: { old: $("#pw0").value, new: $("#pw1").value, user: $("#pwu").value }, quiet: true }).then(function () { closeModal(); toast("Password badal gaya ✔"); start(false); }).catch(function (er) { $("#pwe").textContent = er.message; });
    };
  }

  /* ---------------------------------------------------------------- shell */
  var NAV = [["dash", "📊", "Dashboard"], ["inq", "📥", "Applications"], { h: "Website content" }, ["brand", "🏷️", "Branding & Contact"], ["hero", "🎬", "Hero & Background"], ["services", "🧩", "Services"],
    ["updates", "📰", "Latest Updates board"], ["steps", "🪜", "How it works"], ["why", "⭐", "Why choose us"], ["stats", "🔢", "Statistics"], ["gallery", "🖼️", "Gallery"], ["reviews", "💬", "Reviews"], ["faq", "❓", "FAQ"],
    { h: "Tools" }, ["media", "📁", "Media library"], ["mail", "✉️", "Email alerts"], ["sec", "🔐", "Security & Backup"]];
  function drawSide() {
    $("#side").innerHTML = '<div class="brand"><img src="/assets/defaults/logo.svg" alt=""><span>Admin<br><small class="mu" style="font-weight:400">' + esc(ME || "") + "</small></span></div>" + NAV.map(function (n) {
      if (n.h) return "<h4>" + n.h + "</h4>";
      return '<a data-v="' + n[0] + '" class="' + (VIEW === n[0] ? "on" : "") + '"><span>' + n[1] + "</span>" + n[2] + (n[0] === "inq" && NEW ? '<span class="badge">' + NEW + "</span>" : "") + "</a>";
    }).join("") + '<h4>Account</h4><a data-v="logout"><span>🚪</span>Logout</a>';
  }
  function start(mustChange) {
    $("#login").hidden = true;
    api("me").then(function (me) {
      ME = me.user; NEW = me.new || 0; $("#app").hidden = false;
      if (me.must_change) { forcePassword(); return; }
      return api("content").then(function (c) { CONTENT = c; go(VIEW); clearInterval(pollT); pollT = setInterval(poll, 30000); });
    }).catch(function () { });
  }
  function poll() {
    api("me", { quiet: true }).then(function (me) {
      if (me.new > NEW) { beep(); toast("🔔 Nayi application aayi hai!"); document.title = "(" + me.new + ") Admin"; if (VIEW === "inq") views.inq(); }
      NEW = me.new; drawSide();
    }).catch(function () { });
  }
  function beep() { try { var a = new (window.AudioContext || window.webkitAudioContext)(), o = a.createOscillator(), g = a.createGain(); o.connect(g); g.connect(a.destination); o.frequency.value = 880; g.gain.setValueAtTime(.15, a.currentTime); g.gain.exponentialRampToValueAtTime(.001, a.currentTime + .5); o.start(); o.stop(a.currentTime + .5); } catch (e) { } }
  function go(v) {
    if (v === "logout") { api("logout", { json: {} }).finally(function () { CONTENT = null; setDirty(false); showLogin(); }); return; }
    VIEW = v; drawSide(); $("#side").classList.remove("open");
    var nav = NAV.filter(function (n) { return n[0] === v; })[0]; $("#title").textContent = nav ? nav[2] : "";
    $("#saveBtn").hidden = ["dash", "inq", "media", "mail", "sec"].indexOf(v) > -1;
    (views[v] || views.dash)();
  }
  $("#side").addEventListener("click", function (e) { var a = e.target.closest("a[data-v]"); if (a) go(a.getAttribute("data-v")); });
  $("#menuBtn").addEventListener("click", function () { $("#side").classList.toggle("open"); });
  $("#saveBtn").addEventListener("click", function () {
    var b = $("#saveBtn"); b.disabled = true; b.textContent = "Saving…";
    api("content", { json: { content: CONTENT } }).then(function () { setDirty(false); toast("Website update ho gayi ✔  (refresh karke dekhein)"); }).finally(function () { b.disabled = false; b.textContent = "Save & Publish"; });
  });
  function modal(html, locked) {
    var m = $("#modal"); m.hidden = false; m.innerHTML = '<div class="box">' + html + "</div>";
    m.onclick = function (e) { if (!locked && e.target === m) closeModal(); };
  }
  function closeModal() { $("#modal").hidden = true; $("#modal").innerHTML = ""; }
  function fmtSize(n) { return n > 1048576 ? (n / 1048576).toFixed(1) + " MB" : Math.max(1, Math.round(n / 1024)) + " KB"; }
  function waDigits(p) { var d = String(p || "").replace(/\D/g, ""); return d.indexOf("0") === 0 ? "92" + d.slice(1) : d; }

  /* ---------------------------------------------------------------- generic field renderer */
  function field(f, path, val) {
    var help = f.h ? '<div class="help">' + esc(f.h) + "</div>" : "", cls = f.rtl ? "rtl" : "";
    if (f.t === "i" || f.t === "v") {
      var pv = f.t === "i" ? '<div class="pv"' + (val ? ' style="background-image:url(\'' + esc(val) + '\')"' : "") + ">" + (val ? "" : "none") + "</div>" :
        '<div class="pv">' + (val ? '<video src="' + esc(val) + '" muted></video>' : "none") + "</div>";
      return '<div class="fld"><div class="lbl">' + esc(f.l) + '</div><div class="imgf" data-p="' + path + '" data-kind="' + (f.t === "i" ? "image" : "video") + '">' + pv +
        '<button type="button" class="btn sm" data-act="up">⬆ Upload</button><button type="button" class="btn sm" data-act="lib">📁 Library</button><button type="button" class="btn sm ghost" data-act="clr">✕ Clear</button><input type="file" hidden accept="' + (f.t === "i" ? "image/*" : "video/mp4,video/webm") + '"></div>' + help + "</div>";
    }
    var inner;
    if (f.t === "a") inner = '<textarea data-p="' + path + '" class="' + cls + '">' + esc(val) + "</textarea>";
    else if (f.t === "s" || f.t === "y") {
      var opts = f.t === "y" ? [["yes", "Yes"], ["no", "No"]] : f.o;
      inner = '<select data-p="' + path + '">' + opts.map(function (o) { return '<option value="' + esc(o[0]) + '"' + (String(val) === String(o[0]) ? " selected" : "") + ">" + esc(o[1]) + "</option>"; }).join("") + "</select>";
    } else if (f.t === "c") inner = '<input type="color" data-p="' + path + '" value="' + esc(val || "#19e3b1") + '">';
    else inner = '<input type="' + (f.t === "d" ? "date" : f.t === "n" ? "number" : "text") + '" data-p="' + path + '" value="' + esc(val) + '" class="' + cls + '"' + (f.ph ? ' placeholder="' + esc(f.ph) + '"' : "") + ">";
    return "<label>" + esc(f.l) + inner + help + "</label>";
  }
  function fields(list, base, obj) { return list.map(function (f) { var p = (base ? base + "." : "") + f.k; return field(f, p, getPath(CONTENT, p)); }).join(""); }
  function bindFields() {
    var v = $("#view");
    v.oninput = v.onchange = function (e) {
      var t = e.target;
      if (t.type === "file" && t.closest(".imgf")) { var f = t.files[0]; if (f) doUpload(t.closest(".imgf"), f); t.value = ""; return; }
      var p = t.getAttribute && t.getAttribute("data-p"); if (!p) return;
      var val = t.type === "checkbox" ? t.checked : t.value; if (t.type === "number") val = String(val);
      setPath(CONTENT, p, val); setDirty(true);
    };
    v.onclick = function (e) {
      var b = e.target.closest("[data-act]"); if (!b) return;
      var act = b.getAttribute("data-act"), box = b.closest(".imgf"), item = b.closest("[data-i]");
      if (box) return mediaAct(act, box);
      if (act === "tog") { var it = b.closest(".item"), k = it.getAttribute("data-k"), i = +it.getAttribute("data-i"); OPEN[k] = OPEN[k] || {}; OPEN[k][i] = !OPEN[k][i]; it.classList.toggle("open", OPEN[k][i]); return; }
      if (item) return listAct(act, item.getAttribute("data-k"), +item.getAttribute("data-i"));
      if (act === "add") return listAdd(b.getAttribute("data-k"));
    };
    $$(".item>.hd", v).forEach(function (h) { h.onclick = function (e) { if (e.target.closest("button")) return; var it = h.parentNode, k = it.getAttribute("data-k"), i = +it.getAttribute("data-i"); OPEN[k] = OPEN[k] || {}; OPEN[k][i] = !OPEN[k][i]; it.classList.toggle("open", OPEN[k][i]); }; });
  }
  function setMedia(box, url) {
    var p = box.getAttribute("data-p"); setPath(CONTENT, p, url);
    if (/\.img$/.test(p)) { var tp = p.replace(/\.img$/, ".thumb"); try { setPath(CONTENT, tp, ""); } catch (e) { } }
    setDirty(true); box.querySelector(".pv").outerHTML = box.getAttribute("data-kind") === "image" ? '<div class="pv"' + (url ? ' style="background-image:url(\'' + esc(url) + '\')"' : "") + ">" + (url ? "" : "none") + "</div>" : '<div class="pv">' + (url ? '<video src="' + esc(url) + '" muted></video>' : "none") + "</div>";
  }
  function mediaAct(act, box) {
    var kind = box.getAttribute("data-kind"), inp = box.querySelector("input[type=file]");
    if (act === "clr") return setMedia(box, "");
    if (act === "lib") return pickMedia(kind, function (u) { setMedia(box, u); });
    if (act === "up") inp.click();
  }
  function doUpload(box, f) {
    var pv = box.querySelector(".pv"); pv.textContent = "0%";
    upload(f, function (p) { pv.textContent = Math.round(p * 100) + "%"; }).then(function (j) { setMedia(box, j.url); toast("Upload ho gaya ✔  — ab Save & Publish dabayein"); }).catch(function (er) { toast(er.message, true); setMedia(box, getPath(CONTENT, box.getAttribute("data-p"))); });
  }
  function pickMedia(kind, cb) {
    api("media").then(function (j) {
      var items = j.items.filter(function (m) { return m.kind === kind; });
      modal("<h3>Media library - " + kind + 's</h3><div class="media pick" style="margin-top:14px">' + (items.map(function (m) {
        return '<div class="mi" data-u="' + esc(m.url) + '"><div class="th"' + (kind === "image" ? ' style="background-image:url(\'' + esc(m.url) + '\')"' : "") + ">" + (kind === "video" ? "🎞️" : "") + '</div><div class="in"><div>' + esc(m.name) + "</div>" + fmtSize(m.size) + "</div></div>";
      }).join("") || '<p class="mu">Library khali hai. Pehle upload karein.</p>') + '</div><div style="margin-top:14px"><button class="btn" id="mcl">Close</button></div>');
      $("#mcl").onclick = closeModal;
      $$(".mi", $("#modal")).forEach(function (el) { el.onclick = function () { cb(el.getAttribute("data-u")); closeModal(); }; });
    });
  }

  /* ---------------------------------------------------------------- list editing */
  var T = function (k, l, o) { return { k: k, l: l, t: "t", rtl: o && o.rtl, h: o && o.h, ph: o && o.ph }; };
  var A = function (k, l, o) { return { k: k, l: l, t: "a", rtl: o && o.rtl, h: o && o.h }; };
  var Y = function (k, l, h) { return { k: k, l: l, t: "y", h: h }; };
  var ICONS = ["briefcase", "cap", "award", "id", "globe", "car", "file", "print", "wallet", "chart", "laptop", "building", "bolt", "shield", "check", "coin", "chat", "pin"].map(function (x) { return [x, x]; });
  var LISTS = {
    services: { key: "services", label: "Service", blank: { icon: "file", title_en: "New service", title_ur: "", desc_en: "", desc_ur: "", price_en: "", price_ur: "" }, title: function (x) { return x.title_en || "(untitled)"; },
      f: [{ k: "icon", l: "Icon", t: "s", o: ICONS }, T("title_en", "Title (English)"), T("title_ur", "Title (Urdu)", { rtl: 1 }), A("desc_en", "Description (English)"), A("desc_ur", "Description (Urdu)", { rtl: 1 }), T("price_en", "Price text (English)", { h: "Optional, e.g. From Rs 300. Khali chorein to price nahi dikhega.", ph: "From Rs 300" }), T("price_ur", "Price text (Urdu)", { rtl: 1 })] },
    updates: { key: "updates", label: "Notice", toggle: "updates_on", toggleLabel: "Show this section on website", blank: { cat: "jobs", title_en: "", title_ur: "", last_date: "", link: "", sample: "no" }, title: function (x) { return (x.sample === "yes" ? "[SAMPLE] " : "") + (x.title_en || "(untitled)"); },
      f: [{ k: "cat", l: "Category", t: "s", o: [["jobs", "Jobs"], ["admissions", "Admissions"], ["scholarships", "Scholarships"], ["other", "Other"]] }, T("title_en", "Title (English)"), T("title_ur", "Title (Urdu)", { rtl: 1 }), { k: "last_date", l: "Last date", t: "d", h: "Optional. Din bachay hue khud dikhengay; guzar jaye to 'Closed'." }, T("link", "Link to official notice", { h: "Optional, https:// se shuru", ph: "https://" }), Y("sample", "Is this a sample entry?", "Sample entry par 'Sample' ka nishan lagta hai. Asli notice ke liye No rakhein.")] },
    steps: { key: "steps", label: "Step", blank: { title_en: "", title_ur: "", desc_en: "", desc_ur: "" }, title: function (x) { return x.title_en || "(untitled)"; }, f: [T("title_en", "Title (English)"), T("title_ur", "Title (Urdu)", { rtl: 1 }), A("desc_en", "Text (English)"), A("desc_ur", "Text (Urdu)", { rtl: 1 })] },
    why: { key: "why", label: "Reason", blank: { icon: "check", title_en: "", title_ur: "", desc_en: "", desc_ur: "" }, title: function (x) { return x.title_en || "(untitled)"; }, f: [{ k: "icon", l: "Icon", t: "s", o: ICONS }, T("title_en", "Title (English)"), T("title_ur", "Title (Urdu)", { rtl: 1 }), A("desc_en", "Text (English)"), A("desc_ur", "Text (Urdu)", { rtl: 1 })] },
    stats: { key: "stats", label: "Number", toggle: "stats_on", toggleLabel: "Show statistics section on website", blank: { value: "0", suffix: "+", label_en: "", label_ur: "" }, title: function (x) { return x.value + (x.suffix || "") + " " + (x.label_en || ""); },
      f: [{ k: "value", l: "Number", t: "n", h: "Sirf asli numbers likhein." }, T("suffix", "After number (+, %, h)"), T("label_en", "Label (English)"), T("label_ur", "Label (Urdu)", { rtl: 1 })] },
    gallery: { key: "gallery", label: "Photo", toggle: "gallery_on", toggleLabel: "Show gallery on website", blank: { img: "", thumb: "", caption_en: "", caption_ur: "" }, title: function (x) { return x.caption_en || x.img || "(photo)"; },
      f: [{ k: "img", l: "Photo", t: "i", h: "Barhi, saaf photo upload karein (kam az kam 1600px wide)." }, T("caption_en", "Caption (English)"), T("caption_ur", "Caption (Urdu)", { rtl: 1 })] },
    testimonials: { key: "testimonials", label: "Review", toggle: "testimonials_on", toggleLabel: "Show reviews section on website", blank: { name: "", role_en: "", role_ur: "", text_en: "", text_ur: "" }, title: function (x) { return x.name || "(name)"; },
      f: [T("name", "Customer name"), T("role_en", "Role / city (English)"), T("role_ur", "Role / city (Urdu)", { rtl: 1 }), A("text_en", "Review (English)"), A("text_ur", "Review (Urdu)", { rtl: 1 })] },
    faq: { key: "faq", label: "Question", blank: { q_en: "", a_en: "", q_ur: "", a_ur: "" }, title: function (x) { return x.q_en || "(question)"; }, f: [T("q_en", "Question (English)"), A("a_en", "Answer (English)"), T("q_ur", "Question (Urdu)", { rtl: 1 }), A("a_ur", "Answer (Urdu)", { rtl: 1 })] }
  };
  function listView(def, intro) {
    var arr = CONTENT[def.key] = CONTENT[def.key] || [], o = OPEN[def.key] || {}, html = intro ? '<p class="mu" style="margin-bottom:14px">' + intro + "</p>" : "";
    if (def.toggle) html += '<div class="tg"><label style="margin:0;display:flex;gap:12px;align-items:center;color:var(--tx)"><select data-p="' + def.toggle + '" style="width:auto"><option value="yes"' + (CONTENT[def.toggle] === "yes" ? " selected" : "") + '>Yes</option><option value="no"' + (CONTENT[def.toggle] !== "yes" ? " selected" : "") + ">No</option></select>" + esc(def.toggleLabel) + "</label></div>";
    html += '<div class="row" style="margin-bottom:14px"><button class="btn p" data-act="add" data-k="' + def.key + '">➕ Add ' + def.label + "</button></div>";
    html += arr.map(function (x, i) {
      return '<div class="item' + (o[i] ? " open" : "") + '" data-k="' + def.key + '" data-i="' + i + '"><div class="hd"><b>' + (i + 1) + ". " + esc(def.title(x)) + '</b><button class="btn sm ghost" data-act="up" title="Up">↑</button><button class="btn sm ghost" data-act="down" title="Down">↓</button><button class="btn sm ghost" data-act="dup" title="Duplicate">⧉</button><button class="btn sm red" data-act="del" title="Delete">🗑</button></div><div class="bd">' +
        def.f.map(function (f) { var p = def.key + "." + i + "." + f.k; return field(f, p, x[f.k]); }).join("") + "</div></div>";
    }).join("") || '<p class="mu">Koi item nahi. "Add" dabayein.</p>';
    $("#view").innerHTML = html; bindFields();
  }
  function listAct(act, key, i) {
    var arr = CONTENT[key];
    if (act === "del") { if (!confirm("Delete karein?")) return; arr.splice(i, 1); }
    else if (act === "up" && i > 0) arr.splice(i - 1, 0, arr.splice(i, 1)[0]);
    else if (act === "down" && i < arr.length - 1) arr.splice(i + 1, 0, arr.splice(i, 1)[0]);
    else if (act === "dup") arr.splice(i + 1, 0, JSON.parse(JSON.stringify(arr[i])));
    else return;
    OPEN[key] = {}; setDirty(true); views[VIEW]();
  }
  function listAdd(key) { CONTENT[key].unshift(JSON.parse(JSON.stringify(LISTS[key].blank))); OPEN[key] = { 0: true }; setDirty(true); views[VIEW](); window.scrollTo(0, 0); }
  function groups(gs) {
    $("#view").innerHTML = gs.map(function (g) { return (g.h ? '<div class="sec-t">' + g.h + "</div>" : "") + '<div class="card grid ' + (g.cols || "") + '">' + g.f.map(function (f) { var p = (g.p ? g.p + "." : "") + f.k; return '<div style="' + (f.t === "a" || f.t === "i" || f.t === "v" ? "grid-column:1/-1" : "") + '">' + field(f, p, getPath(CONTENT, p)) + "</div>"; }).join("") + "</div>"; }).join("");
    bindFields();
  }

  /* ---------------------------------------------------------------- views */
  var STATUSES = ["New", "Received", "In Progress", "Waiting for Documents", "Completed", "Cancelled"];
  var views = {
    dash: function () {
      api("stats").then(function (s) {
        var mx = Math.max.apply(null, s.days.map(function (d) { return d.visitors; }).concat([1])), m30 = s.days.reduce(function (a, d) { return a + d.visitors; }, 0);
        $("#view").innerHTML = '<div class="grid g4"><div class="card stat"><b>' + s.today.visitors + "</b><span>Visitors today</span></div><div class=\"card stat\"><b>" + m30 + "</b><span>Visitors (30 days)</span></div><div class=\"card stat\"><b>" + s.inquiries + "</b><span>Total applications</span></div><div class=\"card stat\"><b>" + (s.by_status.New || 0) + "</b><span>New (not yet handled)</span></div></div>" +
          '<div class="card" style="margin-top:16px"><h3>Visitors - last 30 days</h3><div class="chart">' + s.days.map(function (d) { return '<i style="height:' + Math.max(2, d.visitors / mx * 100) + '%" data-t="' + d.day.slice(5) + ": " + d.visitors + '"></i>'; }).join("") + "</div></div>" +
          '<div class="grid g2" style="margin-top:16px"><div class="card"><h3>Applications by status</h3>' + (Object.keys(s.by_status).map(function (k) { return '<div class="row" style="justify-content:space-between;padding:6px 0"><span class="st ' + esc(k) + '">' + esc(k) + "</span><b>" + s.by_status[k] + "</b></div>"; }).join("") || '<p class="mu">Abhi koi application nahi.</p>') + "</div>" +
          '<div class="card"><h3>Most requested services</h3>' + (s.top_services.map(function (t) { return '<div class="row" style="justify-content:space-between;padding:6px 0"><span>' + esc(t.service) + "</span><b>" + t.n + "</b></div>"; }).join("") || '<p class="mu">Abhi data nahi.</p>') + "</div></div>" +
          '<div class="card" style="margin-top:16px"><h3>Quick actions</h3><div class="row"><button class="btn" data-go="inq">📥 Open applications</button><button class="btn" data-go="updates">📰 Add a job / admission notice</button><button class="btn" data-go="hero">🎬 Change hero video</button><button class="btn" data-go="gallery">🖼️ Upload photos</button></div></div>';
        $$("[data-go]", $("#view")).forEach(function (b) { b.onclick = function () { go(b.getAttribute("data-go")); }; });
      });
    },
    inq: function () {
      var st = ($("#fst") || {}).value || "", q = ($("#fq") || {}).value || "";
      var keep = $("#fq") ? true : false;
      if (!keep) $("#view").innerHTML = '<div class="row" style="margin-bottom:14px"><input id="fq" placeholder="Search name / phone / reference" style="flex:1;min-width:200px"><select id="fst" style="width:auto"><option value="">All statuses</option>' + STATUSES.map(function (s) { return "<option>" + s + "</option>"; }).join("") + '</select><a class="btn" href="/api/admin/export.csv">⬇ Export CSV</a></div><div id="ilist"></div>';
      if (!keep) { $("#fq").oninput = $("#fst").onchange = function () { clearTimeout(views._t); views._t = setTimeout(views.inq, 250); }; }
      api("inquiries?status=" + encodeURIComponent(st) + "&q=" + encodeURIComponent(q)).then(function (j) {
        NEW = 0; drawSide(); document.title = "Admin";
        $("#ilist").innerHTML = j.items.length ? '<div class="card" style="padding:0;overflow:auto"><table><tr><th>Ref</th><th>Date</th><th>Name</th><th>Phone</th><th>Service</th><th>Status</th><th>Docs</th></tr>' + j.items.map(function (r) {
          return '<tr class="click" data-id="' + r.id + '"><td>' + esc(r.ref) + "</td><td>" + esc(r.created.slice(0, 16)) + "</td><td>" + esc(r.name) + "</td><td>" + esc(r.phone) + "</td><td>" + esc(r.service) + '</td><td><span class="st ' + esc(r.status) + '">' + esc(r.status) + "</span></td><td>" + (r.docs.length || "") + "</td></tr>";
        }).join("") + "</table></div>" : '<div class="card mu">Koi application nahi mili.</div>';
        $$("tr.click", $("#ilist")).forEach(function (tr) { tr.onclick = function () { inqDetail(j.items.filter(function (r) { return r.id === +tr.getAttribute("data-id"); })[0]); }; });
      });
    },
    brand: function () {
      groups([
        { h: "Name & tagline", p: "settings", cols: "g2", f: [T("site_name", "Website name (English)"), T("site_name_ur", "Website name (Urdu)", { rtl: 1 }), T("tagline_en", "Tagline (English)"), T("tagline_ur", "Tagline (Urdu)", { rtl: 1 })] },
        { h: "Contact details", p: "settings", cols: "g2", f: [T("phone", "Phone (as shown on website)", { ph: "0346 0553153" }), T("whatsapp", "WhatsApp number", { h: "Country code ke saath, bina + ya space: 923460553153" }),
          T("email", "Email address", { h: "Yahan apna email likhein — website par khud nazar aane lagega. Khali ho to 'Coming soon' dikhta hai.", ph: "yourname@gmail.com" }), T("hours_en", "Opening hours (English)"), T("address_en", "Address (English)"), T("address_ur", "Address (Urdu)", { rtl: 1 }), T("hours_ur", "Opening hours (Urdu)", { rtl: 1 }),
          T("map_embed", "Google Map link", { h: "Google Maps → Share → Embed a map → HTML mein se sirf src=\"...\" ke andar wala https:// link copy karein.", ph: "https://www.google.com/maps/embed?pb=..." })] },
        { h: "Social media (full links)", p: "settings", cols: "g2", f: [T("facebook", "Facebook", { ph: "https://facebook.com/..." }), T("instagram", "Instagram", { ph: "https://instagram.com/..." }), T("youtube", "YouTube", { ph: "https://youtube.com/..." }), T("tiktok", "TikTok", { ph: "https://tiktok.com/@..." })] },
        { h: "Logo & share image", p: "settings", cols: "g3", f: [{ k: "logo", l: "Logo", t: "i", h: "Square image behtar hai" }, { k: "favicon", l: "Browser tab icon", t: "i" }, { k: "og_image", l: "Share image (WhatsApp / Facebook)", t: "i", h: "1200x630 size" }] },
        { h: "Footer notice", p: "settings", f: [A("disclaimer_en", "Disclaimer (English)"), A("disclaimer_ur", "Disclaimer (Urdu)", { rtl: 1 })] }
      ]);
    },
    hero: function () {
      groups([
        { h: "Background (video wallpaper)", p: "settings", cols: "g2", f: [{ k: "hero_mode", l: "Background type", t: "s", o: [["scene", "Animated valley scene (default, crisp at any resolution)"], ["video", "My own video"], ["image", "My own image"]], h: "Apni video ke liye 'My own video' chunein aur neeche upload karein." },
          { k: "hero_video", l: "Background video", t: "v", h: "MP4 (H.264) behtar hai. 10-30 MB, 1080p/4K, 10-30 second loop. Awaaz nahi chalegi." }, { k: "hero_image", l: "Background image", t: "i" }, { k: "hero_poster", l: "Loading picture (shown before video/scene starts)", t: "i" },
          Y("scene_cycle", "Day & night cycle in animated scene", "Yes = subah, dopahar, shaam aur raat khud badalti hain"), { k: "scene_palette", l: "Fixed time of day (if cycle = No)", t: "s", o: [["0", "Dawn"], ["1", "Day"], ["2", "Sunset"], ["3", "Blue hour"], ["4", "Night"]] },
          { k: "quality", l: "Rendering quality", t: "s", o: [["auto", "Auto (smooth on all devices)"], ["ultra", "Ultra (sharpest, needs strong graphics card)"]] }, { k: "accent", l: "Main colour", t: "c" }, { k: "accent2", l: "Second colour", t: "c" }] },
        { h: "Headline text", p: "hero", cols: "g2", f: [T("eyebrow_en", "Small top line (English)"), T("eyebrow_ur", "Small top line (Urdu)", { rtl: 1 }), T("title_en", "Big headline (English)"), T("title_ur", "Big headline (Urdu)", { rtl: 1 }), A("sub_en", "Sub text (English)"), A("sub_ur", "Sub text (Urdu)", { rtl: 1 }),
          T("cta1_en", "Main button (English)"), T("cta1_ur", "Main button (Urdu)", { rtl: 1 }), T("cta2_en", "Second button (English)"), T("cta2_ur", "Second button (Urdu)", { rtl: 1 }), T("chip1_en", "Badge 1 (English)"), T("chip1_ur", "Badge 1 (Urdu)", { rtl: 1 }), T("chip2_en", "Badge 2 (English)"), T("chip2_ur", "Badge 2 (Urdu)", { rtl: 1 }), T("chip3_en", "Badge 3 (English)"), T("chip3_ur", "Badge 3 (Urdu)", { rtl: 1 })] }
      ]);
    },
    services: function () { listView(LISTS.services, "Aap ki khidmaat ki list. Har service ke liye icon, naam aur tafseel (English + Urdu) likhein."); },
    updates: function () { listView(LISTS.updates, "Yahan job, admission aur scholarship ke naye notices dalein. Log baar baar website dekhne aate hain — isay roz update karein. Pehle se mojood 'Sample' entries delete kar dein."); },
    steps: function () { listView(LISTS.steps); },
    why: function () { listView(LISTS.why); },
    stats: function () { listView(LISTS.stats, "Sirf asli numbers dalein. Section ko 'Yes' karne par hi website par nazar aayega."); },
    gallery: function () { listView(LISTS.gallery, "Swat ya apne center ki photos. Pehli 6 photos mosaic mein dikhti hain; click par poori screen par khulti hain."); },
    reviews: function () { listView(LISTS.testimonials, "Sirf asli customers ke reviews (unki ijazat se) dalein."); },
    faq: function () { listView(LISTS.faq); },
    media: function () {
      $("#view").innerHTML = '<div class="card"><h3>Upload photos / videos</h3><input type="file" id="mf" multiple accept="image/*,video/mp4,video/webm"><div id="mprog"></div><p class="help">Images 40 MB tak, videos 600 MB tak. Upload ke baad kisi bhi section mein "Library" se chunein.</p></div><div id="mlist" style="margin-top:16px"></div>';
      $("#mf").onchange = function () {
        var files = Array.prototype.slice.call($("#mf").files), box = $("#mprog"), chain = Promise.resolve();
        files.forEach(function (f) {
          var row = document.createElement("div"); row.innerHTML = esc(f.name) + '<div class="bar"><i></i></div>'; box.appendChild(row);
          chain = chain.then(function () { return upload(f, function (p) { row.querySelector("i").style.width = Math.round(p * 100) + "%"; }).then(function () { row.querySelector("i").style.width = "100%"; }).catch(function (er) { row.innerHTML += '<span class="err"> ' + esc(er.message) + "</span>"; }); });
        });
        chain.then(function () { toast("Upload mukammal ✔"); loadMedia(); });
        $("#mf").value = "";
      };
      loadMedia();
    },
    mail: function () {
      api("secrets").then(function (c) {
        $("#view").innerHTML = '<div class="card"><h3>Email alerts</h3><p class="mu" style="margin-bottom:14px">Jab bhi koi nayi application aaye, aap ko email mil jaye. Gmail ke liye: smtp.gmail.com, port 587, aur "App Password" (normal password nahi) istemal karein.</p><div class="grid g2">' +
          '<label>SMTP server<input id="m1" value="' + esc(c.smtp_host) + '" placeholder="smtp.gmail.com"></label><label>Port<input id="m2" value="' + esc(c.smtp_port) + '"></label><label>Email (username)<input id="m3" value="' + esc(c.smtp_user) + '"></label><label>App password<input id="m4" type="password" value="' + esc(c.smtp_pass) + '" placeholder="not shown"></label>' +
          '<label>Send alerts to<input id="m5" value="' + esc(c.notify_to) + '"></label><label>Use SSL (port 465)<select id="m6"><option value="0">No (STARTTLS)</option><option value="1"' + (c.smtp_ssl ? " selected" : "") + ">Yes</option></select></label></div>" +
          '<div class="row" style="margin-top:12px"><button class="btn p" id="msave">Save</button><button class="btn" id="mtest">Send test email</button></div></div>';
        function body() { return { smtp_host: $("#m1").value, smtp_port: $("#m2").value, smtp_user: $("#m3").value, smtp_pass: $("#m4").value, notify_to: $("#m5").value, smtp_ssl: $("#m6").value === "1" }; }
        $("#msave").onclick = function () { api("secrets", { json: body() }).then(function () { toast("Save ho gaya ✔"); }); };
        $("#mtest").onclick = function () { api("secrets", { json: body() }).then(function () { return api("test-email", { json: {} }); }).then(function (j) { toast(j.sent ? "Test email bhej di ✔" : "Nahi gayi: " + j.message, !j.sent); }); };
      });
    },
    sec: function () {
      api("history").then(function (h) {
        $("#view").innerHTML = '<div class="grid g2"><div class="card"><h3>Change password</h3><label>Current password<input id="s0" type="password"></label><label>New username (optional)<input id="su"></label><label>New password<input id="s1" type="password"></label><label>Repeat<input id="s2" type="password"></label><button class="btn p" id="sgo">Change password</button></div>' +
          '<div class="card"><h3>Backup</h3><p class="mu" style="margin-bottom:12px">Poori website ka data (text, tasveerein, applications, uploaded documents) ek zip file mein. Hafte mein ek dafa zaroor download karke USB / Google Drive par rakhein.</p><a class="btn p" href="/api/admin/backup">⬇ Download full backup</a></div></div>' +
          '<div class="card" style="margin-top:16px"><h3>Previous versions of the website text</h3><p class="mu" style="margin-bottom:10px">Har Save se pehle purana version محفوظ ho jata hai. Galti ho jaye to wapas laa sakte hain.</p>' + (h.items.slice(0, 15).map(function (f) { return '<div class="row" style="justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--bd)"><span>' + esc(f.replace("content-", "").replace(".json", "").replace(/^(\d{4})(\d\d)(\d\d)-(\d\d)(\d\d)(\d\d)$/, "$1-$2-$3  $4:$5:$6")) + '</span><button class="btn sm" data-r="' + esc(f) + '">Restore</button></div>'; }).join("") || '<p class="mu">Abhi koi purana version nahi.</p>') +
          '<div style="margin-top:14px"><button class="btn red" id="sreset">Reset all website text to default</button></div></div>';
        $("#sgo").onclick = function () { if ($("#s1").value !== $("#s2").value) return toast("Passwords match nahi karte", true); api("password", { json: { old: $("#s0").value, new: $("#s1").value, user: $("#su").value } }).then(function () { toast("Password badal gaya ✔"); $("#s0").value = $("#s1").value = $("#s2").value = ""; }); };
        $$("[data-r]", $("#view")).forEach(function (b) { b.onclick = function () { if (!confirm("Is version ko wapas laayen?")) return; api("history-restore", { json: { file: b.getAttribute("data-r") } }).then(function () { return api("content"); }).then(function (c) { CONTENT = c; setDirty(false); toast("Wapas aa gaya ✔"); views.sec(); }); }; });
        $("#sreset").onclick = function () { if (!confirm("Poora text default par chala jayega. Pakka?")) return; api("reset-content", { json: {} }).then(function () { return api("content"); }).then(function (c) { CONTENT = c; setDirty(false); toast("Reset ho gaya"); }); };
      });
    }
  };
  function loadMedia() {
    api("media").then(function (j) {
      $("#mlist").innerHTML = '<div class="media">' + (j.items.map(function (m) {
        return '<div class="mi"><div class="th"' + (m.kind === "image" ? ' style="background-image:url(\'' + esc(m.url) + '\')"' : "") + ">" + (m.kind === "video" ? "🎞️ video" : "") + '</div><div class="in"><div>' + esc(m.name) + "</div>" + fmtSize(m.size) + '<div class="acts"><button class="btn sm" data-c="' + esc(m.url) + '">Copy URL</button><button class="btn sm red" data-d="' + esc(m.name) + '">Delete</button></div></div></div>';
      }).join("") || '<p class="mu">Library khali hai.</p>') + "</div>";
      $$("[data-c]", $("#mlist")).forEach(function (b) { b.onclick = function () { try { navigator.clipboard.writeText(location.origin + b.getAttribute("data-c")); } catch (e) { } toast("URL copy ho gaya"); }; });
      $$("[data-d]", $("#mlist")).forEach(function (b) { b.onclick = function () { if (confirm("Delete karein? Agar website mein use ho rahi hai to wahan se hat jayegi.")) api("media-delete", { json: { name: b.getAttribute("data-d") } }).then(loadMedia); }; });
    });
  }
  function inqDetail(r) {
    var msg = "Assalam o Alaikum " + r.name + ", Swat Online Application Center se. Aap ki application " + r.ref + " (" + (r.service || "") + ") ke baare mein:";
    modal('<div class="row" style="justify-content:space-between"><h3>' + esc(r.ref) + '</h3><span class="st ' + esc(r.status) + '">' + esc(r.status) + "</span></div>" +
      '<p style="margin:8px 0"><b>' + esc(r.name) + '</b> · <a href="tel:' + esc(r.phone) + '">' + esc(r.phone) + "</a>" + (r.email ? " · " + esc(r.email) : "") + (r.city ? " · " + esc(r.city) : "") + '</p><p class="mu">' + esc(r.created) + " · " + esc(r.service || "—") + "</p>" +
      '<div class="card" style="margin:12px 0;white-space:pre-wrap">' + (esc(r.message) || '<span class="mu">(no message)</span>') + "</div>" +
      (r.docs.length ? "<p><b>Documents:</b></p><div class=\"row\" style=\"margin:6px 0 12px\">" + r.docs.map(function (d) { return '<a class="btn sm" target="_blank" href="/api/admin/inquiry-doc?id=' + d.id + '">📎 ' + esc(d.orig) + " (" + fmtSize(d.size) + ")</a>"; }).join("") + "</div>" : "") +
      '<label>Status<select id="is">' + STATUSES.map(function (s) { return "<option" + (s === r.status ? " selected" : "") + ">" + s + "</option>"; }).join("") + '</select></label><label>Message customer will see when tracking<input id="ip" value="' + esc(r.public_note) + '" maxlength="500"></label><label>Private note (only you)<textarea id="in">' + esc(r.note) + "</textarea></label>" +
      '<div class="row"><button class="btn p" id="isave">Save</button><a class="btn" target="_blank" rel="noopener" href="https://wa.me/' + waDigits(r.phone) + "?text=" + encodeURIComponent(msg) + '">💬 WhatsApp</a><a class="btn" href="tel:' + esc(r.phone) + '">📞 Call</a><button class="btn red" id="idel">Delete</button><button class="btn ghost" id="iclose">Close</button></div>');
    $("#iclose").onclick = closeModal;
    $("#isave").onclick = function () { api("inquiry-update", { json: { id: r.id, status: $("#is").value, note: $("#in").value, public_note: $("#ip").value } }).then(function () { closeModal(); toast("Save ho gaya ✔"); views.inq(); }); };
    $("#idel").onclick = function () { if (confirm("Ye application aur uske documents hamesha ke liye delete honge. Pakka?")) api("inquiry-delete", { json: { id: r.id } }).then(function () { closeModal(); views.inq(); }); };
  }

  /* ---------------------------------------------------------------- boot */
  api("me", { quiet: true }).then(function () { start(false); }).catch(function () { $("#login").hidden = false; });
})();
