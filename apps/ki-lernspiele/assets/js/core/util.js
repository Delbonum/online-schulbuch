// Kleine Hilfsfunktionen ohne DOM-Bezug (auch in Node-Tests nutzbar).

export function randomChoice(items, rng = Math.random) {
  return items[Math.floor(rng() * items.length)];
}

export function weightedChoice(items, weights, rng = Math.random) {
  const total = weights.reduce((a, b) => a + b, 0);
  let r = rng() * total;
  for (let i = 0; i < items.length; i++) {
    r -= weights[i];
    if (r < 0) return items[i];
  }
  return items[items.length - 1];
}

export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
