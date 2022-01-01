import { useLayoutEffect, useMemo, useRef, useState } from "react";
import Tooltip from "./Tooltip";
import {
  drawTextToFitWidth,
  drawTextToCenterWithin,
  drawRoundedRect,
  drawAvatarCircle,
} from "./utils/canvas";
import { getColorForString, getContrastRatio } from "./utils/color";
import { getOwnerName } from "./utils/task";

import {
  ARROW_SIZE,
  AVATAR_SIZE,
  BLACK,
  BLACK_TRANSPARENT,
  CORNER_RADIUS,
  DARK_GRAY,
  HEADER_HEIGHT,
  LIGHT_GRAY,
  LINE_SEGMENT_MIN_LENGTH,
  LINE_WIDTH,
  MARGIN,
  MONTHS,
  SLATE_GRAY,
  TASK_BAR_HEIGHT,
  TASK_ROW_HEIGHT,
  TOOLTIP_OFFSET,
  WHITE,
} from "./config";

const DEFAULT_TOOLTIP_STATE = {
  label: null,
  left: null,
  right: null,
  top: null,
};

export default function CanvasChart({
  team,
  ownerToImageMap,
  preloadCounter,
  tasks,
  width,
}) {
  const canvasRef = useRef();

  const [tooltipState, setTooltipState] = useState(DEFAULT_TOOLTIP_STATE);

  // eslint-disable-next-line  react-hooks/exhaustive-deps
  const textDOMRects = useMemo(() => new Map(), [tasks, width]);

  const [taskToRowIndexMap, maxRowIndex] = useMemo(() => {
    const map = new Map();
    const rows = [];

    // Pre-sort dependencies to always follow parent tasks,
    // and oder them by (start) month index (lowest to highest).
    for (let taskIndex = 0; taskIndex < tasks.length; taskIndex++) {
      const task = tasks[taskIndex];
      if (task.dependency != null) {
        let currentIndex = taskIndex - 1;
        while (currentIndex >= 0) {
          const currentTask = tasks[currentIndex];
          let move = false;
          if (currentTask.id === task.dependency) {
            move = true;
          } else if (currentTask.dependency === task.dependency) {
            if (task.start > currentTask.start) {
              move = true;
            } else if (task.start === currentTask.start) {
              if (task.duration < currentTask.duration) {
                move = true;
              } else if (!task.isOngoing && currentTask.isOngoing) {
                move = true;
              }
            }
          }

          if (move) {
            tasks.splice(taskIndex, 1);
            tasks.splice(currentIndex + 1, 0, task);
            break;
          } else {
            currentIndex--;
          }
        }
      }
    }

    tasks.forEach((task) => {
      let nextAvailableRowIndex = -1;
      if (task.dependency == null) {
        nextAvailableRowIndex = rows.findIndex((rowTasks, rowIndex) => {
          let match = true;
          for (
            let rowTaskIndex = 0;
            rowTaskIndex < rowTasks.length;
            rowTaskIndex++
          ) {
            const rowTask = rowTasks[rowTaskIndex];
            if (rowTask.isOngoing) {
              match = false;
              break;
            }
            if (rowTask.dependency != null) {
              match = false;
              break;
            }
            if (
              !(
                task.start + task.duration <= rowTask.start ||
                task.start >= rowTask.start + rowTask.duration
              )
            ) {
              match = false;
              break;
            }
          }
          return match;
        });
      }

      const rowIndex =
        nextAvailableRowIndex >= 0 ? nextAvailableRowIndex : rows.length;
      if (rows[rowIndex] == null) {
        rows[rowIndex] = [task];
      } else {
        rows[rowIndex].push(task);
      }

      map.set(task, rowIndex);
    });

    return [map, rows.length];
  }, [tasks]);

  const monthWidth = width / MONTHS.length;

  const height = HEADER_HEIGHT + maxRowIndex * TASK_ROW_HEIGHT;

  useLayoutEffect(() => {
    const canvas = canvasRef.current;

    const scale = window.devicePixelRatio;
    canvas.width = Math.floor(width * scale);
    canvas.height = Math.floor(height * scale);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const context = canvas.getContext("2d");
    context.scale(scale, scale);
    context.clearRect(0, 0, width, height);

    // Draw background grid first.
    // This marks off months and weeks.
    drawUnitGrid(context, width, height);

    // Render header text for month columns.
    drawUnitHeaders(context, width);

    const dependenciesMap = new Map();
    const taskMap = new Map();

    for (let taskIndex = 0; taskIndex < tasks.length; taskIndex++) {
      const task = tasks[taskIndex];
      const rowIndex = taskToRowIndexMap.get(task);

      drawTaskRow(
        context,
        task,
        team,
        rowIndex,
        width,
        ownerToImageMap,
        textDOMRects
      );

      // Collect dependencies for later.
      taskMap.set(task.id, task);
      if (task.dependency != null) {
        const dependencyId = task.dependency;
        const dependency = taskMap.get(dependencyId);

        if (dependency == null) {
          console.warn(
            `Invalid dependenc; no parent task found with id ${dependencyId}`
          );
        } else {
          if (!dependenciesMap.has(dependency)) {
            dependenciesMap.set(dependency, []);
          }
          dependenciesMap.get(dependency).push(taskMap.get(task.id));
        }
      }
    }

    // Draw arrows between dependencies.
    dependenciesMap.forEach((dependentTasks, parentTask) => {
      drawDependencyConnections(
        context,
        dependentTasks,
        parentTask,
        width,
        taskToRowIndexMap
      );
    });
  }, [
    height,
    monthWidth,
    team,
    ownerToImageMap,
    preloadCounter,
    taskToRowIndexMap,
    tasks,
    textDOMRects,
    width,
  ]);

  const handleMouseMove = (event) => {
    const { offsetX, offsetY } = event.nativeEvent;

    for (let [text, rect] of textDOMRects) {
      if (
        offsetX >= rect.x &&
        offsetX <= rect.x + rect.width &&
        offsetY >= rect.y &&
        offsetY <= rect.y + rect.height
      ) {
        if (offsetX <= width / 2) {
          setTooltipState({
            left: offsetX + TOOLTIP_OFFSET,
            right: null,
            text,
            top: offsetY + TOOLTIP_OFFSET,
          });
        } else {
          setTooltipState({
            left: null,
            right: width - offsetX + TOOLTIP_OFFSET,
            text,
            top: offsetY + TOOLTIP_OFFSET,
          });
        }
        return;
      }
    }

    setTooltipState(DEFAULT_TOOLTIP_STATE);
  };

  return (
    <>
      <canvas
        ref={canvasRef}
        height={height}
        onMouseMove={handleMouseMove}
        width={width}
      />
      <Tooltip {...tooltipState} />
    </>
  );
}

function getUnitWidth(chartWidth) {
  return Math.floor(chartWidth / MONTHS.length);
}

function getTaskRect(task, rowIndex, chartWidth) {
  const unitWidth = getUnitWidth(chartWidth);

  const x = task.start * unitWidth;
  const y = HEADER_HEIGHT + MARGIN + rowIndex * TASK_ROW_HEIGHT;
  const width = task.isOngoing
    ? chartWidth - x - MARGIN
    : task.duration * unitWidth - MARGIN;
  const height = TASK_ROW_HEIGHT;

  return new DOMRect(x, y, width, height);
}

function getBarRect(taskRect) {
  return new DOMRect(
    taskRect.x,
    taskRect.y + taskRect.height - TASK_BAR_HEIGHT - MARGIN,
    taskRect.width,
    TASK_BAR_HEIGHT
  );
}

function getAvatarRect(taskRect) {
  return new DOMRect(taskRect.x, taskRect.y + MARGIN, AVATAR_SIZE, AVATAR_SIZE);
}

function getTextRect(taskRect) {
  const width = taskRect.width - AVATAR_SIZE - MARGIN;
  const height = AVATAR_SIZE;
  const x = taskRect.x + AVATAR_SIZE + MARGIN;
  const y = taskRect.y + MARGIN;

  return new DOMRect(x, y, width, height);
}

function drawOwnerAvatar(context, taskRect, ownerName, color, avatar) {
  const avatarRect = getAvatarRect(taskRect);

  if (avatar?.image) {
    drawAvatarCircle(context, avatar, avatarRect.x, avatarRect.y, AVATAR_SIZE);
  } else {
    const character = ownerName.charAt(0).toUpperCase();

    drawRoundedRect(
      context,
      avatarRect.x,
      avatarRect.y,
      avatarRect.width,
      avatarRect.height,
      AVATAR_SIZE / 2
    );
    context.fillStyle = color;
    context.fill();

    context.font = "bold 15px sans-serif";
    context.fillStyle =
      getContrastRatio(color, WHITE) > getContrastRatio(color, BLACK)
        ? WHITE
        : BLACK;
    drawTextToCenterWithin(
      context,
      character,
      avatarRect.x,
      avatarRect.y,
      avatarRect.width,
      avatarRect.height
    );
  }
}

function drawTaskText(context, task, taskRect, textDOMRects) {
  const textRect = getTextRect(taskRect);

  context.font = "11px sans-serif";
  context.fillStyle = DARK_GRAY;

  const measuredTextWidth = drawTextToFitWidth(
    context,
    task.name,
    textRect.x,
    textRect.y,
    textRect.width,
    textRect.height
  );

  if (measuredTextWidth !== null) {
    textDOMRects.set(
      task.name,
      new DOMRect(textRect.x, textRect.y, measuredTextWidth, textRect.height)
    );
  }
}

function drawTaskBar(context, task, rowIndex, color, chartWidth) {
  const taskRect = getTaskRect(task, rowIndex, chartWidth);
  const barRect = getBarRect(taskRect);

  if (task.isOngoing) {
    drawRoundedRect(
      context,
      barRect.x,
      barRect.y,
      barRect.width,
      barRect.height,
      CORNER_RADIUS
    );
    context.fillStyle = BLACK_TRANSPARENT;
    context.fill();

    const unitWidth = getUnitWidth(chartWidth);
    const chunkWidth =
      (task.duration * unitWidth) / (MONTHS.length - task.start);

    for (
      let chunkIndex = task.start;
      chunkIndex < MONTHS.length;
      chunkIndex++
    ) {
      const chunkX = chunkIndex * unitWidth;

      drawRoundedRect(
        context,
        chunkX,
        barRect.y,
        Math.min(chunkWidth, chartWidth - chunkX),
        barRect.height,
        CORNER_RADIUS
      );
      context.fillStyle = color;
      context.fill();
    }
  } else {
    drawRoundedRect(
      context,
      barRect.x,
      barRect.y,
      barRect.width,
      barRect.height,
      CORNER_RADIUS
    );
    context.fillStyle = color;
    context.fill();
  }
}

function drawTaskRow(
  context,
  task,
  team,
  rowIndex,
  chartWidth,
  ownerToImageMap,
  textDOMRects
) {
  const ownerName = getOwnerName(task, team);
  const color = getColorForString(ownerName);

  const taskRect = getTaskRect(task, rowIndex, chartWidth);
  const barRect = getBarRect(taskRect);

  const owner = team[task.owner];
  const avatar = ownerToImageMap.get(owner);

  drawOwnerAvatar(context, taskRect, ownerName, color, avatar);
  drawTaskText(context, task, taskRect, textDOMRects);
  drawTaskBar(context, task, rowIndex, color, chartWidth);
}

function drawUnitGrid(context, chartWidth, chartHeight) {
  const unitWidth = getUnitWidth(chartWidth);

  // Draw background grid first.
  // This marks off months and weeks.
  for (let index = 0; index < 6; index++) {
    // For simplification purposes, we pretend a month has 4 weeks.
    for (let weekIndex = 0; weekIndex < 4; weekIndex++) {
      const x = index * unitWidth + weekIndex * 0.25 * unitWidth;
      const y = HEADER_HEIGHT + MARGIN;

      context.beginPath();
      context.strokeStyle = LIGHT_GRAY;
      context.lineWidth = LINE_WIDTH;
      context.moveTo(x, y);
      context.lineTo(x, chartHeight);
      context.stroke();
    }
  }
}

function drawUnitHeaders(context, chartWidth) {
  const unitWidth = getUnitWidth(chartWidth);

  // Render header text for month columns.
  for (let index = 0; index < 6; index++) {
    const text = MONTHS[index];

    const x = index * unitWidth;
    const y = MARGIN;
    const width = unitWidth;
    const height = HEADER_HEIGHT;

    context.font = "bold 13px sans-serif";
    context.fillStyle = DARK_GRAY;
    drawTextToFitWidth(context, text, x, y, width, height);
  }
}

function drawDependencyConnections(
  context,
  dependentTasks,
  parentTask,
  chartWidth,
  taskToRowIndexMap
) {
  let firstTask = null;
  let lowestTask = null;

  for (let i = 0; i < dependentTasks.length; i++) {
    const dependantTask = dependentTasks[i];

    if (firstTask === null) {
      firstTask = dependantTask;
    } else if (firstTask.start > dependantTask.start) {
      firstTask = dependantTask;
    }

    if (lowestTask === null) {
      lowestTask = dependantTask;
    } else if (
      taskToRowIndexMap.get(lowestTask) < taskToRowIndexMap.get(dependantTask)
    ) {
      lowestTask = dependantTask;
    }
  }

  if (firstTask == null || lowestTask == null) {
    return;
  }

  const firstBarRect = getBarRect(
    getTaskRect(firstTask, taskToRowIndexMap.get(firstTask), chartWidth)
  );
  const lowestBarRect = getBarRect(
    getTaskRect(lowestTask, taskToRowIndexMap.get(lowestTask), chartWidth)
  );
  const parentBarRect = getBarRect(
    getTaskRect(parentTask, taskToRowIndexMap.get(parentTask), chartWidth)
  );

  const x = Math.max(
    parentBarRect.x + MARGIN,
    Math.min(
      firstBarRect.x - LINE_SEGMENT_MIN_LENGTH - MARGIN,
      // Ideal target alignment:
      parentBarRect.x + parentBarRect.width / 2
    )
  );

  const y0 = parentBarRect.y + parentBarRect.height + MARGIN;
  const y1 = lowestBarRect.y + lowestBarRect.height / 2;

  // Draw vertical line from parent task down.
  // This assumes that each sub-task is on its own row.
  // TODO Verify that and draw multiple vertical connecting lines if necessary.
  context.beginPath();
  context.strokeStyle = SLATE_GRAY;
  context.lineWidth = LINE_WIDTH;
  context.moveTo(x, y0);
  context.lineTo(x, y1);
  context.stroke();

  const unitWidth = getUnitWidth(chartWidth);

  // Draw horizontal lines (with arrows) to connect each dependent task.
  for (let i = 0; i < dependentTasks.length; i++) {
    const dependantTask = dependentTasks[i];
    const dependantBarRect = getBarRect(
      getTaskRect(
        dependantTask,
        taskToRowIndexMap.get(dependantTask),
        chartWidth
      )
    );

    const x0 = x;
    const x1 = dependantBarRect.x - MARGIN;
    const y = dependantBarRect.y + dependantBarRect.height / 2;

    context.beginPath();
    context.strokeStyle = SLATE_GRAY;
    context.lineWidth = LINE_WIDTH;
    context.moveTo(x0, y);
    context.lineTo(x1, y);
    context.moveTo(x1, y);
    context.lineTo(x1 - ARROW_SIZE / 3, y - ARROW_SIZE / 3);
    context.moveTo(x1, y);
    context.lineTo(x1 - ARROW_SIZE / 3, y + ARROW_SIZE / 3);
    context.stroke();
  }
}
