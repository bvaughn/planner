import React from "react";
import ReactDOM from "react-dom/unstable_testing";
import "./index.css";
import App from "./App";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);

// Expose as a global for e2e Playwright tests
window.REACT_DOM = ReactDOM;
