async function getTestNameInnerText(page, testName) {
  return page.evaluate((targetTestName) => {
    const { createTestNameSelector, findAllNodes } = window.REACT_DOM;
    const container = document.getElementById("root");
    const results = findAllNodes(container, [
      createTestNameSelector(targetTestName),
    ]);
    return results.length === 1 ? results[0].innerText : null;
  }, testName);
}

async function setEditorText(page, editorName, text) {
  await page.evaluate(async (testName) => {
    const { createTestNameSelector, findAllNodes } = window.REACT_DOM;
    const container = document.getElementById("root");
    const pre = findAllNodes(container, [createTestNameSelector(testName)])[0];
    pre.focus();
  }, `CodeEditor-pre-${editorName}`);

  await waitForTestName(page, `CodeEditor-textarea-${editorName}`);

  await page.evaluate(
    async ({ testName, text }) => {
      const { createTestNameSelector, findAllNodes } = window.REACT_DOM;
      const container = document.getElementById("root");
      const textarea = findAllNodes(container, [
        createTestNameSelector(testName),
      ])[0];
      textarea.value = text;

      textarea.blur();
    },
    { testName: `CodeEditor-textarea-${editorName}`, text }
  );

  await waitForTestName(page, `CodeEditor-pre-${editorName}`);
}

async function waitForTestName(page, testName) {
  await page.waitForFunction((targetTestName) => {
    const { createTestNameSelector, findAllNodes } = window.REACT_DOM;
    const container = document.getElementById("root");
    const results = findAllNodes(container, [
      createTestNameSelector(targetTestName),
    ]);
    return results.length === 1;
  }, testName);
}

module.exports = {
  getTestNameInnerText,
  setEditorText,
  waitForTestName,
};
