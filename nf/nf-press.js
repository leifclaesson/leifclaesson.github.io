/* nf-press.js -- staged from code_2/NfWebKit/theme/ (09d55cbbb2) by bake-web-subset.py.
   Generated: comments stripped, code untouched. Edit the kit, not this. */
export const PRESSED = "is-pressed";
export const AWAY = "is-press-away";

const HANDED_OVER = "[data-dragging]";

const fire = (el, phase, over) =>
  el.dispatchEvent(new CustomEvent("nf-press", { bubbles: true, detail: { phase, over } }));

export function installPressFeedback(opts = {}) {
  const root = opts.root || document;
  const selector = opts.selector || ".nf-btn";

  let btn = null;
  let pointerId = null;
  let over = false;

  const setOver = (isOver) => {
    over = isOver;

    if (btn.closest(HANDED_OVER)) { btn.classList.remove(PRESSED, AWAY); return; }
    btn.classList.toggle(PRESSED, isOver);
    btn.classList.toggle(AWAY, !isOver);
  };

  const isOver = (e) => {
    const el = document.elementFromPoint(e.clientX, e.clientY);
    return !!el && btn.contains(el);
  };

  const onMove = (e) => {
    if (!btn || e.pointerId !== pointerId) return;
    const now = isOver(e);
    if (now === over) return;
    setOver(now);
    fire(btn, "move", now);
  };

  const onUp = (e) => {
    if (!btn || (e && e.pointerId !== pointerId)) return;

    fire(btn, "end", e && e.type === "pointerup" ? over : false);
    btn.classList.remove(PRESSED, AWAY);
    btn = null;
    pointerId = null;
    window.removeEventListener("pointermove", onMove);
    window.removeEventListener("pointerup", onUp);
    window.removeEventListener("pointercancel", onUp);
  };

  const onDown = (e) => {
    if (e.button !== 0) return;
    const el = e.target instanceof Element ? e.target.closest(selector) : null;
    if (!el || el.hasAttribute("disabled")) return;
    if (btn) onUp(null);
    btn = el;
    pointerId = e.pointerId;
    setOver(true);
    fire(btn, "down", true);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
  };

  root.addEventListener("pointerdown", onDown);
  return () => {
    if (btn) onUp(null);
    root.removeEventListener("pointerdown", onDown);
  };
}
