import {
  applyMapping,
  caesar,
  frequencyMapping,
  gcd,
  guessCaesarShift,
  isPrime,
  factorSemiprime,
  lettersToNumbers,
  modInverse,
  modPow,
  numbersToLetters,
  parseNumberList,
  rsaDecryptLetters,
  rsaEncryptLetters,
  normalizeSubstitutionKey,
  parseShiftRule,
  powerSteps,
  primitiveRoots,
  progressiveCaesar,
  repeatKey,
  repeatedSequences,
  shiftedAlphabet,
  splitColumns,
  substitute,
  vigenere,
} from "./crypto";
import { mixColors } from "./colors";

describe("Caesar", () => {
  test("verschlüsselt wie in Level 1", () => {
    expect(caesar("SCHLACHT VERLOREN", 3)).toBe("VFKODFKW YHUORUHQ");
    expect(caesar("CLHKW HXFK CXUXHFN!", -3)).toBe("ZIEHT EUCH ZURUECK!");
  });

  test("behält Kleinbuchstaben und Sonderzeichen", () => {
    expect(caesar("xyz, Abc", 3)).toBe("abc, Def");
  });

  test("Geheimtextalphabet", () => {
    expect(shiftedAlphabet(3)).toBe("DEFGHIJKLMNOPQRSTUVWXYZABC");
  });

  test("Verschiebezahl über Häufigkeitsanalyse", () => {
    const text = "GOXX OC BOQXOD CSXN JOSDBOSCOX OSX QEDOC WSDDOV EW LOCCOBOC GODDOB JE OBVOLOX";
    expect(guessCaesarShift(text)).toBe(10);
    expect(caesar(text, -10)).toBe("WENN ES REGNET SIND ZEITREISEN EIN GUTES MITTEL UM BESSERES WETTER ZU ERLEBEN");
  });
});

describe("Ersetzungsverfahren", () => {
  const key = "MNBVCXZLKJHGFDSAPOIUYTREWQ";

  test("ver- und entschlüsselt wie in Level 2", () => {
    expect(substitute("HAB DANK MEISTER ALKINDI", key)).toBe("LMN VMDH FCKIUCO MGHKDVK");
    expect(substitute("ZOMDVKSI", key, true)).toBe("GRANDIOS");
    expect(substitute("VERTRAUEN", "QWERTZUIOPASDFGHJKLYXCVBNM")).toBe("CTKYKQXTF");
  });

  test("Schlüssel wird bereinigt", () => {
    expect(normalizeSubstitutionKey("qwe-rtzq1")).toBe("QWERTZ");
  });

  test("häufigkeitsbasierte Zuordnung", () => {
    const mapping = frequencyMapping("XXXYYZ");
    expect(applyMapping("XYZ", mapping)).toBe("ENI");
  });
});

describe("Vigenère", () => {
  test("entschlüsselt wie in Level 3", () => {
    expect(vigenere("BCZIEIZWZ", "VIGENERE", true)).toBe("GUTEREISE");
    expect(vigenere("WIESICHERISTVIGENERE", "ZEIT")).toBe("VMMLHGPXQMAMUMOXMIZX");
    expect(vigenere("HABE EINEN KLEINEN ESEL", "woin")).toBe("DOJRAWVRJYTREBMAAGMY");
  });

  test("ohne Schlüssel kein Ergebnis", () => {
    expect(vigenere("HALLO", "")).toBe("");
  });

  test("Schlüssel wiederholen", () => {
    expect(repeatKey("ZEIT", 10)).toBe("ZEITZEITZE");
  });

  test("Kolonnen und Kasiski-Test", () => {
    expect(splitColumns("ABCDEFG", 3)).toEqual(["ADG", "BE", "CF"]);
    const repeats = repeatedSequences("DOJRAWVRJYTREBMAAGMYEAAGWZTTAGMUAB");
    expect(repeats.find((r) => r.sequence === "AAG").distance).toBe(6);
    expect(gcd(12, 18)).toBe(6);
  });
});

describe("Progressive Caesar-Chiffre", () => {
  test("Regeln werden sicher ausgewertet", () => {
    expect(parseShiftRule("+1")(3)).toBe(4);
    expect(parseShiftRule("*3-1")(2)).toBe(5);
    expect(parseShiftRule("n*2+(3-1)")(12)).toBe(0);
    expect(parseShiftRule("-2")(1)).toBe(25);
    expect(() => parseShiftRule("alert(1)")).toThrow();
    expect(() => parseShiftRule("+")).toThrow();
    expect(() => parseShiftRule("/0")(1)).toThrow();
  });

  test("Verschlüsseln und Entschlüsseln", () => {
    const rule = parseShiftRule("+1");
    const { result, shifts } = progressiveCaesar("AB A", 1, rule);
    expect(result).toBe("BD D");
    expect(shifts).toEqual([1, 2, null, 3]);
    expect(progressiveCaesar(result, 1, rule, true).result).toBe("AB A");
  });
});

describe("Zahlentheorie", () => {
  test("modulare Potenz", () => {
    expect(modPow(5, 6, 23)).toBe(8);
    expect(modPow(8, 15, 23)).toBe(modPow(5, 6 * 15, 23));
    expect(modPow(2, 30, 94906249)).toBe(29773085);
    expect(modPow(94906248, 3, 94906249)).toBe(94906248);
  });

  test("Primzahlen", () => {
    expect([2, 3, 23, 97].every(isPrime)).toBe(true);
    expect([0, 1, 4, 91].some(isPrime)).toBe(false);
  });
});

describe("Diffie-Hellman", () => {
  test("Primitivwurzeln", () => {
    expect(primitiveRoots(23).slice(0, 3)).toEqual([5, 7, 10]);
    expect(primitiveRoots(29)[0]).toBe(2);
    expect(primitiveRoots(15)).toEqual([]);
  });

  test("Zwischenschritte der Potenz", () => {
    expect(powerSteps(3, 4, 17)).toEqual([3, 9, 10, 13]);
    expect(powerSteps(2, 12, 29).at(-1)).toBe(modPow(2, 12, 29));
  });

  test("Beispiel aus Level 4 ergibt denselben Schlüssel", () => {
    const [p, g, a, b] = [29, 2, 12, 23];
    const A = modPow(g, a, p);
    const B = modPow(g, b, p);
    expect([A, B]).toEqual([7, 10]);
    expect(modPow(B, a, p)).toBe(20);
    expect(modPow(A, b, p)).toBe(20);
    expect(caesar("NLYZZJOHEN OG GCNNYLHUWBN UG TYCNNIL", -20)).toBe("TREFFPUNKT UM MITTERNACHT AM ZEITTOR");
  });

  test("Farbmischung ist unabhängig von der Reihenfolge", () => {
    const common = "#ffd700";
    const alice = "#d62828";
    const bob = "#1d4ed8";
    expect(mixColors(mixColors(common, alice), bob)).not.toBe(mixColors(common, alice, bob));
    expect(mixColors(common, alice, bob)).toBe(mixColors(bob, common, alice));
    expect(mixColors("#000000", "#ffffff")).toBe("#bcbcbc");
  });
});

describe("RSA", () => {
  test("Inverses und Faktorisierung", () => {
    expect(modInverse(3, 352)).toBe(235);
    expect((3 * 235) % 352).toBe(1);
    expect(modInverse(2, 4)).toBeNull();
    expect(factorSemiprime(3127)).toEqual([53, 59]);
    expect(factorSemiprime(391)).toEqual([17, 23]);
    expect(factorSemiprime(17)).toBeNull();
  });

  test("Buchstaben als Zahlen", () => {
    expect(lettersToNumbers("AbZ!")).toEqual([1, 2, 26]);
    expect(numbersToLetters([1, 2, 26, 99])).toBe("ABZ?");
    expect(parseNumberList(" 12, 7  9 ")).toEqual([12, 7, 9]);
  });

  test("Beispiel aus Level 5: verschlüsseln und wieder entschlüsseln", () => {
    const [p, q, e] = [17, 23, 3];
    const n = p * q;
    const phi = (p - 1) * (q - 1);
    const d = modInverse(e, phi);
    expect([n, phi, d]).toEqual([391, 352, 235]);

    const cipher = rsaEncryptLetters("RSA IST SICHER", e, n);
    expect(rsaDecryptLetters(cipher, d, n)).toBe("RSAISTSICHER");
    expect(cipher).toEqual(rsaEncryptLetters("rsa ist sicher", e, n));
  });
});
