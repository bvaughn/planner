const { test, expect } = require("@playwright/test");
const {
  getTestNameInnerText,
  loadData,
  setEditorText,
} = require("./page-utils");

const tasks = [
  {
    start: 0,
    duration: 1,
    owner: "bvaughn",
    name: "Brian's project",
  },
  {
    start: 2,
    duration: 3,
    owner: "team",
    name: "Team project",
  },
];

const team = {};

test.describe("Teams", () => {
  test.beforeEach(async ({ page }) => {
    await loadData(page, { tasks, team });
  });

  test("should be editable", async ({ page }) => {
    const innerTextBefore = await getTestNameInnerText(page, "Legend-list");
    expect(innerTextBefore).toMatchSnapshot("team-1.txt");
    expect(await page.locator("canvas").screenshot()).toMatchSnapshot(
      "canvas-screenshot-1.png"
    );

    // Change team configuration.
    await Promise.all([
      page.waitForResponse("https://avatars.githubusercontent.com/**"),
      setEditorText(
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
      ),
    ]);

    // Verify that the Legend has been updated and the Canvas has redrawn.
    const innerTextAfter = await getTestNameInnerText(page, "Legend-list");
    expect(innerTextAfter).toMatchSnapshot("team-2.txt");
    expect(await page.locator("canvas").screenshot()).toMatchSnapshot(
      "canvas-screenshot-2.png"
    );

    // Change user avatar.
    await Promise.all([
      page.waitForResponse("https://avatars.githubusercontent.com/**"),
      setEditorText(
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
      ),
    ]);

    // Verify that the Canvas has redrawn with the new avatar.
    expect(await page.locator("canvas").screenshot()).toMatchSnapshot(
      "canvas-screenshot-3.png"
    );
  });
});
