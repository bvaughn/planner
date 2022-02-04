const { test, expect } = require("@playwright/test");
const {
  getTestNameInnerText,
  loadData,
  setEditorText,
} = require("./page-utils");

const MAX_HEIGHT = 100;

const tasks = [
  {
    name: "Row 1",
    start: "2022-01-01",
    stop: "2022-01-01",
  },
  {
    name: "Row 2",
    start: "2022-01-01",
    stop: "2022-01-02",
  },
  {
    name: "Row 3",
    start: "2022-01-01",
    stop: "2022-01-03",
  },
  {
    name: "Row 4",
    start: "2022-01-01",
    stop: "2022-01-04",
  },
  {
    name: "Row 5",
    start: "2022-01-01",
    stop: "2022-01-05",
  },
];

const team = {};

function dispatchMouseEvent(element, type, eventProperties) {
  const event = new CustomEvent(type);

  for (let key in eventProperties) {
    event[key] = eventProperties[key];
  }

  window.event = event;

  element.dispatchEvent(event);

  window.event = undefined;
}

async function dispatchWheelEvent(page, eventProperties) {
  await page.evaluate(
    ({ code, eventProperties }) => {
      const canvas = document.querySelector("canvas");

      const fn = eval(code);
      fn(canvas, "wheel", eventProperties);
    },
    {
      code: dispatchEventCodeString,
      eventProperties,
    }
  );
}

// Pass into page scope and eval to access dispatchMouseEvent() function.
const dispatchEventCodeString = `(${dispatchMouseEvent.toString()})`;

test.describe("Pan and zoom", () => {
  test.beforeEach(async ({ page }) => {
    await loadData(page, { tasks, team }, MAX_HEIGHT);
  });

  test("should pan (scroll) vertically", async ({ page }) => {
    expect(await page.locator("canvas").screenshot()).toMatchSnapshot(
      "default.png"
    );

    await dispatchWheelEvent(page, {
      x: 10, // Not relevant for vertical scrolls
      deltaX: 25, // Smaller axis delta should be ignored
      deltaY: 50,
      shiftKey: true,
    });
    expect(await page.locator("canvas").screenshot()).toMatchSnapshot(
      "pan-down.png"
    );

    await dispatchWheelEvent(page, {
      x: 10, // Not relevant for vertical scrolls
      deltaX: 25, // Smaller axis delta should be ignored
      deltaY: 500,
      shiftKey: true,
    });
    expect(await page.locator("canvas").screenshot()).toMatchSnapshot(
      "pan-down-max.png"
    );

    await dispatchWheelEvent(page, {
      x: 10, // Not relevant for vertical scrolls
      deltaX: 25, // Smaller axis delta should be ignored
      deltaY: -50,
      shiftKey: true,
    });
    expect(await page.locator("canvas").screenshot()).toMatchSnapshot(
      "pan-up.png"
    );

    await dispatchWheelEvent(page, {
      x: 10, // Not relevant for vertical scrolls
      deltaX: 25, // Smaller axis delta should be ignored
      deltaY: -500,
      shiftKey: true,
    });
    expect(await page.locator("canvas").screenshot()).toMatchSnapshot(
      "pan-up-max.png"
    );
  });

  test("should pan (scroll) horizontally", async ({ page }) => {
    expect(await page.locator("canvas").screenshot()).toMatchSnapshot(
      "default.png"
    );

    // Zoom in so we can pan
    await dispatchWheelEvent(page, {
      x: 0,
      deltaX: -25, // Smaller axis delta should be ignored
      deltaY: -100,
    });
    expect(await page.locator("canvas").screenshot()).toMatchSnapshot(
      "zoom-in.png"
    );

    await dispatchWheelEvent(page, {
      x: 0,
      deltaX: 100,
      deltaY: 10, // Smaller axis delta should be ignored
    });
    expect(await page.locator("canvas").screenshot()).toMatchSnapshot(
      "pan-right.png"
    );

    await dispatchWheelEvent(page, {
      x: 0,
      deltaX: 1000,
      deltaY: 10, // Smaller axis delta should be ignored
    });
    expect(await page.locator("canvas").screenshot()).toMatchSnapshot(
      "pan-right-max.png"
    );

    await dispatchWheelEvent(page, {
      x: 0,
      deltaX: -100,
      deltaY: 10, // Smaller axis delta should be ignored
    });
    expect(await page.locator("canvas").screenshot()).toMatchSnapshot(
      "pan-left.png"
    );

    await dispatchWheelEvent(page, {
      x: 0,
      deltaX: -1000,
      deltaY: 10, // Smaller axis delta should be ignored
    });
    expect(await page.locator("canvas").screenshot()).toMatchSnapshot(
      "pan-left-max.png"
    );
  });

  test("should zoom horizontally (centered around cursor location)", async ({
    page,
  }) => {
    expect(await page.locator("canvas").screenshot()).toMatchSnapshot(
      "default.png"
    );

    await dispatchWheelEvent(page, {
      x: 0,
      deltaX: -25, // Smaller axis delta should be ignored
      deltaY: -100,
    });
    expect(await page.locator("canvas").screenshot()).toMatchSnapshot(
      "zoom-in.png"
    );

    await dispatchWheelEvent(page, {
      x: 0,
      deltaX: -25, // Smaller axis delta should be ignored
      deltaY: -1000,
    });
    expect(await page.locator("canvas").screenshot()).toMatchSnapshot(
      "zoom-in-max.png"
    );

    await dispatchWheelEvent(page, {
      x: 0,
      deltaX: -25, // Smaller axis delta should be ignored
      deltaY: 100,
    });
    expect(await page.locator("canvas").screenshot()).toMatchSnapshot(
      "zoom-out.png"
    );

    await dispatchWheelEvent(page, {
      x: 0,
      deltaX: -25, // Smaller axis delta should be ignored
      deltaY: 1000,
    });
    expect(await page.locator("canvas").screenshot()).toMatchSnapshot(
      "zoom-out-max.png"
    );

    // TODO Text offset clamping
  });
});
