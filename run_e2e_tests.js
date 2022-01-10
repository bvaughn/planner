#!/usr/bin/env node

"use strict";

const { spawn } = require("child_process");
const { join } = require("path");

const ROOT_PATH = join(__dirname);

let buildProcess = null;
let serverProcess = null;
let testProcess = null;

function format(loggable) {
  return `${loggable}`
    .split("\n")
    .filter((line) => {
      return line.trim() !== "";
    })
    .map((line) => `  ${line}`)
    .join("\n");
}

function logBright(loggable) {
  console.log(`\x1b[1m${loggable}\x1b[0m`);
}

function logDim(loggable) {
  const formatted = format(loggable, 2);
  if (formatted !== "") {
    console.log(`\x1b[2m${formatted}\x1b[0m`);
  }
}

function logError(loggable) {
  const formatted = format(loggable, 2);
  if (formatted !== "") {
    console.error(`\x1b[31m${formatted}\x1b[0m`);
  }
}

function build() {
  logBright("Building project");

  buildProcess = spawn("yarn", ["build"], { cwd: ROOT_PATH });
  buildProcess.stdout.on("data", (data) => {
    logDim(data);
  });
  buildProcess.stderr.on("data", (data) => {
    if (`${data}`.startsWith("warn")) {
      logDim(data);
    } else {
      logError(`Error:\n${data}`);

      exitWithCode(1);
    }
  });
  buildProcess.on("close", (code) => {
    logBright("Project built");

    runServer();
  });
}

function runServer() {
  const timeoutID = setTimeout(() => {
    // Assume the test server failed to start.
    logError("Server failed to start");
    exitWithCode(1);
  }, 30000);

  logBright("Starting server");

  serverProcess = spawn("yarn", ["start"], { cwd: ROOT_PATH });
  serverProcess.stdout.on("data", (data) => {
    if (`${data}`.includes("Ready on")) {
      logBright("Testing server running");

      clearTimeout(timeoutID);

      runEndToEndTests();
    }
  });
  serverProcess.stderr.on("data", (data) => {
    if (`${data}`.includes("EADDRINUSE")) {
      // Something is occuprying this port;
      // We could kill the process and restart but probably better to prompt the user to do this.

      logError("Free up the port and re-run tests:");
      logBright("  kill -9 $(lsof -ti:8080)");

      exitWithCode(1);
    } else if (`${data}`.includes("ERROR")) {
      logError(`Error:\n${data}`);

      exitWithCode(1);
    } else {
      // Non-fatal stuff like Babel optimization warnings etc.
      logDim(data);
    }
  });
}

async function runEndToEndTests() {
  logBright("Running e2e tests");

  testProcess = spawn("yarn", ["test:e2e"], { cwd: ROOT_PATH });
  testProcess.stdout.on("data", (data) => {
    // Log without formatting because Playwright applies its own formatting.
    const formatted = format(data);
    if (formatted !== "") {
      console.log(formatted);
    }
  });
  testProcess.stderr.on("data", (data) => {
    // Log without formatting because Playwright applies its own formatting.
    const formatted = format(data);
    if (formatted !== "") {
      console.error(formatted);
    }

    exitWithCode(1);
  });
  testProcess.on("close", (code) => {
    logBright(`Tests completed with code: ${code}`);

    exitWithCode(code);
  });
}

function exitWithCode(code) {
  if (buildProcess !== null) {
    try {
      logBright("Shutting down build process");
      buildProcess.kill();
    } catch (error) {
      logError(error);
    }
  }

  if (serverProcess !== null) {
    try {
      logBright("Shutting down server process");
      serverProcess.kill();
    } catch (error) {
      logError(error);
    }
  }

  if (testProcess !== null) {
    try {
      logBright("Shutting down test process");
      testProcess.kill();
    } catch (error) {
      logError(error);
    }
  }

  process.exit(code);
}

build();
