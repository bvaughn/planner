const { test, expect } = require("@playwright/test");
const {
  getTestNameInnerText,
  loadData,
  setEditorText,
} = require("./page-utils");

function dispatchMouseEvent(element, type, offsetX, offsetY) {
  const event = new CustomEvent(type);
  event.offsetX = offsetX;
  event.offsetY = offsetY;

  window.event = event;

  element.dispatchEvent(event);

  window.event = undefined;
}

// Pass into page scope and eval to access dispatchMouseEvent() function.
const dispatchEventCodeString = `(${dispatchMouseEvent.toString()})`;

const TASKS = [
  {
    name: "Long text that gets clipped",
    start: "2022-04-01 12:00",
    stop: "2022-04-01",
  },
  {
    name: "Short text",
    start: "2022-04-03",
    stop: "2022-04-04",
  },
  {
    name: "Task with no URL",
    start: "2022-04-01",
    stop: "2022-04-03",
  },
  {
    name: "Task with a URL",
    start: "2022-04-04",
    stop: "2022-04-07",
    url: "about:blank",
  },
];

test.describe("Mouse controls", () => {
  test.beforeEach(async ({ page }) => {
    await loadData(page, {
      tasks: TASKS,
      team: {},
    });
  });

  test("should show tooltips when mousing over items that have clipped text", async ({
    page,
  }) => {
    const points = await page.evaluate((code) => {
      const canvas = document.querySelector("canvas");

      const rect = window.__PLANNER_TEST_ONLY_FIND_TASK_RECT(
        "Long text that gets clipped"
      );

      const x = rect.x + rect.width / 2;
      const y = rect.y + rect.height / 2;

      const fn = eval(code);
      fn(canvas, "mousemove", x, y);

      return { over: { x, y }, off: { x: rect.x - 10, y } };
    }, dispatchEventCodeString);

    expect(await page.locator("canvas").screenshot()).toMatchSnapshot(
      "mouse-over-tooltip-clipped-text.png"
    );

    // Mousing away from the task should hide the tooltip.
    await page.evaluate(
      ({ code, points }) => {
        const canvas = document.querySelector("canvas");

        const { x, y } = points.off;

        const fn = eval(code);
        fn(canvas, "mousemove", x, y);
      },
      { points, code: dispatchEventCodeString }
    );

    expect(await page.locator("canvas").screenshot()).toMatchSnapshot(
      "mouse-over-tooltip-clipped-text-off.png"
    );

    // Re-show the tooltip
    await page.evaluate(
      ({ code, points }) => {
        const canvas = document.querySelector("canvas");

        const { x, y } = points.over;

        const fn = eval(code);
        fn(canvas, "mousemove", x, y);
      },
      { points, code: dispatchEventCodeString }
    );

    expect(await page.locator("canvas").screenshot()).toMatchSnapshot(
      "mouse-over-tooltip-clipped-text.png"
    );

    // Verify that mousing away from the canvas hides the tooltip too.
    await page.evaluate((code) => {
      const canvas = document.querySelector("canvas");

      const fn = eval(code);
      fn(canvas, "mouseleave");
    }, dispatchEventCodeString);

    expect(await page.locator("canvas").screenshot()).toMatchSnapshot(
      "mouse-over-tooltip-clipped-text-off.png"
    );
  });

  test("should not show tooltips when mousing over items that have full text", async ({
    page,
  }) => {
    await page.evaluate((code) => {
      const canvas = document.querySelector("canvas");

      const rect = window.__PLANNER_TEST_ONLY_FIND_TASK_RECT("Short text");

      const x = rect.x + rect.width / 2;
      const y = rect.y + rect.height / 2;

      const fn = eval(code);
      fn(canvas, "mousemove", x, y);
    }, dispatchEventCodeString);

    expect(await page.locator("canvas").screenshot()).toMatchSnapshot(
      "mouse-over-tooltip-no-clipped-text.png"
    );
  });

  test("should show a context menu with the option to copy task name", async ({
    page,
  }) => {
    await page.evaluate((code) => {
      const canvas = document.querySelector("canvas");

      const rect =
        window.__PLANNER_TEST_ONLY_FIND_TASK_RECT("Task with no URL");

      const x = rect.x + rect.width / 2;
      const y = rect.y + rect.height / 2;

      const fn = eval(code);
      fn(canvas, "mousemove", x, y);
      fn(canvas, "contextmenu", x, y);
    }, dispatchEventCodeString);

    expect(await page.locator("canvas").screenshot()).toMatchSnapshot(
      "mouse-over-tooltip-context-menu.png"
    );

    // Verify dismiss on click outside
    await page.evaluate(() => {
      const canvas = document.querySelector("canvas");
      canvas.click();
    });

    expect(await page.locator("canvas").screenshot()).toMatchSnapshot(
      "mouse-over-tooltip-context-menu-dismissed.png"
    );
  });

  test("should show a context menu with the option to copy the task url", async ({
    page,
  }) => {
    await page.evaluate((code) => {
      const canvas = document.querySelector("canvas");

      const rect = window.__PLANNER_TEST_ONLY_FIND_TASK_RECT("Task with a URL");

      const x = rect.x + rect.width / 2;
      const y = rect.y + rect.height / 2;

      const fn = eval(code);
      fn(canvas, "mousemove", x, y);
      fn(canvas, "contextmenu", x, y);
    }, dispatchEventCodeString);

    expect(await page.locator("canvas").screenshot()).toMatchSnapshot(
      "mouse-over-tooltip-context-menu-with-url.png"
    );

    // Verify dismiss on keyboard event
    await page.keyboard.press("Escape");

    expect(await page.locator("canvas").screenshot()).toMatchSnapshot(
      "mouse-over-tooltip-context-menu-with-url-dismissed.png"
    );
  });

  test("should open the task url", async ({ context, page }) => {
    // Clicking on the task should open the URL
    const [newPageA] = await Promise.all([
      context.waitForEvent("page"),
      page.evaluate((code) => {
        const canvas = document.querySelector("canvas");

        const rect =
          window.__PLANNER_TEST_ONLY_FIND_TASK_RECT("Task with a URL");

        const x = rect.x + rect.width / 2;
        const y = rect.y + rect.height / 2;

        const fn = eval(code);
        fn(canvas, "click", x, y);
      }, dispatchEventCodeString),
    ]);

    expect(await newPageA.locator("body").screenshot()).toMatchSnapshot(
      "new-tab-task-url.png"
    );

    // The context menu should also be able to do this
    await page.evaluate((code) => {
      const canvas = document.querySelector("canvas");

      const rect = window.__PLANNER_TEST_ONLY_FIND_TASK_RECT("Task with a URL");

      const x = rect.x + rect.width / 2;
      const y = rect.y + rect.height / 2;

      const fn = eval(code);
      fn(canvas, "mousemove", x, y);
      fn(canvas, "contextmenu", x, y);
    }, dispatchEventCodeString);

    await page.waitForSelector('[data-testname="ContextMenu-OpenURL"]');

    const [newPageB] = await Promise.all([
      context.waitForEvent("page"),
      await page.evaluate(() => {
        const option = document.querySelector(
          '[data-testname="ContextMenu-OpenURL"]'
        );
        option.click();
      }),
    ]);

    expect(await newPageB.locator("body").screenshot()).toMatchSnapshot(
      "new-tab-task-url.png"
    );
  });
});
