/* nf-radio.js -- staged from code_2/NfWebKit/theme/ (87bbe0cc0c) by bake-web-subset.py.
   Generated: comments stripped, code untouched. Edit the kit, not this. */
import { PRESSED, AWAY } from "./nf-press.js";

const SELECTED = "is-selected";

const HOVERED = "is-hovered";

const DRAGGING = "data-dragging";

function groupOf(el) {
  if (!(el instanceof Element)) return null;
  const group = el.closest("[data-nf-radio], .nf-selector");
  if (!group) return null;
  const items = group.getAttribute("data-nf-radio") || ".nf-btn";
  const item = el.closest(items);
  if (!item || !group.contains(item)) return null;
  return { group, item, items: [...group.querySelectorAll(items)] };
}

function select(items, chosen, under) {
  for (const el of items) {
    const on = el === chosen;
    el.classList.toggle(SELECTED, on);
    el.classList.toggle(HOVERED, el === under);

    if (el.getAttribute("role") === "radio") el.setAttribute("aria-checked", on ? "true" : "false");
  }
}

export function installRadioGroups(opts = {}) {
  const root = opts.root || document;
  let live = null;

  const end = () => {
    window.removeEventListener("pointermove", onMove);
    const was = live;
    live = null;
    was?.group.removeAttribute(DRAGGING);
    return was;
  };
  const restore = () => { const was = end(); if (was) select(was.items, was.original, null); };

  const nearestPosition = (x, y) => {
    let best = null, bestDist = Infinity;
    for (const el of live.items) {
      if (el.hasAttribute("disabled")) continue;
      const r = el.getBoundingClientRect();

      const dx = Math.max(r.left - x, 0, x - r.right);
      const dy = Math.max(r.top - y, 0, y - r.bottom);
      const dist = dx * dx + dy * dy;
      if (dist < bestDist) { bestDist = dist; best = el; }
    }
    return best;
  };

  const positionAt = (x, y) => {
    const el = document.elementFromPoint(x, y);
    if (!(el instanceof Element) || !live.group.contains(el)) return null;
    const found = groupOf(el);
    if (found && found.group === live.group) {
      return found.item.hasAttribute("disabled") ? null : found.item;
    }
    return el.closest(".nf-btn") ? null : nearestPosition(x, y);
  };

  const onMove = (e) => {
    if (!live) return;
    const at = positionAt(e.clientX, e.clientY);
    select(live.items, at || live.original, at);
  };

  const onDown = (e) => {
    if (e.button !== 0) return;
    const found = groupOf(e.target);
    if (!found || found.item.hasAttribute("disabled")) return;
    const finger = e.pointerType === "touch" || e.pointerType === "pen";
    live = { ...found, finger,
             original: found.items.find((el) => el.classList.contains(SELECTED)) || null };

    live.group.setAttribute(DRAGGING, "");
    for (const el of live.items) el.classList.remove(PRESSED, AWAY);

    select(live.items, live.item, finger ? null : live.item);
    if (!finger) window.addEventListener("pointermove", onMove);
  };

  const onPress = (e) => {
    if (!live || !live.finger) return;
    if (e.detail.phase !== "move" || !live.item.contains(e.target)) return;
    select(live.items, e.detail.over ? live.item : live.original, null);
  };

  const onUp = (e) => {
    if (!live) return;
    const { items, group, original, finger, item: pressed } = live;

    let chosen;
    if (finger) {
      const found = groupOf(e.target);
      chosen = found && found.group === group && found.item === pressed
               && !pressed.hasAttribute("disabled") ? pressed : null;
    } else {
      chosen = positionAt(e.clientX, e.clientY);
    }
    end();

    select(items, chosen || original, null);

    if (chosen && chosen !== original) opts.onSelect?.(chosen, group);
  };

  root.addEventListener("pointerdown", onDown);
  root.addEventListener("nf-press", onPress);
  window.addEventListener("pointerup", onUp);
  window.addEventListener("pointercancel", restore);
  return () => {
    restore();
    root.removeEventListener("pointerdown", onDown);
    root.removeEventListener("nf-press", onPress);
    window.removeEventListener("pointerup", onUp);
    window.removeEventListener("pointercancel", restore);
  };
}
