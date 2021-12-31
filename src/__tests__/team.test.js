const { test, expect } = require("@playwright/test");
const config = require("../../playwright.config");
const { getTestNameInnerText, setEditorText } = require("./page-utils");
const { getUrlForData } = require("./url-utils");

const tasks = [
  {
    month: 0,
    length: 1,
    owner: "bvaughn",
    name: "Example",
  },
];

const team = {
  bvaughn: {
    avatar: "https://avatars.githubusercontent.com/u/29597",
    name: "Brian",
  },
  team: {
    avatar: null,
    name: "Unclaimed",
  },
};

test.use(config);
test.describe("Teams", () => {
  let page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();

    const url = getUrlForData({ tasks, team });

    await page.goto(url, {
      waitUntil: "domcontentloaded",
    });

    await page.waitForSelector("canvas");
  });

  test("should be editable", async () => {
    const innerTextBefore = await getTestNameInnerText(page, "Legend-list");
    expect(innerTextBefore).toMatchSnapshot("team-before.txt");

    expect(await page.locator("canvas").screenshot()).toMatchSnapshot(
      "canvas-screenshot-before.png"
    );

    await setEditorText(page, "team", "[]");

    const innerTextAfter = await getTestNameInnerText(page, "Legend-list");
    expect(innerTextAfter).toMatchSnapshot("team-after.txt");

    expect(await page.locator("canvas").screenshot()).toMatchSnapshot(
      "canvas-screenshot-after.png"
    );
  });
});
