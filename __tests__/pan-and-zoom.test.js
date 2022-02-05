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
const HORIZONTAL_PAN_DELTA = 250;
const VERTICAL_PAN_DELTA = 25;

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

function dispatchMouseEvent(element, type, eventProperties, bubbles = true) {
  const event = new CustomEvent(type, { bubbles });

  for (let key in eventProperties) {
    event[key] = eventProperties[key];
  }

  window.event = event;

  element.dispatchEvent(event);

  window.event = undefined;
}

// Pass into page scope and eval to access dispatchMouseEvent() function.
const dispatchEventCodeString = `(${dispatchMouseEvent.toString()})`;

async function dispatchCanvasEvent(page, type, eventProperties) {
  await page.evaluate(
    ({ code, eventProperties, type }) => {
      const canvas = document.querySelector("canvas");

      const fn = eval(code);
      fn(canvas, type, eventProperties);
    },
    {
      code: dispatchEventCodeString,
      eventProperties,
      type,
    }
  );
}

async function getCamera(page) {
  return await page.evaluate(() => window.__PLANNER_TEST_ONLY_CAMERA);
}

async function dragBy(page, x, y) {
  await dispatchCanvasEvent(page, "mousedown");

  await dispatchCanvasEvent(page, "mousemove", {
    movementX: x,
    movementY: y,
  });

  await dispatchCanvasEvent(page, "mouseup");
}

async function panBy(page, x, y) {
  await dispatchCanvasEvent(page, "wheel", {
    deltaX: x,
    deltaY: y,
    shiftKey: Math.abs(y) > Math.abs(x),
  });
}

async function zoomBy(page, deltaY, x = 0) {
  await dispatchCanvasEvent(page, "wheel", {
    x,
    deltaX: 0,
    deltaY,
  });
}

test.describe("Pan and zoom", () => {
  test.describe("wheel", () => {
    test("should pan (scroll) vertically", async ({ page }) => {
      await loadData(page, { tasks, team }, MAX_HEIGHT);

      let snapshotIndex = 0;

      expect(await page.locator("canvas").screenshot()).toMatchSnapshot([
        "vertical-pan",
        `${snapshotIndex++}.png`,
      ]);

      let prevOffsetY = 0;
      while (true) {
        await panBy(page, 0, VERTICAL_PAN_DELTA);

        const camera = await getCamera(page);

        if (prevOffsetY !== camera.y) {
          expect(await page.locator("canvas").screenshot()).toMatchSnapshot([
            "vertical-pan",
            `${snapshotIndex++}-down.png`,
          ]);

          prevOffsetY = camera.y;
        } else {
          break;
        }
      }

      while (true) {
        await panBy(page, 0, 0 - VERTICAL_PAN_DELTA);

        const camera = await getCamera(page);

        if (prevOffsetY !== camera.y) {
          expect(await page.locator("canvas").screenshot()).toMatchSnapshot([
            "vertical-pan",
            `${snapshotIndex++}-up.png`,
          ]);

          prevOffsetY = camera.y;
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
        await panBy(page, HORIZONTAL_PAN_DELTA, 0);

        const camera = await getCamera(page);

        if (prevOffsetX !== camera.x) {
          expect(await page.locator("canvas").screenshot()).toMatchSnapshot([
            "horizontal-pan",
            `${snapshotIndex++}-right.png`,
          ]);

          prevOffsetX = camera.x;
        } else {
          break;
        }
      }

      while (true) {
        await panBy(page, 0 - HORIZONTAL_PAN_DELTA, 0);

        const camera = await getCamera(page);

        if (prevOffsetX !== camera.x) {
          expect(await page.locator("canvas").screenshot()).toMatchSnapshot([
            "horizontal-pan",
            `${snapshotIndex++}-left.png`,
          ]);

          prevOffsetX = camera.x;
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

          const camera = await getCamera(page);

          if (prevScaleX !== camera.z) {
            expect(await page.locator("canvas").screenshot()).toMatchSnapshot([
              "zoom",
              `at-position-${x}`,
              `${snapshotIndex++}-in.png`,
            ]);

            prevScaleX = camera.z;
          } else {
            break;
          }
        }

        while (true) {
          await zoomBy(page, ZOOM_DELTA, x);

          const camera = await getCamera(page);

          if (prevScaleX !== camera.z) {
            expect(await page.locator("canvas").screenshot()).toMatchSnapshot([
              "zoom",
              `at-position-${x}`,
              `${snapshotIndex++}-out.png`,
            ]);

            prevScaleX = camera.z;
          } else {
            break;
          }
        }
      }
    });
  });

  test.describe("click and drag", () => {
    test("should drag (scroll) vertically", async ({ page }) => {
      await loadData(page, { tasks, team }, MAX_HEIGHT);

      let snapshotIndex = 0;

      expect(await page.locator("canvas").screenshot()).toMatchSnapshot([
        "vertical-drag",
        `${snapshotIndex++}.png`,
      ]);

      let prevOffsetY = 0;
      while (true) {
        await dragBy(page, 0, 0 - VERTICAL_PAN_DELTA);

        const camera = await getCamera(page);

        if (prevOffsetY !== camera.y) {
          expect(await page.locator("canvas").screenshot()).toMatchSnapshot([
            "vertical-drag",
            `${snapshotIndex++}-down.png`,
          ]);

          prevOffsetY = camera.y;
        } else {
          break;
        }
      }

      while (true) {
        await dragBy(page, 0, VERTICAL_PAN_DELTA);

        const camera = await getCamera(page);

        if (prevOffsetY !== camera.y) {
          expect(await page.locator("canvas").screenshot()).toMatchSnapshot([
            "vertical-drag",
            `${snapshotIndex++}-up.png`,
          ]);

          prevOffsetY = camera.y;
        } else {
          break;
        }
      }
    });

    test("should drag (scroll) horizontally", async ({ page }) => {
      await loadData(page, { tasks, team });

      let snapshotIndex = 0;

      // Begin by zooming in so we can drag
      await zoomBy(page, 0 - ZOOM_DELTA);

      expect(await page.locator("canvas").screenshot()).toMatchSnapshot([
        "horizontal-drag",
        `${snapshotIndex++}.png`,
      ]);

      let prevOffsetX = 0;
      while (true) {
        await dragBy(page, 0 - HORIZONTAL_PAN_DELTA, 0);

        const camera = await getCamera(page);

        if (prevOffsetX !== camera.x) {
          expect(await page.locator("canvas").screenshot()).toMatchSnapshot([
            "horizontal-drag",
            `${snapshotIndex++}-right.png`,
          ]);

          prevOffsetX = camera.x;
        } else {
          break;
        }
      }

      while (true) {
        await dragBy(page, HORIZONTAL_PAN_DELTA, 0);

        const camera = await getCamera(page);

        if (prevOffsetX !== camera.x) {
          expect(await page.locator("canvas").screenshot()).toMatchSnapshot([
            "horizontal-drag",
            `${snapshotIndex++}-left.png`,
          ]);

          prevOffsetX = camera.x;
        } else {
          break;
        }
      }
    });

    test("should ignore mouse movements when not dragging", async ({
      page,
    }) => {
      await loadData(page, { tasks, team }, MAX_HEIGHT);

      // Begin by zooming in so we can drag
      await zoomBy(page, 0 - ZOOM_DELTA);

      expect(await page.locator("canvas").screenshot()).toMatchSnapshot([
        "not-dragging",
        "default.png",
      ]);

      await dispatchCanvasEvent(page, "mousemove", {
        movementX: HORIZONTAL_PAN_DELTA,
        movementY: 0,
      });

      expect(await page.locator("canvas").screenshot()).toMatchSnapshot([
        "not-dragging",
        "default.png",
      ]);

      await dispatchCanvasEvent(page, "mousemove", {
        movementX: 0,
        movementY: VERTICAL_PAN_DELTA,
      });

      expect(await page.locator("canvas").screenshot()).toMatchSnapshot([
        "not-dragging",
        "default.png",
      ]);
    });
  });
});
