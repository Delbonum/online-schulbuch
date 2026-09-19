// Farbmischung für die Analogie zum Diffie-Hellman-Schlüsselaustausch.
// Eine Mischung ist eine Sammlung gleich großer Farbportionen; gemischt wird im linearen RGB-Raum.

const toLinear = (c) => {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
};

const toSrgb = (v) => {
  const c = v <= 0.0031308 ? v * 12.92 : 1.055 * v ** (1 / 2.4) - 0.055;
  return Math.round(Math.min(1, Math.max(0, c)) * 255);
};

const parseHex = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));

/** Mischt beliebig viele Farben (#rrggbb) zu gleichen Teilen. */
export function mixColors(...hexColors) {
  if (hexColors.length === 0) throw new Error("Keine Farben zum Mischen");
  const sums = [0, 0, 0];
  for (const hex of hexColors) {
    parseHex(hex).forEach((channel, i) => {
      sums[i] += toLinear(channel);
    });
  }
  return (
    "#" +
    sums
      .map((sum) =>
        toSrgb(sum / hexColors.length)
          .toString(16)
          .padStart(2, "0"),
      )
      .join("")
  );
}
