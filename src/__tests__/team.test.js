const { test, expect } = require("@playwright/test");
const config = require("../../playwright.config");
const { getTestNameInnerText, setEditorText } = require("./page-utils");
const { getUrlForData } = require("./url-utils");

const tasks = [
  {
    month: 0,
    length: 1,
    owner: "bvaughn",
    name: "Brian's project",
  },
  {
    month: 2,
    length: 3,
    owner: "team",
    name: "Team project",
  },
];

const team = {};

test.use(config);
test.describe("Teams", () => {
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

  test("should be editable", async () => {
    const innerTextBefore = await getTestNameInnerText(page, "Legend-list");
    expect(innerTextBefore).toMatchSnapshot("team-1.txt");
    expect(await page.locator("canvas").screenshot()).toMatchSnapshot(
      "canvas-screenshot-1.png"
    );

    // Change team configuration.
    await setEditorText(
      page,
      "team",
      JSON.stringify({
        bvaughn: {
          avatar: "https://avatars.githubusercontent.com/u/29597",
          name: "Brian",
        },
        team: {
          avatar: null,
          name: "Unclaimed",
        },
      })
    );

    // Verify that the Legend has been updated and the Canvas has redrawn.
    const innerTextAfter = await getTestNameInnerText(page, "Legend-list");
    expect(innerTextAfter).toMatchSnapshot("team-2.txt");
    expect(await page.locator("canvas").screenshot()).toMatchSnapshot(
      "canvas-screenshot-2.png"
    );

    // Change user avatar.
    await setEditorText(
      page,
      "team",
      JSON.stringify({
        bvaughn: {
          avatar: "https://avatars.githubusercontent.com/u/29597",
          name: "Brian",
        },
        team: {
          avatar: "https://avatars.githubusercontent.com/u/6412038?s=200&v=4",
          name: "Unclaimed",
        },
      })
    );

    // Verify that the Canvas has redrawn with the new avatar.
    expect(await page.locator("canvas").screenshot()).toMatchSnapshot(
      "canvas-screenshot-3.png"
    );
  });
});
