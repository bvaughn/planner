const { test, expect } = require("@playwright/test");
const {
  getTestNameInnerText,
  loadData,
  setEditorText,
} = require("./page-utils");

const tasks = [
  {
    id: "base",
    start: "2022-01-01",
    name: "A",
    owner: "one",
    stop: "2022-03-14",
  },
  {
    id: 7,
    start: "2022-01-01",
    name: "B",
    owner: "three",
    stop: "2022-01-31",
  },
  {
    id: 5,
    start: "2022-01-01",
    name: "C",
    owner: "two",
    stop: "2022-01-31",
  },
  {
    id: 3,
    start: "2022-02-01",
    name: "D",
    owner: "two",
    stop: "2022-02-28",
  },
  {
    id: 2,
    start: "2022-03-15",
    name: "E",
    owner: "one",
    stop: "2022-07-14",
  },
  {
    id: 6,
    start: "2022-04-01",
    name: "F",
    owner: "two",
    stop: "2022-04-30",
  },
  {
    id: 8,
    start: "2022-05-01",
    name: "G",
    owner: "two",
    stop: "2022-05-31",
  },
  {
    id: 4,
    start: "2022-06-01",
    name: "H",
    owner: "two",
    stop: "2022-06-30",
  },
  {
    id: 0,
    start: "2022-03-01",
    name: "A:1",
    owner: "two",
    dependency: "base",
    stop: "2022-03-31",
  },
  {
    id: 1,
    start: "2022-03-15",
    name: "A:2",
    owner: "one",
    isOngoing: true,
    dependency: "base",
    stop: "2022-04-30",
  },
  {
    id: 9,
    start: "2022-01-01",
    name: "I",
    owner: "team",
    isOngoing: true,
    stop: "2022-06-30",
  },
  {
    id: 10,
    start: "2022-01-01",
    name: "J",
    owner: "team",
    isOngoing: true,
    stop: "2022-06-30",
  },
];

const team = {};

test.describe("Dependencies", () => {
  test.beforeEach(async ({ page }) => {
    await loadData(page, { tasks, team });
  });

  test("should be sorted and aligned correctly", async ({ page }) => {
    expect(await page.locator("canvas").screenshot()).toMatchSnapshot(
      "canvas-screenshot-1.png"
    );
  });
});
