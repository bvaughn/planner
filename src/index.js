import React from "react";
import ReactDOM from "react-dom/unstable_testing";
import App from "./App";
import "./index.css";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);

// Expose as a global for e2e Playwright tests
window.REACT_DOM = ReactDOM;
