const { getUrlForData, getUrlForOgImage } = require("./url-utils");

async function getEditorText(page, editorName) {
  const text = await page.evaluate(async (testName) => {
    const pre = document.querySelector(`[data-testname="${testName}"]`);
    return pre.innerText;
  }, `CodeEditor-pre-${editorName}`);

  return text;
}

async function getTestNameInnerText(page, testName) {
  return page.evaluate((targetTestName) => {
    const element = document.querySelector(
      `[data-testname="${targetTestName}"]`
    );
    return element.innerText;
  }, testName);
}

async function loadData(page, data) {
  const url = getUrlForData(data);

  await page.goto(url, {
    waitUntil: "domcontentloaded",
  });

  await page.waitForSelector("canvas");
}

async function loadOgImage(page, data) {
  const url = getUrlForOgImage(data);
console.log('url:\n'+url+'\n');

  await page.goto(url, {
    waitUntil: "domcontentloaded",
  });

  await page.waitForSelector("img");
}

async function setEditorText(page, editorName, text) {
  await page.evaluate(async (testName) => {
    const pre = document.querySelector(`[data-testname="${testName}"]`);
    pre.focus();
  }, `CodeEditor-pre-${editorName}`);

  await waitForTestName(page, `CodeEditor-textarea-${editorName}`);

  await page.evaluate(
    async ({ testName, text }) => {
      const textarea = document.querySelector(`[data-testname="${testName}"]`);
      textarea.value = text;
      textarea.blur();
    },
    { testName: `CodeEditor-textarea-${editorName}`, text }
  );

  await waitForTestName(page, `CodeEditor-pre-${editorName}`);
}

async function waitForTestName(page, testName) {
  await page.waitForFunction((targetTestName) => {
    const results = document.querySelectorAll(
      `[data-testname="${targetTestName}"]`
    );
    return results.length === 1;
  }, testName);
}

module.exports = {
  getEditorText,
  getTestNameInnerText,
  loadData,
  loadOgImage,
  setEditorText,
  waitForTestName,
};
