import { generatePassword, toUsername } from "./BulkCreateDialog";

test("Benutzernamen aus Klassenlisten", () => {
  expect(toUsername("  Max Mustermann ")).toBe("max.mustermann");
  expect(toUsername("Jürgen Groß-Özdemir")).toBe("juergen.gross-oezdemir");
  expect(toUsername("Zoë  O'Brien")).toBe("zoe.obrien");
});

test("Passwörter sind zufällig und ohne verwechselbare Zeichen", () => {
  const passwords = Array.from({ length: 50 }, () => generatePassword());
  expect(new Set(passwords).size).toBe(50);
  expect(passwords.every((p) => /^[a-km-zA-HJ-NP-Z2-9]{8}$/.test(p))).toBe(true);
});
