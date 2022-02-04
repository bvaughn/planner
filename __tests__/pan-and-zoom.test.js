const { test, expect } = require("@playwright/test");
const {
  getTestNameInnerText,
  loadData,
  setEditorText,
} = require("./page-utils");

const MAX_HEIGHT = 100;
const NUM_HOURS = 24;
const COLUMN_COUNTS = [24, 12, 8, 6, 4, 2, 1];
const ZOOM_DELTA = 250;
const HORIZONTAL_PANL_DELTA = 250;
const VERTICAL_PANL_DELTA = 25;

// Build up a grid of tasks so that the zoom and pan tests will be more meaningful/precise.
const tasks = [];
for (let rowIndex = 0; rowIndex < COLUMN_COUNTS.length; rowIndex++) {
  const columnCount = COLUMN_COUNTS[rowIndex];
  const columnSize = NUM_HOURS / columnCount;

  for (let columnIndex = 0; columnIndex < columnCount; columnIndex++) {
    const hourStart = columnIndex * columnSize;
    const hourStop = hourStart + columnSize - 1;

    tasks.push({
      name: `Column ${columnIndex + 1} of ${columnCount}`,
      start: `2022-01-01 ${hourStart.toFixed(0).padStart(2, "0")}:00`,
      stop: `2022-01-01 ${hourStop.toFixed(0).padStart(2, "0")}:59`,
      owner: (rowIndex + columnIndex) % 2 === 0 ? "one" : "two",
    });
  }
}

const team = {
  one: {
    color: "#543e5b",
  },
  two: {
    color: "#22223B",
  },
};

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

async function getScrollState(page) {
  return await page.evaluate(() => window.__PLANNER_TEST_ONLY_SCROLL_STATE);
}

async function zoomBy(page, deltaY, x = 0) {
  await dispatchWheelEvent(page, {
    x,
    deltaX: 0,
    deltaY,
  });
}

async function panBy(page, deltaX, deltaY) {
  await dispatchWheelEvent(page, {
    deltaX,
    deltaY,
    shiftKey: Math.abs(deltaY) > Math.abs(deltaX),
  });
}

// Pass into page scope and eval to access dispatchMouseEvent() function.
const dispatchEventCodeString = `(${dispatchMouseEvent.toString()})`;

test.describe("Pan and zoom", () => {
  test("should pan (scroll) vertically", async ({ page }) => {
    await loadData(page, { tasks, team }, MAX_HEIGHT);

    let snapshotIndex = 0;

    expect(await page.locator("canvas").screenshot()).toMatchSnapshot([
      "vertical-pan",
      `${snapshotIndex++}.png`,
    ]);

    let prevOffsetY = 0;
    while (true) {
      await panBy(page, 0, VERTICAL_PANL_DELTA);

      const scrollState = await getScrollState(page);

      if (prevOffsetY !== scrollState.offsetY) {
        expect(await page.locator("canvas").screenshot()).toMatchSnapshot([
          "vertical-pan",
          `${snapshotIndex++}-down.png`,
        ]);

        prevOffsetY = scrollState.offsetY;
      } else {
        break;
      }
    }

    while (true) {
      await panBy(page, 0, 0 - VERTICAL_PANL_DELTA);

      const scrollState = await getScrollState(page);

      if (prevOffsetY !== scrollState.offsetY) {
        expect(await page.locator("canvas").screenshot()).toMatchSnapshot([
          "vertical-pan",
          `${snapshotIndex++}-up.png`,
        ]);

        prevOffsetY = scrollState.offsetY;
      } else {
        break;
      }
    }
  });

  test("should pan (scroll) horizontally", async ({ page }) => {
    await loadData(page, { tasks, team });

    let snapshotIndex = 0;

    // Begin by zooming in so we can pan
    await zoomBy(page, 0 - ZOOM_DELTA);

    expect(await page.locator("canvas").screenshot()).toMatchSnapshot([
      "horizontal-pan",
      `${snapshotIndex++}.png`,
    ]);

    let prevOffsetX = 0;
    while (true) {
      await panBy(page, HORIZONTAL_PANL_DELTA, 0);

      const scrollState = await getScrollState(page);

      if (prevOffsetX !== scrollState.offsetX) {
        expect(await page.locator("canvas").screenshot()).toMatchSnapshot([
          "horizontal-pan",
          `${snapshotIndex++}-right.png`,
        ]);

        prevOffsetX = scrollState.offsetX;
      } else {
        break;
      }
    }

    while (true) {
      await panBy(page, 0 - HORIZONTAL_PANL_DELTA, 0);

      const scrollState = await getScrollState(page);

      if (prevOffsetX !== scrollState.offsetX) {
        expect(await page.locator("canvas").screenshot()).toMatchSnapshot([
          "horizontal-pan",
          `${snapshotIndex++}-left.png`,
        ]);

        prevOffsetX = scrollState.offsetX;
      } else {
        break;
      }
    }
  });

  test("should zoom horizontally (centered around cursor location)", async ({
    page,
  }) => {
    await loadData(page, { tasks, team });

    const rect = await page.evaluate(() => {
      const canvas = document.querySelector("canvas");
      const rect = canvas.getBoundingClientRect();
      return { x: rect.x, width: rect.width };
    });

    const horizontalCoordinates = [
      rect.x + 0,
      rect.x + rect.width / 2,
      rect.x + rect.width,
    ];

    for (let i = 0; i < horizontalCoordinates.length; i++) {
      const x = horizontalCoordinates[i];

      let snapshotIndex = 0;

      expect(await page.locator("canvas").screenshot()).toMatchSnapshot([
        "zoom",
        `at-position-${x}`,
        `${snapshotIndex++}.png`,
      ]);

      let prevScaleX = 0;
      while (true) {
        await zoomBy(page, 0 - ZOOM_DELTA, x);

        const scrollState = await getScrollState(page);

        if (prevScaleX !== scrollState.scaleX) {
          expect(await page.locator("canvas").screenshot()).toMatchSnapshot([
            "zoom",
            `at-position-${x}`,
            `${snapshotIndex++}-in.png`,
          ]);

          prevScaleX = scrollState.scaleX;
        } else {
          break;
        }
      }

      while (true) {
        await zoomBy(page, ZOOM_DELTA, x);

        const scrollState = await getScrollState(page);

        if (prevScaleX !== scrollState.scaleX) {
          expect(await page.locator("canvas").screenshot()).toMatchSnapshot([
            "zoom",
            `at-position-${x}`,
            `${snapshotIndex++}-out.png`,
          ]);

          prevScaleX = scrollState.scaleX;
        } else {
          break;
        }
      }
    }
  });
});
