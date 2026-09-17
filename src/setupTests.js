import "@testing-library/jest-dom";

// jsdom kennt kein Scrollen
window.scrollTo = () => {};
