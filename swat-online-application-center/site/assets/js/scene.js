/* Swat valley - procedural cinematic scene (WebGL).  Resolution independent: stays razor sharp up to 8K screens. */
(function () {
  "use strict";

  var FRAG = [
    "precision highp float;",
    "uniform vec2 uRes; uniform float uTime; uniform vec2 uMouse; uniform float uScroll; uniform float uPal; uniform float uQ; uniform float uCycle;",
    "float hash11(float p){p=fract(p*0.1031);p*=p+33.33;p*=p+p;return fract(p);}",
    "float hash21(vec2 p){vec3 q=fract(vec3(p.xyx)*0.1031);q+=dot(q,q.yzx+33.33);return fract((q.x+q.y)*q.z);}",
    "float n1(float x){float i=floor(x),f=fract(x);f=f*f*(3.0-2.0*f);return mix(hash11(i),hash11(i+1.0),f);}",
    "float n2(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);float a=hash21(i),b=hash21(i+vec2(1.0,0.0)),c=hash21(i+vec2(0.0,1.0)),d=hash21(i+vec2(1.0,1.0));return mix(mix(a,b,f.x),mix(c,d,f.x),f.y);}",
    "float fbm(vec2 p){float a=0.5,s=0.0;for(int i=0;i<5;i++){s+=a*n2(p);p=p*2.03+vec2(17.1,9.2);a*=0.5;}return s;}",
    "float fbm3(vec2 p){float a=0.5,s=0.0;for(int i=0;i<3;i++){s+=a*n2(p);p=p*2.03+vec2(7.1,3.2);a*=0.5;}return s;}",
    "float ridge(float x,float seed){float a=0.5,f=1.0,r=0.0,t=0.0;for(int i=0;i<5;i++){r+=a*(1.0-abs(2.0*n1(x*f+seed)-1.0));t+=a;a*=0.5;f*=2.1;}return r/t;}",
    "struct Pal{vec3 zen;vec3 mid;vec3 hor;vec3 sun;vec3 fog;vec2 sp;float st;float cl;};",
    "Pal getPal(int k){Pal p;",
    " if(k==0){p.zen=vec3(0.03,0.05,0.18);p.mid=vec3(0.17,0.26,0.50);p.hor=vec3(1.0,0.56,0.28);p.sun=vec3(1.0,0.80,0.46);p.fog=vec3(0.95,0.60,0.44);p.sp=vec2(0.34,0.50);p.st=0.08;p.cl=0.9;}",
    " else if(k==1){p.zen=vec3(0.07,0.25,0.62);p.mid=vec3(0.27,0.54,0.86);p.hor=vec3(0.80,0.92,1.0);p.sun=vec3(1.0,0.97,0.85);p.fog=vec3(0.74,0.86,0.96);p.sp=vec2(0.64,0.72);p.st=0.0;p.cl=1.0;}",
    " else if(k==2){p.zen=vec3(0.05,0.03,0.17);p.mid=vec3(0.30,0.14,0.38);p.hor=vec3(1.0,0.34,0.20);p.sun=vec3(1.0,0.58,0.28);p.fog=vec3(0.86,0.40,0.42);p.sp=vec2(0.70,0.42);p.st=0.25;p.cl=1.0;}",
    " else if(k==3){p.zen=vec3(0.0,0.02,0.10);p.mid=vec3(0.03,0.12,0.30);p.hor=vec3(0.22,0.50,0.72);p.sun=vec3(0.62,0.82,1.0);p.fog=vec3(0.20,0.42,0.62);p.sp=vec2(0.52,0.36);p.st=0.9;p.cl=0.5;}",
    " else{p.zen=vec3(0.0,0.005,0.03);p.mid=vec3(0.01,0.04,0.13);p.hor=vec3(0.05,0.15,0.26);p.sun=vec3(0.80,0.90,1.0);p.fog=vec3(0.06,0.17,0.28);p.sp=vec2(0.74,0.70);p.st=1.5;p.cl=0.35;}",
    " return p;}",
    "Pal mixPal(Pal a,Pal b,float t){Pal p;p.zen=mix(a.zen,b.zen,t);p.mid=mix(a.mid,b.mid,t);p.hor=mix(a.hor,b.hor,t);p.sun=mix(a.sun,b.sun,t);p.fog=mix(a.fog,b.fog,t);p.sp=mix(a.sp,b.sp,t);p.st=mix(a.st,b.st,t);p.cl=mix(a.cl,b.cl,t);return p;}",
    "Pal current(){float x=uPal;float i=floor(x);float f=fract(x);f=smoothstep(0.62,1.0,f);int a=int(mod(i,5.0));int b=int(mod(i+1.0,5.0));if(uCycle<0.5){f=0.0;}return mixPal(getPal(a),getPal(b),f);}",
    "vec3 skyAt(vec2 uv,float asp,Pal P){float t=clamp((uv.y-0.12)/0.88,0.0,1.0);vec3 s=mix(P.hor,P.mid,smoothstep(0.0,0.55,t));s=mix(s,P.zen,smoothstep(0.35,1.0,t));",
    " float d=length(vec2((uv.x-P.sp.x)*asp,uv.y-P.sp.y));s+=P.sun*(exp(-d*5.0)*0.55+exp(-d*22.0)*1.1);return s;}",
    "void main(){",
    " vec2 frag=gl_FragCoord.xy;vec2 uv=frag/uRes;float asp=uRes.x/uRes.y;float px=1.5/uRes.y;float T=uTime;",
    " Pal P=current();",
    " vec2 sp=P.sp+vec2(uMouse.x*0.012,uMouse.y*0.008);",
    " vec2 q=vec2((uv.x-sp.x)*asp,uv.y-sp.y);float dsun=length(q);",
    " vec3 col=skyAt(uv,asp,P);",
    " col=mix(col,P.sun*1.6,smoothstep(0.022,0.014,dsun)*0.95);",
    " col+=P.sun*exp(-dsun*3.2)*0.12;",
    // stars
    " if(P.st>0.01){vec2 sg=uv*vec2(asp,1.0)*vec2(160.0,160.0);vec2 si=floor(sg);float h=hash21(si);float tw=0.6+0.4*sin(T*(1.0+h*3.0)+h*40.0);float star=step(0.9985,h)*smoothstep(0.32,0.0,length(fract(sg)-0.5))*tw;col+=vec3(0.85,0.92,1.0)*star*P.st*smoothstep(0.38,0.85,uv.y)*1.2;}",
    // clouds
    " float cs=uQ>0.5?1.0:0.0;",
    " vec2 cp=vec2(uv.x*asp*0.9+T*0.006+uMouse.x*0.03,uv.y*2.6);float cn=fbm(cp*vec2(1.6,2.2)+vec2(0.0,3.1));float cm=smoothstep(0.50,0.78,cn)*smoothstep(0.26,0.50,uv.y)*(1.0-smoothstep(0.9,1.02,uv.y))*P.cl;",
    " float cl2=fbm3(cp*vec2(1.6,2.2)+vec2(0.3,3.1)+vec2(0.12,0.08));float edge=clamp((cn-cl2)*6.0+0.5,0.0,1.0);",
    " vec3 ccol=mix(P.zen*1.1+P.mid*0.30,P.hor*1.15+P.sun*0.45,clamp(exp(-dsun*1.4)*1.5*(0.30+0.70*edge)+0.12*edge,0.0,1.0));",
    " col=mix(col,ccol,cm*0.85);",
    // god rays (occluded later by mountains)
    " float ang=atan(q.y,q.x);float rays=pow(n1(ang*7.0+T*0.05)*0.6+n1(ang*17.0-T*0.03)*0.4,2.2);rays*=exp(-dsun*1.5)*smoothstep(0.03,0.22,dsun);col+=P.sun*rays*0.30*(0.35+0.65*P.cl);",
    // mountains
    " vec3 deepc=P.zen*0.30+P.fog*0.02;",
    " for(int i=0;i<5;i++){float fi=float(i);float t5=fi/4.0;",
    "  float base=0.40-fi*0.066;float amp=0.22-fi*0.030;float scl=1.7+fi*0.95;",
    "  float xo=uv.x*asp+uMouse.x*(0.008+fi*0.012)+fi*5.3;",
    "  float yo=uv.y+uScroll*(0.020+fi*0.030);",
    "  float x=xo*scl;float hh=base+amp*(ridge(x,fi*13.0+1.7)-0.48);",
    "  if(i>=3){float N=(i==3)?95.0:62.0;float cell=floor(xo*N);float tr=abs(fract(xo*N)-0.5)*2.0;float th=0.55+0.9*hash11(cell+fi);hh+=(i==3?0.016:0.026)*(1.0-tr)*th;}",
    "  float m=smoothstep(hh+px,hh-px,yo);",
    "  float h2=base+amp*(ridge(x+0.02,fi*13.0+1.7)-0.48);float slope=(h2-hh)*60.0;",
    "  float sunSide=sign(sp.x*asp-xo+fi*5.3);float face=clamp(-slope*sunSide*0.9,-1.0,1.0);",
    "  vec3 lc=mix(mix(P.mid*0.85,P.hor*0.75+P.mid*0.25,0.38),deepc,pow(t5,0.5));",
    "  float tex=fbm3(vec2(xo*scl*3.0+yo*9.0,yo*22.0+fi*7.0));lc*=0.60+0.95*tex;",
    "  float below=clamp((hh-yo)/max(amp*0.9,0.05),0.0,1.0);lc*=mix(1.15,0.55,pow(below,0.7)*(0.4+0.6*t5));",
    "  float haze=mix(0.42,0.0,pow(t5,0.7))*(0.20+0.80*smoothstep(0.0,1.0,1.0-below));",
    "  float fogSheet=fbm3(vec2(xo*2.2+T*(0.010+fi*0.006),yo*7.0+fi*4.0));",
    "  haze=clamp(haze+fogSheet*0.12*(1.0-t5)-0.05,0.0,0.85);",
    "  lc=mix(lc,P.fog*(0.70+0.30*P.cl),haze);",
    "  float edgeD=hh-yo;float rimM=exp(-edgeD/0.010)*step(0.0,edgeD);float sunN=0.25+0.75*exp(-abs(xo-sp.x*asp)*0.8);lc+=P.sun*rimM*0.9*(1.0-0.45*t5)*sunN;",
    "  if(i<2){float rel=(yo-base)/amp;float sn=smoothstep(0.50,0.66,rel+(n2(vec2(xo*scl*9.0,yo*70.0))-0.5)*0.22);sn*=smoothstep(0.0,0.04,hh-yo);vec3 sc=mix(vec3(0.70,0.78,0.95),P.sun*1.1+0.2,0.55*exp(-abs(xo-sp.x*asp)*0.7));sc=mix(sc,P.fog,0.15+0.2*t5);lc=mix(lc,sc,sn*0.9);}",
    "  col=mix(col,lc,m);",
    "  float mist=exp(-pow((yo-(base-0.012))/0.055,2.0))*(0.35+0.65*fbm3(vec2(xo*3.0+T*0.02*(1.0+fi*0.5),yo*9.0)));",
    "  col=mix(col,P.fog*(0.8+0.3*P.cl),clamp(mist,0.0,1.0)*(0.40-0.06*fi)*(1.0-step(3.5,fi))*smoothstep(0.0,0.1,yo));",
    " }",
    // river
    " float rv=0.150;float rm=smoothstep(rv+px,rv-px,uv.y);",
    " float ry=clamp(2.0*rv-uv.y,0.0,1.0);float rip=(n2(vec2(uv.x*asp*220.0,uv.y*34.0+T*0.8))-0.5)*0.018+sin(uv.y*340.0+n1(uv.x*24.0+T*0.2)*6.0+T*1.4)*0.0025;",
    " vec3 refl=skyAt(vec2(uv.x+rip*1.5,ry+rip),asp,P);",
    " vec3 water=mix(vec3(0.004,0.025,0.045)+P.mid*0.10,refl*0.85,pow(smoothstep(0.0,rv,uv.y),1.6)*0.85);",
    " float glint=pow(n2(vec2(uv.x*asp*16.0+T*0.35,uv.y*420.0)),6.0)*exp(-abs(uv.x-sp.x)*asp*2.2)*2.2;water+=P.sun*glint*(0.5+0.5*smoothstep(0.0,0.3,P.sp.y));",
    " water*=0.7+0.3*smoothstep(0.0,rv,uv.y);",
    " col=mix(col,water,rm);",
    " col+=P.sun*exp(-pow((uv.y-rv)/0.004,2.0))*0.22;",
    // foreground pines left/right
    " {float xo=uv.x*asp+uMouse.x*0.05;float side=smoothstep(0.34,0.0,uv.x)+smoothstep(0.66,1.0,uv.x);",
    "  float N=40.0;float cell=floor(xo*N);float tr=abs(fract(xo*N)-0.5)*2.0;float th=0.5+hash11(cell*1.7);",
    "  float fh=0.075+0.17*side*(0.55+0.45*ridge(xo*3.0,77.0))+0.040*(1.0-tr)*th*(0.4+side);",
    "  float fm=smoothstep(fh+px,fh-px,uv.y);fm*=1.0-rm*0.0;",
    "  vec3 fc=vec3(0.004,0.010,0.016)+P.fog*0.02;fc+=P.sun*0.07*exp(-abs(uv.x-sp.x)*asp*1.2)*(1.0-smoothstep(0.0,0.3,uv.y));",
    "  col=mix(col,fc,fm*step(rv*0.55,uv.y+0.0));}",
    // dust / fireflies
    " for(int k=0;k<3;k++){float fk=float(k);float s=18.0+fk*14.0;vec2 g=vec2(uv.x*asp,uv.y)*s;g.y-=T*(0.15+0.1*fk);g.x+=sin(T*0.4+fk*3.0)*0.4;vec2 ci=floor(g);vec2 cf=fract(g)-0.5;float h=hash21(ci+fk*31.0);",
    "  vec2 off=(vec2(hash21(ci+7.0),hash21(ci+13.0))-0.5)*0.7;float d=length(cf-off);float tw=0.5+0.5*sin(T*(0.8+h*2.0)+h*20.0);",
    "  float dot_=smoothstep(0.07+0.03*fk,0.0,d)*step(0.55,h)*tw;col+=mix(P.sun,vec3(1.0),0.4)*dot_*(0.35+0.2*P.st)*smoothstep(0.08,0.4,uv.y);}",
    // grade
    " col=(col*(2.51*col+0.03))/(col*(2.43*col+0.59)+0.14);",
    " float lum=dot(col,vec3(0.299,0.587,0.114));col=mix(vec3(lum),col,1.12);",
    " col=mix(col,col*vec3(0.92,1.02,1.08),smoothstep(0.5,0.0,lum)*0.5);",
    " vec2 vq=uv-0.5;col*=1.0-dot(vq,vq)*0.85;",
    " col+=(hash21(frag+fract(T)*100.0)-0.5)*0.022;",
    " gl_FragColor=vec4(clamp(col,0.0,1.0),1.0);}"
  ].join("\n");

  var VERT = "attribute vec2 p;void main(){gl_Position=vec4(p,0.0,1.0);}";

  function compile(gl, type, src) {
    var s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      var log = gl.getShaderInfoLog(s);
      gl.deleteShader(s);
      throw new Error("Shader: " + log);
    }
    return s;
  }

  function start(canvas, opts) {
    opts = opts || {};
    var gl = canvas.getContext("webgl", { antialias: false, alpha: false, powerPreference: "high-performance", preserveDrawingBuffer: !!opts.still }) ||
             canvas.getContext("experimental-webgl");
    if (!gl) return null;
    var prog;
    try {
      prog = gl.createProgram();
      gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, VERT));
      gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, FRAG));
      gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
    } catch (e) {
      if (window.console) console.warn("Scene disabled:", e.message);
      return null;
    }
    gl.useProgram(prog);
    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    var loc = gl.getAttribLocation(prog, "p");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    var U = {};
    ["uRes", "uTime", "uMouse", "uScroll", "uPal", "uQ", "uCycle"].forEach(function (n) { U[n] = gl.getUniformLocation(prog, n); });

    var dprMax = opts.dprMax || 2;
    var scale = opts.still ? 1 : 1;
    var cycle = opts.cycle !== false;
    var palStatic = opts.palette || 0;
    var running = false, visible = true, raf = 0, t0 = performance.now(), tOff = opts.time || (opts.still ? 0 : 0);
    var mouse = { x: 0, y: 0, tx: 0, ty: 0 }, scroll = 0;
    var frames = 0, acc = 0, last = performance.now();
    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function size() {
      var r = canvas.getBoundingClientRect();
      var dpr = Math.min(window.devicePixelRatio || 1, dprMax) * scale;
      var w = Math.max(2, Math.round(r.width * dpr)), h = Math.max(2, Math.round(r.height * dpr));
      if (opts.fixedSize) { w = opts.fixedSize[0]; h = opts.fixedSize[1]; }
      if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
      gl.viewport(0, 0, w, h);
    }

    function draw(now) {
      size();
      var t = (opts.still ? tOff : (now - t0) / 1000 + tOff);
      mouse.x += (mouse.tx - mouse.x) * 0.05;
      mouse.y += (mouse.ty - mouse.y) * 0.05;
      gl.uniform2f(U.uRes, canvas.width, canvas.height);
      gl.uniform1f(U.uTime, t);
      gl.uniform2f(U.uMouse, mouse.x, mouse.y);
      gl.uniform1f(U.uScroll, scroll);
      gl.uniform1f(U.uPal, cycle ? (t / 24 + palStatic) : palStatic);
      gl.uniform1f(U.uQ, scale > 0.7 ? 1 : 0);
      gl.uniform1f(U.uCycle, cycle ? 1 : 0);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }

    function loop(now) {
      if (!running) return;
      raf = requestAnimationFrame(loop);
      var dt = now - last; last = now;
      draw(now);
      if (!opts.still) {
        acc += dt; frames++;
        if (frames >= 40) {
          var avg = acc / frames; frames = 0; acc = 0;
          if (avg > 26 && scale > 0.45) scale = Math.max(0.45, scale * 0.85);
          else if (avg < 13 && scale < 1) scale = Math.min(1, scale * 1.08);
        }
      }
    }

    function play() { if (running || reduce || opts.still) return; running = true; last = performance.now(); raf = requestAnimationFrame(loop); }
    function pause() { running = false; cancelAnimationFrame(raf); }

    function onMove(e) { mouse.tx = (e.clientX / window.innerWidth - 0.5) * 2; mouse.ty = -(e.clientY / window.innerHeight - 0.5) * 2; }
    function onScroll() { var h = canvas.getBoundingClientRect().height || 1; scroll = Math.min(1.5, Math.max(0, window.scrollY / h)); }
    if (!opts.still) {
      window.addEventListener("pointermove", onMove, { passive: true });
      window.addEventListener("scroll", onScroll, { passive: true });
      if ("IntersectionObserver" in window) {
        new IntersectionObserver(function (es) { visible = es[0].isIntersecting; visible && !document.hidden ? play() : pause(); }).observe(canvas);
      }
      document.addEventListener("visibilitychange", function () { document.hidden ? pause() : (visible && play()); });
      window.addEventListener("resize", function () { if (!running) draw(performance.now()); });
    }
    canvas.addEventListener("webglcontextlost", function (e) { e.preventDefault(); pause(); }, false);
    canvas.addEventListener("webglcontextrestored", function () { start(canvas, opts); }, false);
    draw(performance.now());
    play();
    return { play: play, pause: pause, draw: draw, setScale: function (s) { scale = s; } };
  }

  window.SwatScene = { start: start };
})();
