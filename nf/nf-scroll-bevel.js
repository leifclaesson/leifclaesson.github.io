/* nf-scroll-bevel.js -- staged from code_2/NfWebKit/theme/ (09d55cbbb2) by bake-web-subset.py.
   Generated: comments stripped, code untouched. Edit the kit, not this. */
const CORNERS = ["tl", "tr", "bl", "br"];

const OBJECTS = [
  {
    key: "well", inset: 0,
    tl: ["--nf-scroll-well-lo-2", "--nf-scroll-well-lo"],
    br: ["--nf-scroll-well-hi-2", "--nf-scroll-well-hi"],
  },
  {

    key: "thumb", inset: 2,
    tl: ["--nf-scroll-thumb-hi", "--nf-scroll-thumb-hi-2"],
    br: ["--nf-scroll-thumb-lo", "--nf-scroll-thumb-lo-2"],
  },
  {
    key: "thumbp", inset: 2,
    tl: ["--nf-scroll-thumbp-hi", "--nf-scroll-thumbp-hi-2"],
    br: ["--nf-scroll-thumbp-lo", "--nf-scroll-thumbp-lo-2"],
  },
];

function turnLamp(nx, ny, deg) {
  if (!deg) return [nx, ny];
  const a = Math.atan2(ny, nx) + (deg * Math.PI) / 180;
  const m = Math.hypot(nx, ny);
  return [Math.max(0, m * Math.cos(a)), Math.max(0, m * Math.sin(a))];
}

function wrapMask(c, rc, q, s, nx, ny) {
  const n = 2 * q;
  const cv = document.createElement("canvas");
  cv.width = cv.height = n;
  const g = cv.getContext("2d");
  const w = 2 * c;

  g.save();
  g.scale(s, s);
  g.fillStyle = "#000";
  g.beginPath();
  g.moveTo(w + 1, -1); g.lineTo(w + 1, w + 1); g.lineTo(-1, w + 1);
  g.lineTo(w / 2, w / 2); g.closePath();
  g.fill();
  g.restore();

  const img = g.getImageData(0, 0, n, n);
  const flat = c - rc;
  for (let j = 0; j < n; j++) {

    const py = (j + 0.5) / s - c;
    const ey = Math.abs(py) - flat;
    for (let i = 0; i < n; i++) {
      const px = (i + 0.5) / s - c;
      const ex = Math.abs(px) - flat;
      if (ex <= 0 && ey <= 0) continue;

      let ax = Math.max(ex, 0) * Math.sign(px);
      let ay = Math.max(ey, 0) * Math.sign(py);
      const len = Math.hypot(ax, ay);
      ax /= len; ay /= len;
      const toTl = nx * Math.max(0, -ax) + ny * Math.max(0, -ay);
      const toBr = nx * Math.max(0,  ax) + ny * Math.max(0,  ay);
      const sum = toTl + toBr;
      img.data[(j * n + i) * 4 + 3] = Math.round(255 * (sum > 0 ? toBr / sum : 0.5));
    }
  }
  g.putImageData(img, 0, 0);
  return cv;
}

function renderCorners(rc, tl, br, dpr, nx, ny, dsp) {
  const c = Math.max(rc, 2);
  const w = 2 * c;
  const q = Math.max(1, Math.round(c * dpr));
  const s = (2 * q) / w;

  const layer = () => {
    const el = document.createElement("canvas");
    el.width = el.height = 2 * q;
    const g = el.getContext("2d");
    g.scale(s, s);
    return { el, g };
  };

  const rr = (g, ox, oy) =>
    g.roundRect(ox, oy, w - 2 * ox, w - 2 * oy,
                [{ x: Math.max(0, rc - ox), y: Math.max(0, rc - oy) }]);
  const ring = (g, ox, oy, px, py) => { g.beginPath(); rr(g, ox, oy); rr(g, px, py); };

  const RINGS = [
    { paint: [-1, -1, nx, ny]         },
    { paint: [nx, ny, 2 * nx, 2 * ny] },
  ];

  const turnOf = (d, k) => (k ? +d : -d) / 2;

  const masks = new Map();
  const maskFor = (deg) => {
    let m = masks.get(deg);
    if (!m) masks.set(deg, (m = wrapMask(c, rc, q, s, ...turnLamp(nx, ny, deg))));
    return m;
  };

  const mix = (g, src, op) => {
    g.save();
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.globalCompositeOperation = op;
    g.drawImage(src, 0, 0);
    g.restore();
  };

  const compose = (d) => {
    const out = layer();
    RINGS.forEach((r, k) => {
      const A = layer(), B = layer();
      A.g.fillStyle = tl[k]; ring(A.g, ...r.paint); A.g.fill("evenodd");
      B.g.fillStyle = br[k]; ring(B.g, ...r.paint); B.g.fill("evenodd");
      const mask = maskFor(turnOf(d, k));
      mix(A.g, mask, "destination-out");
      mix(B.g, mask, "destination-in");
      mix(A.g, B.el, "lighter");

      mix(out.g, A.el, "source-over");
    });
    return out.el;
  };

  const pos = compose(dsp);
  const neg = dsp ? compose(-dsp) : pos;

  const tiles = {};
  CORNERS.forEach((name, i) => {
    const sx = (i & 1) ? q : 0, sy = (i & 2) ? q : 0;
    const t = document.createElement("canvas");
    t.width = t.height = q;
    t.getContext("2d").drawImage(name === "bl" ? neg : pos, sx, sy, q, q, 0, 0, q, q);
    tiles[name] = t.toDataURL("image/png");
  });
  return { c, tiles };
}

export function installScrollBevel(opts = {}) {
  const root = document.documentElement;
  const maxDpr = opts.maxDpr || 3;

  const probe = document.createElement("div");
  probe.style.display = "none";
  root.appendChild(probe);
  const resolve = (name) => {
    probe.style.color = "";
    probe.style.color = `var(${name})`;
    return getComputedStyle(probe).color;
  };

  let style = null, key = "", frame = 0;

  function build() {
    const cs = getComputedStyle(root);
    const radius = parseFloat(cs.getPropertyValue("--nf-scroll-radius")) || 0;
    const dpr = Math.min(window.devicePixelRatio || 1, maxDpr);

    const num = (n, dflt) => {
      const v = parseFloat(cs.getPropertyValue(n));
      return Number.isFinite(v) ? Math.max(0, Math.min(1, v)) : dflt;
    };
    const nx = num("--nf-lit-nx", 1), ny = num("--nf-lit-ny", 1);

    const dspRaw = parseFloat(cs.getPropertyValue("--nf-scroll-corner-desync"));
    const dsp = Number.isFinite(dspRaw) ? Math.max(-60, Math.min(60, dspRaw)) : 0;

    const specs = OBJECTS.map((o) => ({
      key: o.key,
      rc: Math.max(0, radius - o.inset),
      tl: o.tl.map(resolve),
      br: o.br.map(resolve),
    }));
    const next = JSON.stringify([dpr, nx, ny, dsp, specs]);
    if (next === key) return;

    let css = ":root{";
    for (const s of specs) {
      const { c, tiles } = renderCorners(s.rc, s.tl, s.br, dpr, nx, ny, dsp);
      css += `--nf-scroll-${s.key}-corner-c:${c}px;`;
      for (const name of CORNERS) {
        css += `--nf-scroll-${s.key}-corner-${name}:url("${tiles[name]}");`;
      }
    }
    css += "}";

    if (!style) {
      style = document.createElement("style");
      document.head.appendChild(style);
    }
    style.textContent = css;
    key = next;
  }

  function republish() {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(build);
  }

  build();

  new MutationObserver(republish).observe(root, {
    attributes: true, attributeFilter: ["style", "data-nf-mode", "data-nf-device"],
  });

  window.addEventListener("resize", republish);

  return { republish };
}
