const { test, expect } = require("@playwright/test");
const { loadOgImage } = require("./page-utils");
const images = require("./images");

const TASKS = [
  {
    name: "Task",
    start: "2022-01-03",
    stop: "2022-01-09",
    owner: "brian",
  },
];

test.describe("image", () => {
  test("should render square images", async ({ page }) => {
    await loadOgImage(page, {
      tasks: TASKS,
      team: {
        brian: {
          avatar: images.SQUARE,
        },
      },
    });

    expect(await page.locator("img").screenshot()).toMatchSnapshot(
      "image-screenshot-square.png"
    );
  });

  test("should render tall images", async ({ page }) => {
    await loadOgImage(page, {
      tasks: TASKS,
      team: {
        brian: {
          avatar: images.TALL,
        },
      },
    });

    expect(await page.locator("img").screenshot()).toMatchSnapshot(
      "image-screenshot-tall.png"
    );
  });

  test("should render wide images", async ({ page }) => {
    await loadOgImage(page, {
      tasks: TASKS,
      team: {
        brian: {
          avatar: images.WIDE,
        },
      },
    });

    expect(await page.locator("img").screenshot()).toMatchSnapshot(
      "image-screenshot-wide.png"
    );
  });
});
