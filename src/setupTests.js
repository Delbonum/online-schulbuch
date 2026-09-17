import "@testing-library/jest-dom";

// jsdom kennt kein Scrollen
window.scrollTo = () => {};

// Web Crypto API für Zufallszahlen bereitstellen
if (!window.crypto?.getRandomValues) {
  Object.defineProperty(window, "crypto", { value: require("crypto").webcrypto });
}
