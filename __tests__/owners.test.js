const { test, expect } = require("@playwright/test");
const {
  getTestNameInnerText,
  loadData,
  setEditorText,
} = require("./page-utils");

const team = {
  brian: {
    avatar: "/avatar.png",
    color: "#aaa",
    name: "Brian",
  },
};

test.describe("Owners", () => {
  test("should show avatar", async ({ page }) => {
    await loadData(page, {
      tasks: [
        {
          start: 0,
          duration: 1,
          owner: "brian",
          name: "Brian's project",
        },
      ],
      team,
    });

    expect(await page.locator("canvas").screenshot()).toMatchSnapshot(
      "canvas-screenshot-avatar.png"
    );
  });

  test("should show owner initial", async ({ page }) => {
    await loadData(page, {
      tasks: [
        {
          start: 0,
          duration: 1,
          owner: "erin",
          name: "Erin's project",
        },
      ],
      team,
    });

    expect(await page.locator("canvas").screenshot()).toMatchSnapshot(
      "canvas-screenshot-initial.png"
    );
  });

  test("should show primary owner avatar and badge", async ({ page }) => {
    await loadData(page, {
      tasks: [
        {
          start: 0,
          duration: 1,
          owner: ["brian", "erin"],
          name: "Team project (Brian leads)",
        },
      ],
      team,
    });

    expect(await page.locator("canvas").screenshot()).toMatchSnapshot(
      "canvas-screenshot-avatar-plus-badge.png"
    );
  });

  test("should show primary owner initial and badge", async ({ page }) => {
    await loadData(page, {
      tasks: [
        {
          start: 0,
          duration: 1,
          owner: ["erin", "brian"],
          name: "Team project (Erin leads)",
        },
      ],
      team,
    });

    expect(await page.locator("canvas").screenshot()).toMatchSnapshot(
      "canvas-screenshot-initial-plus-badge.png"
    );
  });
});
