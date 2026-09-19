// Winzige Helfer zum Erzeugen von DOM- und SVG-Elementen.

export function h(tag, props = {}, ...children) {
  const el = document.createElement(tag);
  applyProps(el, props);
  append(el, children);
  return el;
}

const SVG_NS = 'http://www.w3.org/2000/svg';

export function s(tag, props = {}, ...children) {
  const el = document.createElementNS(SVG_NS, tag);
  applyProps(el, props);
  append(el, children);
  return el;
}

function applyProps(el, props) {
  for (const [k, v] of Object.entries(props ?? {})) {
    if (v == null || v === false) continue;
    if (k === 'class') el.setAttribute('class', v);
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
    else if (k === 'value' || k === 'checked' || k === 'disabled') el[k] = v;
    else el.setAttribute(k, v === true ? '' : v);
  }
}

function append(el, children) {
  for (const c of children.flat(Infinity)) {
    if (c == null || c === false) continue;
    el.append(c instanceof Node ? c : String(c));
  }
}

// Umschalter mit mehreren Optionen (wie Radio-Buttons).
export function segmented({ options, value, onChange, label, className = '' }) {
  const wrap = h('div', { class: `segmented ${className}`, role: 'radiogroup', 'aria-label': label });
  const buttons = options.map((o) => {
    const b = h('button', {
      type: 'button',
      role: 'radio',
      class: 'segment',
      'aria-checked': String(o.value === value),
      onclick: () => {
        if (b.getAttribute('aria-checked') === 'true') return;
        buttons.forEach((x) => x.setAttribute('aria-checked', String(x === b)));
        onChange(o.value);
      },
    }, o.title ? h('span', { class: 'segment-title' }, o.title) : o.label, o.sub ? h('span', { class: 'segment-sub' }, o.sub) : null);
    return b;
  });
  wrap.append(...buttons);
  return wrap;
}

export function formatNumber(n) {
  return n.toLocaleString('de-DE');
}
