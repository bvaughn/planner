const { test, expect } = require("@playwright/test");
const {
  getTestNameInnerText,
  loadData,
  setEditorText,
} = require("./page-utils");

test.describe("Colors", () => {
  test("should respect color overrides per task and per owner", async ({
    page,
  }) => {
    await loadData(page, {
      tasks: [
        {
          start: "2022-01-01",
          stop: "2022-01-02",
          name: "Item one",
          owner: "bvaughn",
        },
        {
          start: "2022-01-02",
          stop: "2022-01-03",
          name: "Item two",
          owner: "bvaughn",
        },
      ],
      team: {
        bvaughn: {
          name: "Brian",
        },
      },
    });

    expect(await page.locator("canvas").screenshot()).toMatchSnapshot(
      "canvas-screenshot-default-colors.png"
    );

    await loadData(page, {
      tasks: [
        {
          start: "2022-01-01",
          stop: "2022-01-02",
          name: "Item one",
          owner: "bvaughn",
        },
        {
          start: "2022-01-02",
          stop: "2022-01-03",
          name: "Item two",
          owner: "bvaughn",
        },
      ],
      team: {
        bvaughn: {
          name: "Brian",
          color: "#ff0000",
        },
      },
    });

    expect(await page.locator("canvas").screenshot()).toMatchSnapshot(
      "canvas-screenshot-ower-colors.png"
    );

    await loadData(page, {
      tasks: [
        {
          start: "2022-01-01",
          stop: "2022-01-02",
          name: "Item one",
          owner: "bvaughn",
          color: "#00ff00",
        },
        {
          start: "2022-01-02",
          stop: "2022-01-03",
          name: "Item two",
          owner: "bvaughn",
          color: "#0000ff",
        },
      ],
      team: {
        bvaughn: {
          name: "Brian",
          color: "#ff0000",
        },
      },
    });

    expect(await page.locator("canvas").screenshot()).toMatchSnapshot(
      "canvas-screenshot-task-colors.png"
    );
  });

  test("should select a high-contrast foreground color", async ({ page }) => {
    await loadData(page, {
      tasks: [
        {
          start: "2022-01-01",
          stop: "2022-01-02",
          name: "Item one",
          color: "#000",
        },
        {
          start: "2022-01-02",
          stop: "2022-01-03",
          name: "Item two",
          color: "#333",
        },
        {
          start: "2022-01-03",
          stop: "2022-01-04",
          name: "Item three",
          color: "#666",
        },
        {
          start: "2022-01-04",
          stop: "2022-01-05",
          name: "Item four",
          color: "#999",
        },
        {
          start: "2022-01-05",
          stop: "2022-01-06",
          name: "Item five",
          color: "#ccc",
        },
        {
          start: "2022-01-06",
          stop: "2022-01-07",
          name: "Item six",
          color: "#fff",
        },
      ],
      team: {},
    });

    expect(await page.locator("canvas").screenshot()).toMatchSnapshot(
      "canvas-screenshot-high-contrast-foreground-color.png"
    );
  });

  test("should draw different patterns for ongoing tasks with different colors", async ({
    page,
  }) => {
    await loadData(page, {
      tasks: [
        {
          start: "2022-01-01",
          stop: "2022-01-02",
          name: "Item one",
          isOngoing: true,
          color: "#a00",
        },
        {
          start: "2022-01-02",
          stop: "2022-01-03",
          name: "Item two",
          isOngoing: true,
          color: "#00a",
        },
      ],
      team: {},
    });

    expect(await page.locator("canvas").screenshot()).toMatchSnapshot(
      "canvas-screenshot-ongoing-pattern-colors.png"
    );
  });

  test("should support different incoming color formats", async ({ page }) => {
    await loadData(page, {
      tasks: [
        {
          start: "2022-01-01",
          stop: "2022-01-02",
          name: "hex string",
          color: "#0033FF",
        },
        {
          start: "2022-01-02",
          stop: "2022-01-03",
          name: "short hex string",
          color: "#a00",
        },
        {
          start: "2022-01-03",
          stop: "2022-01-04",
          name: "rgb string",
          color: "rgb(255,125, 50)",
        },
        {
          start: "2022-01-04",
          stop: "2022-01-05",
          name: "rgba string",
          color: "rgba(100, 0,50,0.5)",
        },
        {
          start: "2022-01-05",
          stop: "2022-01-06",
          name: "keyword",
          color: "yellow",
        },
        {
          start: "2022-01-06",
          stop: "2022-01-07",
          name: "invalid color string",
          color: "asdf",
        },
      ],
      team: {},
    });

    expect(await page.locator("canvas").screenshot()).toMatchSnapshot(
      "canvas-screenshot-color-formats.png"
    );
  });
});
