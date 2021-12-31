const { test, expect } = require("@playwright/test");
const config = require("../../playwright.config");
const { getTestNameInnerText, setEditorText } = require("./page-utils");
const { getUrlForData } = require("./url-utils");

const tasks = [
  {
    id: "A",
    month: 0,
    length: 2,
    name: "A",
    owner: "one",
  },
  {
    month: 2,
    length: 1,
    name: "A:1",
    dependency: "A",
    owner: "one",
  },
  {
    id: "B",
    month: 1,
    length: 1,
    name: "B",
    owner: "two",
  },
  {
    month: 3,
    length: 2,
    name: "B:2",
    dependency: "B",
    isOngoing: true,
    owner: "two",
  },
  {
    month: 1.5,
    length: 1,
    name: "B:1",
    dependency: "B",
    owner: "two",
  },
  {
    month: 0.5,
    length: 4,
    name: "C",
    dependency: "C",
    owner: "three",
  },
  {
    month: 2.5,
    length: 1,
    name: "A:2",
    dependency: "A",
    owner: "one",
  },
];

const team = {};

test.use(config);
test.describe("Dependencies", () => {
  let page;

  test.beforeEach(async ({ browser }) => {
    const context = await browser.newContext({
      viewport: {
        width: 1024,
        height: 800,
      },
    });

    page = await context.newPage();

    const url = getUrlForData({ tasks, team });

    await page.goto(url, {
      waitUntil: "domcontentloaded",
    });

    await page.waitForSelector("canvas");
  });

  test("should be sorted and aligned correctly", async () => {
    expect(await page.locator("canvas").screenshot()).toMatchSnapshot(
      "canvas-screenshot-1.png"
    );
  });
});
