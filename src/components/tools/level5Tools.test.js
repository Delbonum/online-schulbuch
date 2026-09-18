import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import FactoringChallenge from "./FactoringChallenge";
import RsaKeyTool from "./RsaKeyTool";
import RsaCipherTool from "./RsaCipherTool";

test("Faktorisierung prüft Produkt und Primzahlen", async () => {
  const user = userEvent.setup();
  render(<FactoringChallenge number={3127} />);

  await user.type(screen.getByLabelText("Erster Faktor"), "50");
  await user.type(screen.getByLabelText("Zweiter Faktor"), "60");
  await user.click(screen.getByRole("button", { name: "Prüfen" }));
  expect(screen.getByText(/gesucht ist 3127/)).toBeInTheDocument();

  await user.clear(screen.getByLabelText("Erster Faktor"));
  await user.type(screen.getByLabelText("Erster Faktor"), "53");
  await user.clear(screen.getByLabelText("Zweiter Faktor"));
  await user.type(screen.getByLabelText("Zweiter Faktor"), "59");
  await user.click(screen.getByRole("button", { name: "Prüfen" }));
  expect(screen.getByText(/Richtig!/)).toBeInTheDocument();
});

test("Schlüsselerzeugung zeigt öffentlichen und privaten Schlüssel", async () => {
  const user = userEvent.setup();
  render(<RsaKeyTool />);
  const keyText = (value) => screen.getByText((_, el) => el?.tagName === "P" && el.textContent === value);
  expect(keyText("(e, n) = (3, 391)")).toBeInTheDocument();
  expect(keyText("(d, n) = (235, 391)")).toBeInTheDocument();

  await user.selectOptions(screen.getByLabelText("Primzahl p"), "11");
  expect(keyText("(e, n) = (3, 253)")).toBeInTheDocument();
  expect(keyText("(d, n) = (147, 253)")).toBeInTheDocument();
});

test("Ver- und Entschlüsseln mit RSA", async () => {
  const user = userEvent.setup();
  render(<RsaCipherTool initialModulus={391} initialExponent={3} />);

  await user.type(screen.getByLabelText("Klartext"), "hallo");
  await user.click(screen.getByRole("button", { name: "↓ verschlüsseln" }));
  const cipher = screen.getByLabelText("Geheimtext (Zahlen, durch Leerzeichen getrennt)");
  expect(cipher).toHaveValue("121 1 164 164 247");

  await user.clear(screen.getByLabelText("Exponent (e zum Ver-, d zum Entschlüsseln)"));
  await user.type(screen.getByLabelText("Exponent (e zum Ver-, d zum Entschlüsseln)"), "235");
  await user.click(screen.getByRole("button", { name: "↑ entschlüsseln" }));
  expect(screen.getByLabelText("Klartext")).toHaveValue("HALLO");
});
