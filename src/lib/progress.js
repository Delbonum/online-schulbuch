// Freischaltregel: Ein Level ist offen, sobald das letzte davor liegende
// *verpflichtende* Level bestanden ist. Level, die eine Lehrkraft für ihre Klasse
// als optional markiert hat, werden dabei übersprungen.
// (Absichtlich ohne Import der Level-Konfiguration, um zyklische Importe zu vermeiden.)

/**
 * @param {number} level betretenes Level
 * @param {number[]} optionalLevels als optional markierte Level
 * @returns {number|null} Level, das bestanden sein muss (null = frei zugänglich)
 */
export function requiredLevel(level, optionalLevels = []) {
  for (let candidate = level - 1; candidate >= 1; candidate--) {
    if (!optionalLevels.includes(candidate)) return candidate;
  }
  return null;
}
