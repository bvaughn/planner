const { test, expect } = require("@playwright/test");
const {
  getTestNameInnerText,
  loadData,
  setEditorText,
} = require("./page-utils");

async function clickButton(page, testName) {
  await page.evaluate((targetTestName) => {
    const button = document.querySelector(
      `[data-testname="${targetTestName}"]`
    );
    button.click();
  }, testName);
}

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
  await page.evaluate(
    ({ code, name }) => {
      const canvas = document.querySelector("canvas");
      const rect = window.__PLANNER_TEST_ONLY_FIND_TASK_RECT(name);

      const fn = eval(code);
      fn(canvas, "mousemove", rect);
      fn(canvas, "contextmenu", rect);
    },
    {
      code: dispatchEventCodeString,
      name: taskName,
    }
  );
}

// Pass into page scope and eval to access dispatchMouseEvent() function.
const dispatchEventCodeString = `(${dispatchMouseEvent.toString()})`;

const TASKS = [
  {
    name: "Task One",
    start: "2022-04-01",
    stop: "2022-04-04",
    owner: "bvaughn",
    id: 1,
  },
  {
    name: "Task Two",
    start: "2022-04-04",
    stop: "2022-04-05",
    owner: "bvaughn",
    id: 2,
  },
];

const TEAM = {
  bvaughn: {
    name: "Brian Vaughn",
  },
  team: {
    name: "Team",
  },
};

test.describe("Edit task modal", () => {
  test.beforeEach(async ({ page }) => {
    await loadData(page, {
      tasks: TASKS,
      team: TEAM,
    });
  });

  test("should edit a task task", async ({ context, page }) => {
    expect(await page.locator("canvas").screenshot()).toMatchSnapshot(
      "edit-task-before.png"
    );

    await openContextMenu(page, "Task Two");
    await page.waitForSelector('[data-testname="ContextMenu-EditTask"]');
    await clickButton(page, "ContextMenu-EditTask");

    await page.waitForSelector('[data-testname="EditTaskModal"]');
    await page.fill('[data-testname="Input-TaskName"]', "Updated task name");
    await page.fill('[data-testname="Input-TaskStartDate"]', "2022-04-06");
    await page.fill('[data-testname="Input-TaskStopDate"]', "2022-04-10");
    await page.check('[data-testname="Input-TaskOngoing"]');
    await clickButton(page, "Button-TaskSaveButton");

    expect(await page.locator("canvas").screenshot()).toMatchSnapshot(
      "edit-task-update-one.png"
    );

    await openContextMenu(page, "Updated task name");
    await page.waitForSelector('[data-testname="ContextMenu-EditTask"]');
    await clickButton(page, "ContextMenu-EditTask");

    await page.waitForSelector('[data-testname="EditTaskModal"]');
    await page.fill('[data-testname="Input-TaskName"]', "Another name");
    await page.uncheck('[data-testname="Input-TaskOngoing"]');
    await clickButton(page, "Button-TaskSaveButton");

    expect(await page.locator("canvas").screenshot()).toMatchSnapshot(
      "edit-task-update-two.png"
    );
  });

  test("should discard pending changes", async ({ context, page }) => {
    expect(await page.locator("canvas").screenshot()).toMatchSnapshot(
      "edit-task-cancel.png"
    );

    await openContextMenu(page, "Task Two");
    await page.waitForSelector('[data-testname="ContextMenu-EditTask"]');
    await clickButton(page, "ContextMenu-EditTask");

    await page.waitForSelector('[data-testname="EditTaskModal"]');
    await page.fill('[data-testname="Input-TaskName"]', "Updated task name");
    await clickButton(page, "Button-TaskCancelButton");

    expect(await page.locator("canvas").screenshot()).toMatchSnapshot(
      "edit-task-cancel.png"
    );
  });

  test("should support adding and removing dependencies", async ({
    context,
    page,
  }) => {
    expect(await page.locator("canvas").screenshot()).toMatchSnapshot(
      "edit-task-dependency-before.png"
    );

    await openContextMenu(page, "Task Two");
    await page.waitForSelector('[data-testname="ContextMenu-EditTask"]');
    await clickButton(page, "ContextMenu-EditTask");

    await page.waitForSelector('[data-testname="EditTaskModal"]');
    await page.selectOption(
      '[data-testname="Select-TaskDependency"]',
      `${TASKS[0].id}`
    );
    await clickButton(page, "Button-TaskSaveButton");

    expect(await page.locator("canvas").screenshot()).toMatchSnapshot(
      "edit-task-dependency-after.png"
    );

    await openContextMenu(page, "Task Two");
    await page.waitForSelector('[data-testname="ContextMenu-EditTask"]');
    await clickButton(page, "ContextMenu-EditTask");

    await page.waitForSelector('[data-testname="EditTaskModal"]');
    await page.selectOption('[data-testname="Select-TaskDependency"]', "");
    await clickButton(page, "Button-TaskSaveButton");

    expect(await page.locator("canvas").screenshot()).toMatchSnapshot(
      "edit-task-dependency-before.png"
    );
  });

  test("should support adding and removing owners", async ({
    context,
    page,
  }) => {
    expect(await page.locator("canvas").screenshot()).toMatchSnapshot(
      "edit-task-owners-before.png"
    );

    await openContextMenu(page, "Task Two");
    await page.waitForSelector('[data-testname="ContextMenu-EditTask"]');
    await clickButton(page, "ContextMenu-EditTask");

    await page.waitForSelector('[data-testname="EditTaskModal"]');
    await page.selectOption('[data-testname="Select-PendingOwner"]', "team");
    await clickButton(page, "Button-AddPendingOwner");
    await page.fill('[data-testname="Input-PendingOwner"]', "mary");
    await clickButton(page, "Button-AddPendingOwner");
    await clickButton(page, "Button-TaskSaveButton");

    expect(await page.locator("canvas").screenshot()).toMatchSnapshot(
      "edit-task-owners-after.png"
    );

    await openContextMenu(page, "Task Two");
    await page.waitForSelector('[data-testname="ContextMenu-EditTask"]');
    await clickButton(page, "ContextMenu-EditTask");

    await page.waitForSelector('[data-testname="EditTaskModal"]');
    await clickButton(page, "Button-RemoveOwner-mary");
    await clickButton(page, "Button-RemoveOwner-team");
    await clickButton(page, "Button-RemoveOwner-bvaughn");
    await clickButton(page, "Button-TaskSaveButton");

    expect(await page.locator("canvas").screenshot()).toMatchSnapshot(
      "edit-task-no-owners.png"
    );

    await openContextMenu(page, "Task Two");
    await page.waitForSelector('[data-testname="ContextMenu-EditTask"]');
    await clickButton(page, "ContextMenu-EditTask");

    await page.waitForSelector('[data-testname="EditTaskModal"]');
    await page.selectOption('[data-testname="Select-PendingOwner"]', "bvaughn");
    await clickButton(page, "Button-AddPendingOwner");
    await clickButton(page, "Button-TaskSaveButton");

    expect(await page.locator("canvas").screenshot()).toMatchSnapshot(
      "edit-task-owners-before.png"
    );
  });

  test("should switch between pending owner select and input", async ({
    context,
    page,
  }) => {
    await openContextMenu(page, "Task Two");
    await page.waitForSelector('[data-testname="ContextMenu-EditTask"]');
    await clickButton(page, "ContextMenu-EditTask");

    await page.waitForSelector('[data-testname="EditTaskModal"]');

    // Select an owner from the drop down
    await page.selectOption('[data-testname="Select-PendingOwner"]', "team");
    expect(
      await page.locator('[data-testname="EditTaskModal"]').screenshot()
    ).toMatchSnapshot("edit-task-pending-owner-select.png");

    // Fill in the owner and verify select cleared
    await page.fill('[data-testname="Input-PendingOwner"]', "mary");
    expect(
      await page.locator('[data-testname="EditTaskModal"]').screenshot()
    ).toMatchSnapshot("edit-task-pending-owner-input.png");

    // Clear the owner and verify button disabled
    await page.fill('[data-testname="Input-PendingOwner"]', "");
    expect(
      await page.locator('[data-testname="EditTaskModal"]').screenshot()
    ).toMatchSnapshot("edit-task-no-pending-owner.png");
  });

  // TODO Add tests for validation UI
});
