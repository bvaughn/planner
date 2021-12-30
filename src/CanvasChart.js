import { useLayoutEffect, useMemo, useRef, useState } from "react";
import Tooltip from "./Tooltip";

const MONTHS = ["January", "February", "March", "April", "May", "June"];

const MARGIN = 4;
const LINE_WIDTH = 1;
const CORNER_RADIUS = 2;
const AVATAR_SIZE = 24;
const VERTICAL_TEXT_OFFSET = 1;

const HEADER_HEIGHT = 20;
const TASK_BAR_HEIGHT = 8;
const TASK_ROW_HEIGHT =
  MARGIN + AVATAR_SIZE + MARGIN + TASK_BAR_HEIGHT + MARGIN;

const LINE_SEGMENT_MIN_LENGTH = 20;
const ARROW_SIZE = 10;

const TOOLTIP_OFFSET = 15;

const DEFAULT_TOOLTIP_STATE = {
  label: null,
  left: null,
  right: null,
  top: null,
};

export default function CanvasChart({
  colorMap,
  owners,
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
                task.month + task.length <= rowTask.month ||
                task.month >= rowTask.month + rowTask.length
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

  const monthWidth = useMemo(() => {
    return width / MONTHS.length;
  }, [width]);

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
    for (let index = 0; index < 6; index++) {
      // For simplification purposes, we pretend a month has 4 weeks.
      for (let weekIndex = 0; weekIndex < 4; weekIndex++) {
        const x = index * monthWidth + weekIndex * 0.25 * monthWidth;
        const y = HEADER_HEIGHT + MARGIN;

        context.beginPath();
        context.strokeStyle = "#eee";
        context.lineWidth = LINE_WIDTH;
        context.moveTo(x, y);
        context.lineTo(x, height);
        context.stroke();
      }
    }

    // Render header text for month columns.
    for (let index = 0; index < 6; index++) {
      const text = MONTHS[index];

      const x = index * monthWidth;
      const y = MARGIN;
      const width = monthWidth;
      const height = HEADER_HEIGHT;

      context.font = "bold 13px sans-serif";
      context.fillStyle = "#333";
      drawTextToFitWidth(context, text, x, y, width, height);
    }

    const dependenciesMap = new Map();
    const taskMap = new Map();

    for (let taskIndex = 0; taskIndex < tasks.length; taskIndex++) {
      const task = tasks[taskIndex];
      const owner = owners[task.owner];
      const avatar = owner?.avatar || null;

      const ownerName = owner?.name || task.owner || "team";
      const color = colorMap.get(ownerName);

      const rowIndex = taskToRowIndexMap.get(task);

      // Render task rects.
      const taskX = task.month * monthWidth;
      const taskY =
        HEADER_HEIGHT +
        rowIndex * TASK_ROW_HEIGHT +
        TASK_ROW_HEIGHT -
        TASK_BAR_HEIGHT;
      const taskWidth = task.isOngoing
        ? width - taskX - MARGIN
        : task.length * monthWidth - MARGIN;
      const taskHeight = TASK_BAR_HEIGHT;

      drawRoundedRect(
        context,
        taskX,
        taskY,
        taskWidth,
        taskHeight,
        CORNER_RADIUS
      );
      context.fillStyle = task.isOngoing ? "rgba(0,0,0,.05)" : color;
      context.fill();

      if (task.isOngoing) {
        const chunkWidth =
          (task.length * monthWidth) / (MONTHS.length - task.month);

        for (
          let chunkIndex = task.month;
          chunkIndex < MONTHS.length;
          chunkIndex++
        ) {
          const chunkX = chunkIndex * monthWidth;

          drawRoundedRect(
            context,
            chunkX,
            taskY,
            chunkWidth,
            taskHeight,
            CORNER_RADIUS
          );
          context.fillStyle = color;
          context.fill();
        }
      }

      // Render task owner avatars and labels.
      const textWidth =
        avatar !== null ? taskWidth - AVATAR_SIZE - MARGIN : taskWidth;
      const textHeight = AVATAR_SIZE;
      const textX = taskX + AVATAR_SIZE + MARGIN;
      const textY = taskY - textHeight - MARGIN;

      if (avatar?.image != null) {
        drawAvatarCircle(
          context,
          avatar,
          taskX,
          taskY - MARGIN - AVATAR_SIZE,
          AVATAR_SIZE
        );
      } else {
        context.fillStyle = color;

        drawRoundedRect(
          context,
          taskX,
          taskY - MARGIN - AVATAR_SIZE,
          AVATAR_SIZE,
          AVATAR_SIZE,
          AVATAR_SIZE / 2
        );

        context.fill();

        const ownerName = owner?.name || task.owner || "team";
        const character = ownerName.charAt(0).toUpperCase();

        context.font = "bold 15px sans-serif";
        context.fillStyle =
          getContrastRatio(color, "#ffffff") > getContrastRatio(color, "#000")
            ? "#fff"
            : "#000";
        drawTextToCenterWithin(
          context,
          character,
          taskX,
          taskY - MARGIN - AVATAR_SIZE,
          AVATAR_SIZE,
          AVATAR_SIZE
        );
      }

      context.font = "11px sans-serif";
      context.fillStyle = "#333";
      const measuredTextWidth = drawTextToFitWidth(
        context,
        task.name,
        textX,
        textY,
        textWidth,
        textHeight
      );

      if (measuredTextWidth !== null) {
        textDOMRects.set(
          task.name,
          new DOMRect(textX, textY, measuredTextWidth, textHeight)
        );
      }

      // Register dependencies for later.
      taskMap.set(task.id, task);
      if (task.dependency != null) {
        const dependencyId = task.dependency;
        const dependency = taskMap.get(dependencyId);

        if (!dependenciesMap.has(dependency)) {
          dependenciesMap.set(dependency, []);
        }
        dependenciesMap.get(dependency).push(taskMap.get(task.id));
      }
    }

    // Draw arrows between dependencies.
    dependenciesMap.forEach((dependentTasks, parentTask) => {
      let firstTask = null;
      let lowestTask = null;

      for (let i = 0; i < dependentTasks.length; i++) {
        const dependantTask = dependentTasks[i];

        if (firstTask === null) {
          firstTask = dependantTask;
        } else if (firstTask.month > dependantTask.month) {
          firstTask = dependantTask;
        }

        if (lowestTask === null) {
          lowestTask = dependantTask;
        } else if (
          taskToRowIndexMap.get(lowestTask) <
          taskToRowIndexMap.get(dependantTask)
        ) {
          lowestTask = dependantTask;
        }
      }

      if (firstTask == null || lowestTask == null) {
        return;
      }

      const x = firstTask.month * monthWidth - MARGIN - LINE_SEGMENT_MIN_LENGTH;

      const y0 =
        HEADER_HEIGHT +
        taskToRowIndexMap.get(parentTask) * TASK_ROW_HEIGHT +
        TASK_ROW_HEIGHT +
        MARGIN;
      const y1 =
        HEADER_HEIGHT +
        taskToRowIndexMap.get(lowestTask) * TASK_ROW_HEIGHT +
        TASK_ROW_HEIGHT -
        MARGIN;

      // Draw vertical line from parent task down.
      // This assumes that each sub-task is on its own row.
      // TODO Verify that and draw multiple vertical connecting lines if necessary.
      context.beginPath();
      context.strokeStyle = "#c2d0df";
      context.lineWidth = LINE_WIDTH;
      context.moveTo(x, y0);
      context.lineTo(x, y1);
      context.stroke();

      // Draw horizontal lines (with arrows) to connect each dependent task.
      for (let i = 0; i < dependentTasks.length; i++) {
        const dependantTask = dependentTasks[i];

        const x0 = x;
        const x1 = dependantTask.month * monthWidth - MARGIN;
        const y =
          HEADER_HEIGHT +
          taskToRowIndexMap.get(dependantTask) * TASK_ROW_HEIGHT +
          TASK_ROW_HEIGHT -
          TASK_BAR_HEIGHT +
          TASK_BAR_HEIGHT / 2;

        context.beginPath();
        context.strokeStyle = "#c2d0df";
        context.lineWidth = LINE_WIDTH;
        context.moveTo(x0, y);
        context.lineTo(x1, y);
        context.moveTo(x1, y);
        context.lineTo(x1 - ARROW_SIZE / 3, y - ARROW_SIZE / 3);
        context.moveTo(x1, y);
        context.lineTo(x1 - ARROW_SIZE / 3, y + ARROW_SIZE / 3);
        context.stroke();
      }
    });
  }, [
    colorMap,
    height,
    monthWidth,
    owners,
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

function drawTextToFitWidth(context, text, x, y, width, height) {
  const ellipsisWidth = context.measureText("…").width;

  let resizedText = false;

  let textToRender = text;
  let textWidth = context.measureText(textToRender).width;
  if (textWidth > width) {
    resizedText = true;

    while (textWidth >= width - ellipsisWidth) {
      textToRender = textToRender.substring(0, textToRender.length - 2) + "…";
      textWidth = context.measureText(textToRender).width;
    }
  }

  context.textBaseline = "middle";
  context.fillText(
    textToRender,
    x,
    y + height / 2 + VERTICAL_TEXT_OFFSET,
    width
  );

  return resizedText ? textWidth : null;
}

function drawTextToCenterWithin(context, text, x, y, width, height) {
  const textWidth = context.measureText(text).width;

  context.textBaseline = "middle";
  context.fillText(
    text,
    x + width / 2 - textWidth / 2,
    y + height / 2 + VERTICAL_TEXT_OFFSET,
    textWidth
  );
}

function drawRoundedRect(context, x, y, width, height, radius) {
  context.beginPath();
  context.moveTo(x + radius, y);
  context.arcTo(x + width, y, x + width, y + height, radius);
  context.arcTo(x + width, y + height, x, y + height, radius);
  context.arcTo(x, y + height, x, y, radius);
  context.arcTo(x, y, x + width, y, radius);
  context.closePath();
}

function drawAvatarCircle(context, avatar, x, y, size) {
  context.save();
  context.beginPath();
  drawRoundedRect(context, x, y, size, size, size / 2);
  context.closePath();
  context.clip();

  context.drawImage(
    avatar.image,

    // Native image coordinates and size
    0,
    0,
    avatar.width,
    avatar.height,

    // Canvas coordinates and scaled image size
    x,
    y,
    size,
    size
  );

  context.restore();
}

function hexToRgb(hex) {
  if (hex.length === 4) {
    hex = `#${hex.charAt(1)}${hex.charAt(1)}${hex.charAt(2)}${hex.charAt(
      2
    )}${hex.charAt(3)}${hex.charAt(3)}`;
  }
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [
        parseInt(result[1], 16), // r
        parseInt(result[2], 16), // g
        parseInt(result[3], 16), // b
      ]
    : null;
}

function getLuminanace(values) {
  const rgb = values.map((v) => {
    const val = v / 255;
    return val <= 0.03928 ? val / 12.92 : ((val + 0.055) / 1.055) ** 2.4;
  });
  return Number(
    (0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2]).toFixed(3)
  );
}

function getContrastRatio(colorA, colorB) {
  const lumA = getLuminanace(hexToRgb(colorA));
  const lumB = getLuminanace(hexToRgb(colorB));

  return (Math.max(lumA, lumB) + 0.05) / (Math.min(lumA, lumB) + 0.05);
}
