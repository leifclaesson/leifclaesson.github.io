/* brushed-metal.js -- staged from code_2/NfWebKit/theme/ (87bbe0cc0c) by bake-web-subset.py.
   Generated: comments stripped, code untouched. Edit the kit, not this. */
import { installScrollBevel } from "./nf-scroll-bevel.js";

export const LINAC = {
  brightness: 150, scaleR: 0.75, scaleG: 0.80, scaleB: 0.90,
  gradScale: 0.6, gradSkew: 0.3,
};

export const BREAKAWAY = {
  brightness: 170, scaleR: 1.00, scaleG: 0.98, scaleB: 0.95,
  gradScale: 0.6, gradSkew: 0.3,
};

export const LIGHT = {
  brightness: 245, scaleR: 1.00, scaleG: 0.99, scaleB: 0.97,
  gradScale: 0.6, gradSkew: 0.3, flatten: 0.25,
};

export const MODES = { dark: LINAC, light: LIGHT };

const LUMA_SHIFT = 6;
const LUMA_OFFSET = 192 << 3;

function makeGrainWalker(seed) {
  let filter = 0, filter2 = 0, reseed = seed | 0, rs = reseed, at = 0;
  return function row(out, n, skip) {
    let f = filter, f2 = filter2, r = rs, sd = reseed, a = at;
    for (let k = 0; k < n; k++) {

      if (!(a & 4095)) { sd = (Math.imul(sd, 1103515245) + 12345) | 0; r = sd; }
      a++;
      r = (Math.imul(r, 196314165) + 907633515) | 0;
      f += ((((r & 32767) - 16384) - f) >> 4);
      f2 += (((f << 2) - f2) >> 4);
      if (f2 > 6000) f2 = 6000;
      if (f2 < -6000) f2 = -6000;
      out[k] = (f2 >> LUMA_SHIFT) + LUMA_OFFSET;
    }
    for (let k = 0; k < skip; k++) {
      if (!(a & 4095)) { sd = (Math.imul(sd, 1103515245) + 12345) | 0; r = sd; }
      a++;
      r = (Math.imul(r, 196314165) + 907633515) | 0;
      f += ((((r & 32767) - 16384) - f) >> 4);
      f2 += (((f << 2) - f2) >> 4);
      if (f2 > 6000) f2 = 6000;
      if (f2 < -6000) f2 = -6000;
    }
    filter = f; filter2 = f2; rs = r; reseed = sd; at = a;
  };
}

function makeSinePalette(piScale = 1.0, lumaOffsetScale = 0.7, piOffset = 0, subtract = 0) {
  const PI = 3.1415926;
  const pal = new Int32Array(1024);
  for (let a = 0; a < 1024; a++) {
    pal[a] = (Math.sin(piOffset + PI * 0.53 + ((a - 512) * ((PI * piScale) / 1024.0)))
      * (1024.0 * lumaOffsetScale) + (lumaOffsetScale * 2048)) - subtract;
  }
  const fin = new Int32Array(3072);
  fin.fill(pal[0], 0, 1024);
  fin.set(pal, 1024);
  fin.fill(pal[1023], 2048, 3072);
  return fin;
}

function makeGradientStarts(cx, cy, scale, skew) {
  const skewScale = (1024.0 / cx) * skew;
  const myScale = (1024.0 / cy) * scale;
  const starts = new Float64Array(cx);
  for (let x = 0; x < cx; x++) {
    const start = 512.0 + ((x - (cx >> 1)) * skewScale);
    starts[x] = ((((-cy) >> 1) * myScale) + start + 1024) * 4096.0 | 0;
  }
  return { starts, intScale: (4096 * myScale) | 0 };
}

export function grainStrideFor(cx) {
  let ccx = 1;
  while (ccx < cx + 100) ccx *= 2;
  return ccx;
}

export function renderBrushedMetal(cx, cy, p = LINAC, seed = 0x5eed1eaf, minStride = 0) {

  const ccx = Math.max(grainStrideFor(cx), minStride | 0);

  const walk = makeGrainWalker(seed);
  const metal = new Int16Array(cx);
  const grad = new Int16Array(cx);
  const fin = makeSinePalette();
  const { starts, intScale } = makeGradientStarts(cx, cy, p.gradScale, p.gradSkew);

  const scale = (8000 * p.brightness) >> 8;
  const rs = (scale * p.scaleR) | 0, gs = (scale * p.scaleG) | 0, bs = (scale * p.scaleB) | 0;

  const palR = new Uint8Array(2048), palG = new Uint8Array(2048), palB = new Uint8Array(2048);
  for (let a = 0; a < 2048; a++) {
    const sp = (a * 256) >> 4;
    palR[a] = Math.min(255, (sp * rs) >> 16);
    palG[a] = Math.min(255, (sp * gs) >> 16);
    palB[a] = Math.min(255, (sp * bs) >> 16);
  }

  const flatten = p.flatten || 0;
  if (flatten > 0) {
    const mid = 86;
    const [mr, mg, mb] = [palR[mid], palG[mid], palB[mid]];
    for (let a = 0; a < 2048; a++) {
      palR[a] += (mr - palR[a]) * flatten;
      palG[a] += (mg - palG[a]) * flatten;
      palB[a] += (mb - palB[a]) * flatten;
    }
  }

  const img = new ImageData(cx, cy);
  const d = img.data;
  let o = 0;
  for (let y = 0; y < cy; y++) {
    walk(metal, cx, ccx - cx);
    const add = (y + 1) * intScale;
    for (let x = 0; x < cx; x++) {
      let gi = (starts[x] + add) >> 12;
      if (gi < 0) gi = 0; else if (gi > 3071) gi = 3071;
      grad[x] = fin[gi];
    }
    for (let x = 0; x < cx; x++) {
      let i = (metal[x] * grad[x]) >> 11;
      i >>= 4;
      if (i < 0) i = 0; else if (i > 2047) i = 2047;
      d[o++] = palR[i]; d[o++] = palG[i]; d[o++] = palB[i]; d[o++] = 255;
    }
  }
  return img;
}

export function renderToCanvas(cx, cy, p = LINAC, seed) {
  const c = document.createElement("canvas");
  c.width = cx; c.height = cy;
  c.getContext("2d").putImageData(renderBrushedMetal(cx, cy, p, seed), 0, 0);
  return c;
}

let live = null;

export function metalSurface() { return live; }

export function metalPatchFor(el) { return live ? live.patchFor(el) : null; }

export function installBackground(opts = {}) {

  const root = document.documentElement;
  let p = opts.params || MODES[root.getAttribute("data-nf-mode")] || LINAC;
  const maxDpr = opts.maxDpr || 2;
  const settle = opts.settle == null ? 120 : opts.settle;
  const seed = opts.seed;

  const maxPixels = opts.maxTexturePixels || 32e6;

  const clip = document.createElement("div");
  Object.assign(clip.style, {
    position: "absolute", left: "0", top: "0", width: "100%", height: "0px",
    overflow: "hidden", zIndex: "-1", pointerEvents: "none",
  });
  clip.setAttribute("aria-hidden", "true");
  const canvas = document.createElement("canvas");
  Object.assign(canvas.style, {
    position: "absolute", left: "0", top: "0", display: "block",
  });

  canvas.setAttribute("aria-hidden", "true");
  clip.appendChild(canvas);
  (opts.mount || document.body).prepend(clip);

  document.documentElement.setAttribute("data-nf-metal", "");

  let texW = 0, texH = 0;
  let grainStride = 0;
  let texSerial = 0;
  let stripStyle = null;
  let stripKey = "";

  const patchMemo = new WeakMap();
  let scrollRule = null;
  let docCss = 0;
  let tall = false;

  function measureDoc() {
    const prev = clip.style.height;
    clip.style.height = "0px";
    const h = Math.max(root.scrollHeight, window.innerHeight);
    clip.style.height = prev;
    return h;
  }

  function metrics() {
    const dpr = Math.min(window.devicePixelRatio || 1, maxDpr);
    const cssW = window.innerWidth, viewH = window.innerHeight;
    const cx = Math.max(1, Math.round(cssW * dpr));
    let cssH = Math.max(docCss, viewH), isTall = true;
    if (cx * Math.round(cssH * dpr) > maxPixels) { cssH = viewH; isTall = false; }
    return {
      dpr, cssW, cssH, viewH, tall: isTall, cx,
      cy: Math.max(1, Math.round(cssH * dpr)),
    };
  }

  function fit(m) {

    clip.style.position = m.tall ? "absolute" : "fixed";
    clip.style.height = m.cssH + "px";
    canvas.style.width = m.cssW + "px";
    canvas.style.height = m.cssH + "px";
  }

  function update() {
    docCss = measureDoc();
    const m = metrics();
    fit(m);
    tall = m.tall;
    if (m.cx !== texW || m.cy !== texH) {
      texW = m.cx; texH = m.cy;
      grainStride = Math.max(grainStride, grainStrideFor(m.cx));
      canvas.width = texW;
      canvas.height = texH;
      canvas.getContext("2d")
        .putImageData(renderBrushedMetal(texW, texH, p, seed, grainStride), 0, 0);
      texSerial++;
    }
    publishScrollStrip(m);
    trackScroll();
  }

  function cssGutter() {
    const cs = getComputedStyle(root);
    const w = parseFloat(cs.getPropertyValue("--nf-scrollbar-w"));
    const inset = parseFloat(cs.getPropertyValue("--nf-scroll-inset"));
    return (w > 0 ? w : 30) + 2 * (inset >= 0 ? inset : 6);
  }

  function publishScrollStrip(m) {
    if (!texW || !texH) return;
    let gutter = window.innerWidth - root.clientWidth;
    if (gutter <= 0) gutter = cssGutter();
    const w = Math.max(1, Math.min(texW, Math.round(gutter * m.dpr)));
    const x = texW - w;
    const h = texH;
    const key = x + "|" + w + "|" + h + "|" + m.dpr + "|" + texSerial;
    if (key === stripKey) return;

    const strip = document.createElement("canvas");
    strip.width = w;
    strip.height = h;
    strip.getContext("2d").drawImage(canvas, x, 0, w, h, 0, 0, w, h);
    let url;
    try {
      url = strip.toDataURL("image/png");
    } catch {
      return;
    }
    stripKey = key;

    if (!stripStyle) {
      stripStyle = document.createElement("style");
      document.head.appendChild(stripStyle);
    }
    stripStyle.textContent =
      ':root{--nf-scroll-metal:url("' + url + '");' +
      "--nf-scroll-metal-size:" + (w / m.dpr) + "px " + (h / m.dpr) + "px}";
  }

  function ensureScrollRule() {
    if (scrollRule) return;
    const s = document.createElement("style");
    document.head.appendChild(s);
    s.sheet.insertRule("@media (min-width:701px){html::-webkit-scrollbar," +
      "body::-webkit-scrollbar{background-position-y:0}}", 0);
    scrollRule = s.sheet.cssRules[0].cssRules[0];
  }

  function trackScroll() {
    ensureScrollRule();

    const y = tall ? -(window.scrollY || root.scrollTop || 0) : 0;
    scrollRule.style.backgroundPositionY = y + "px";
  }

  function repaint() {
    texW = texH = 0;
    update();
  }

  if (opts.scrollBevel !== false) installScrollBevel();

  update();
  let frame = 0, timer = 0;
  window.addEventListener("resize", () => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => fit(metrics()));
    clearTimeout(timer);
    timer = setTimeout(update, settle);
  });

  window.addEventListener("scroll", trackScroll, { passive: true });

  if (typeof ResizeObserver === "function") {
    const ro = new ResizeObserver(() => {
      publishScrollStrip(metrics());
      clearTimeout(timer);
      timer = setTimeout(update, settle);
    });
    ro.observe(root);
    if (document.body) ro.observe(document.body);
  }

  live = {
    canvas,
    repaint,

    info() {
      const m = metrics();
      return { texW, texH, dpr: m.dpr, cssW: m.cssW, cssH: m.cssH,
               anchor: m.tall ? "document" : "viewport", serial: texSerial };
    },

    rectFor(el) {
      if (!texW || !texH) return null;
      const m = metrics();
      const r = el.getBoundingClientRect();

      const offY = m.tall ? window.scrollY : 0;
      const offX = m.tall ? window.scrollX : 0;
      const x = Math.round((r.left + offX) * m.dpr);
      const y = Math.round((r.top + offY) * m.dpr);
      const w = Math.max(1, Math.round(r.width * m.dpr));
      const h = Math.max(1, Math.round(r.height * m.dpr));
      if (x >= texW || y >= texH || x + w <= 0 || y + h <= 0) return null;
      return { x, y, w, h, dpr: m.dpr };
    },

    patchFor(el) {
      const q = live.rectFor(el);
      if (!q) return null;
      const x = Math.max(0, Math.min(q.x, texW - 1));
      const y = Math.max(0, Math.min(q.y, texH - 1));
      const w = Math.min(q.w, texW - x), h = Math.min(q.h, texH - y);
      const key = x + "|" + y + "|" + w + "|" + h + "|" + q.dpr + "|" + texSerial;
      const memo = patchMemo.get(el);
      if (memo && memo.key === key) return memo.rec;
      const cut = document.createElement("canvas");
      cut.width = w; cut.height = h;
      cut.getContext("2d").drawImage(canvas, x, y, w, h, 0, 0, w, h);
      let url;
      try { url = cut.toDataURL("image/png"); } catch { return null; }

      const rec = { url, width: w / q.dpr, height: h / q.dpr,
                    size: (w / q.dpr) + "px " + (h / q.dpr) + "px", serial: texSerial };
      patchMemo.set(el, { key, rec });
      return rec;
    },
  };

  if (!opts.params) {
    new MutationObserver(() => {
      const next = MODES[root.getAttribute("data-nf-mode")] || LINAC;
      if (next === p) return;
      p = next;
      repaint();
    }).observe(root, { attributes: true, attributeFilter: ["data-nf-mode"] });
  }
  return { canvas, repaint };
}
