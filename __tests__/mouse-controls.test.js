const { test, expect } = require("@playwright/test");
const {
  getTestNameInnerText,
  loadData,
  setEditorText,
} = require("./page-utils");

function dispatchMouseEvent(element, type, pointOrRect) {
  const event = new CustomEvent(type);

  if (pointOrRect) {
    const { x, y, width, height } = pointOrRect;
    event.offsetX = x;
    if (width > 0) {
      event.offsetX += width / 2;
    }
    event.offsetY = y;
    if (height > 0) {
      event.offsetY += height / 2;
    }
  }

  window.event = event;

  element.dispatchEvent(event);

  window.event = undefined;
}

async function openContextMenu(page, taskName) {
  await page.evaluate(({code, name}) => {
    const canvas = document.querySelector("canvas");
    const rect = window.__PLANNER_TEST_ONLY_FIND_TASK_RECT(name);

    const fn = eval(code);
    fn(canvas, "mousemove", rect);
    fn(canvas, "contextmenu", rect);
  }, {
    code: dispatchEventCodeString,
    name: taskName
  });
}

// Pass into page scope and eval to access dispatchMouseEvent() function.
const dispatchEventCodeString = `(${dispatchMouseEvent.toString()})`;

const TASKS = [
  {
    name: "Long text that gets clipped",
    start: "2022-04-01 12:00",
    stop: "2022-04-01",
    owner: 'bvaughn',
    id: 1,
  },
  {
    name: "Short text",
    start: "2022-04-03",
    stop: "2022-04-04",
    owner: 'bvaughn',
    id: 2,
  },
  {
    name: "Task with no URL",
    start: "2022-04-01",
    stop: "2022-04-03",
    owner: 'team',
    id: 3,
  },
  {
    name: "Task with a URL",
    start: "2022-04-04",
    stop: "2022-04-07",
    url: "about:blank",
    owner: 'team',
    id: 4,
  },
];

const TEAM = {
  bvaughn: {
    name: 'Brian Vaughn'
  },
  team: {
    name: "Team"
  }
};

test.describe("Mouse controls", () => {
  test.beforeEach(async ({ page }) => {
    await loadData(page, {
      tasks: TASKS,
      team: TEAM,
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

      const fn = eval(code);
      fn(canvas, "mousemove", rect);

      const over = rect;
      const off = {
        x: rect.x - 10,
        y: rect.y,
        height: rect.height,
        width: 0,
      };

      return { over, off };
    }, dispatchEventCodeString);

    expect(await page.locator("canvas").screenshot()).toMatchSnapshot(
      "mouse-over-tooltip-clipped-text.png"
    );

    // Mousing away from the task should hide the tooltip.
    await page.evaluate(
      ({ code, points }) => {
        const canvas = document.querySelector("canvas");

        const fn = eval(code);
        fn(canvas, "mousemove", points.off);
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

        const fn = eval(code);
        fn(canvas, "mousemove", points.over);
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

      const fn = eval(code);
      fn(canvas, "mousemove", rect);
    }, dispatchEventCodeString);

    expect(await page.locator("canvas").screenshot()).toMatchSnapshot(
      "mouse-over-tooltip-no-clipped-text.png"
    );
  });

  test("should show a context menu with the option to copy task name", async ({
    page,
  }) => {
    await openContextMenu(page, "Task with no URL");

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
    await openContextMenu(page, "Task with a URL");

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

        const fn = eval(code);
        fn(canvas, "click", rect);
      }, dispatchEventCodeString),
    ]);

    expect(await newPageA.locator("body").screenshot()).toMatchSnapshot(
      "new-tab-task-url.png"
    );

    // The context menu should also be able to do this
    await openContextMenu(page, "Task with a URL");

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

  test("should delete the task", async ({ context, page }) => {
    expect(await page.locator("canvas").screenshot()).toMatchSnapshot(
      "delete-task-before.png"
    );

    await openContextMenu(page, "Short text");

    await page.waitForSelector('[data-testname="ContextMenu-RemoveTask"]');

    await page.evaluate(() => {
      const option = document.querySelector(
        '[data-testname="ContextMenu-RemoveTask"]'
      );
      option.click();
    });

    expect(await page.locator("canvas").screenshot()).toMatchSnapshot(
      "delete-task-after.png"
    );
  });

  test("should edit a task task", async ({ context, page }) => {
    expect(await page.locator("canvas").screenshot()).toMatchSnapshot(
      "edit-task-before.png"
    );

    await openContextMenu(page, "Short text");
    await page.waitForSelector('[data-testname="ContextMenu-EditTask"]');
    await page.evaluate(() => {
      const option = document.querySelector(
        '[data-testname="ContextMenu-EditTask"]'
      );
      option.click();
    });

    await page.waitForSelector('[data-testname="Input-TaskName"]');
    await page.fill('[data-testname="Input-TaskName"]', 'Updated short text');
    await page.selectOption('[data-testname="Input-TaskOwner"]', 'team');
    await page.fill('[data-testname="Input-TaskStartDate"]', '2022-04-05');
    await page.fill('[data-testname="Input-TaskStopDate"]', '2022-04-06');
    await page.check('[data-testname="Input-TaskOngoing"]');
    await page.selectOption('[data-testname="Input-TaskDependency"]', `${TASKS[0].id}`);
    await page.evaluate(() => {
      const saveButton = document.querySelector(
        '[data-testname="Input-TaskSaveButton"]'
      );
      saveButton.click();
    });

    expect(await page.locator("canvas").screenshot()).toMatchSnapshot(
      "edit-task-update-one.png"
    );

    await openContextMenu(page, "Updated short text");
    await page.waitForSelector('[data-testname="ContextMenu-EditTask"]');
    await page.evaluate(() => {
      const option = document.querySelector(
        '[data-testname="ContextMenu-EditTask"]'
      );
      option.click();
    });

    await page.waitForSelector('[data-testname="Input-TaskName"]');
    await page.selectOption('[data-testname="Input-TaskOwner"]', 'bvaughn');
    await page.uncheck('[data-testname="Input-TaskOngoing"]');
    await page.selectOption('[data-testname="Input-TaskDependency"]', '');
    await page.evaluate(() => {
      const saveButton = document.querySelector(
        '[data-testname="Input-TaskSaveButton"]'
      );
      saveButton.click();
    });

    expect(await page.locator("canvas").screenshot()).toMatchSnapshot(
      "edit-task-update-two.png"
    );
  });
});
