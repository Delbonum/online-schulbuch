// Freischaltregel: Level n ist offen, sobald Level n−1 bestanden ist.
// (Absichtlich ohne Import der Level-Konfiguration, um zyklische Importe zu vermeiden.)
export const requiredLevel = (level) => (level > 1 ? level - 1 : null);
