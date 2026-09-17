import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DiffieHellmanTool from "./DiffieHellmanTool";
import ColorMixingTool from "./ColorMixingTool";
import DiscreteLogChallenge from "./DiscreteLogChallenge";
import ModPowTool from "./ModPowTool";

test("Diffie-Hellman-Werkzeug berechnet für beide denselben Schlüssel", async () => {
  const user = userEvent.setup();
  render(<DiffieHellmanTool />);
  expect(screen.getByText(/Beide erhalten denselben geheimen Schlüssel K = 2\./)).toBeInTheDocument();

  await user.selectOptions(screen.getByLabelText("Primzahl p (öffentlich)"), "29");
  expect(screen.getByLabelText("Basis g (öffentlich)")).toHaveValue("2");
  const [aliceInput, bobInput] = screen.getAllByRole("spinbutton");
  await user.clear(aliceInput);
  await user.type(aliceInput, "12");
  await user.clear(bobInput);
  await user.type(bobInput, "23");
  expect(screen.getByText(/K = 20\./)).toBeInTheDocument();
});

test("Farbmischung ergibt für Alice und Bob dieselbe Farbe", () => {
  render(<ColorMixingTool />);
  expect(screen.getByText(/Alice und Bob haben genau dieselbe Farbe/)).toBeInTheDocument();
});

test("Diskreter Logarithmus: Rückmeldung zum Versuch", async () => {
  const user = userEvent.setup();
  render(<DiscreteLogChallenge g={3} p={17} target={13} />);
  await user.type(screen.getByLabelText("x ="), "3");
  await user.click(screen.getByRole("button", { name: "Prüfen" }));
  expect(screen.getByText(/leider nicht 13/)).toBeInTheDocument();
  await user.clear(screen.getByLabelText("x ="));
  await user.type(screen.getByLabelText("x ="), "4");
  await user.click(screen.getByRole("button", { name: "Prüfen" }));
  expect(screen.getByText(/Richtig/)).toBeInTheDocument();
});

test("Modulo-Rechner zeigt Ergebnis und prüft Eingaben", async () => {
  const user = userEvent.setup();
  render(<ModPowTool initialBase={2} initialExponent={12} initialModulus={29} />);
  expect(
    screen.getByText((_, el) => el?.tagName === "SPAN" && el.textContent === "212 mod 29 = 7"),
  ).toBeInTheDocument();
  await user.clear(screen.getByLabelText("Modul p"));
  await user.type(screen.getByLabelText("Modul p"), "1");
  expect(screen.getByText(/Der Modul muss zwischen 2/)).toBeInTheDocument();
});
