import {
  drawAvatarCircle,
  drawDiagonalStripePattern,
  drawRoundedRect,
  drawTextToCenterWithin,
  drawTextToFitWidth,
} from "../utils/canvas";
import {
  BLACK,
  DARK_GRAY,
  LIGHT_GRAY,
  SLATE_GRAY,
  WHITE,
  getColorForString,
  getContrastRatio,
  hexToRgba,
} from "../utils/color";
import { getOwnerName } from "../utils/task";
import { getIntervalLabel } from "../utils/time";

export default function createDrawingUtils({
  ARROW_SIZE,
  AVATAR_SIZE,
  CORNER_RADIUS,
  FONT_SIZE_AVATAR,
  FONT_SIZE_HEADER,
  FONT_SIZE_NORMAL,
  HEADER_HEIGHT,
  LINE_SEGMENT_MIN_LENGTH,
  LINE_WIDTH,
  MARGIN,
  TASK_BAR_HEIGHT,
  TOOLTIP_OFFSET,
}) {
  const TASK_ROW_HEIGHT =
    MARGIN + AVATAR_SIZE + MARGIN + TASK_BAR_HEIGHT + MARGIN;

  function getIntervalWidth(chartWidth, metadata) {
    let intervalWidth = 0;
    if (metadata.intervalRange.length === 1) {
      intervalWidth = chartWidth;
    } else if (metadata.intervalRange.length > 1) {
      const x0 = getDateLocation(
        metadata.intervalRange[0],
        metadata,
        chartWidth
      );
      const x1 = getDateLocation(
        metadata.intervalRange[1],
        metadata,
        chartWidth
      );
      intervalWidth = x1 - x0;
    }
    return intervalWidth;
  }

  function getDateLocation(date, metadata, chartWidth) {
    const dateRangeDelta =
      metadata.stopDate.epochMilliseconds -
      metadata.startDate.epochMilliseconds;
    const offset = Math.max(
      0,
      Math.min(
        1,
        (date.epochMilliseconds - metadata.startDate.epochMilliseconds) /
          dateRangeDelta
      )
    );

    return chartWidth * offset;
  }

  function getTaskRect(task, metadata, chartWidth) {
    const rowIndex = metadata.taskToRowIndexMap.get(task);
    const { start, stop } = metadata.taskToTemporalMap.get(task);

    const x = getDateLocation(start, metadata, chartWidth);
    const y = HEADER_HEIGHT + MARGIN + rowIndex * TASK_ROW_HEIGHT;
    const width = getDateLocation(stop, metadata, chartWidth) - x;
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
    return new DOMRect(
      taskRect.x,
      taskRect.y + MARGIN,
      AVATAR_SIZE,
      AVATAR_SIZE
    );
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
      drawAvatarCircle(
        context,
        avatar,
        avatarRect.x,
        avatarRect.y,
        AVATAR_SIZE
      );
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

      context.font = `bold ${FONT_SIZE_AVATAR}px sans-serif`;
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

  function drawTaskText(context, task, taskRect, metadata) {
    const textRect = getTextRect(taskRect);

    context.font = `${FONT_SIZE_NORMAL}px sans-serif`;
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
      metadata.textDOMRects.set(
        task.name,
        new DOMRect(textRect.x, textRect.y, measuredTextWidth, textRect.height)
      );
    }
  }

  function drawTaskBar(context, metadata, task, taskRect, color, chartWidth) {
    const barRect = getBarRect(taskRect);

    drawRoundedRect(
      context,
      barRect.x,
      barRect.y,
      barRect.width - MARGIN,
      barRect.height,
      CORNER_RADIUS
    );

    if (task.isOngoing) {
      const pattern = drawDiagonalStripePattern(WHITE, hexToRgba(color, 0.5));
      context.fillStyle = context.createPattern(pattern, "repeat");
    } else {
      context.fillStyle = color;
    }

    context.fill();
  }

  function drawTaskRow(
    context,
    taskIndex,
    metadata,
    team,
    ownerToImageMap,
    chartWidth
  ) {
    const task = metadata.tasks[taskIndex];
    const taskRect = getTaskRect(task, metadata, chartWidth);

    const ownerName = getOwnerName(task, team);
    const owner = team[task.owner];

    const color = task.color || owner?.color || getColorForString(ownerName);
    const avatar = ownerToImageMap.get(owner);

    drawOwnerAvatar(context, taskRect, ownerName, color, avatar);
    drawTaskText(context, task, taskRect, metadata);
    drawTaskBar(context, metadata, task, taskRect, color, chartWidth);
  }

  function drawUnitGrid(context, metadata, chartWidth, chartHeight) {
    // We don't need to draw the first grid line because it's always left-aligned.
    for (let index = 1; index < metadata.intervalRange.length - 1; index++) {
      const date = metadata.intervalRange[index];

      const x = getDateLocation(date, metadata, chartWidth);
      const y = HEADER_HEIGHT + MARGIN;

      context.beginPath();
      context.strokeStyle = LIGHT_GRAY;
      context.lineWidth = LINE_WIDTH;
      context.moveTo(x, y);
      context.lineTo(x, chartHeight);
      context.stroke();
    }
  }

  function drawUnitHeaders(context, metadata, chartWidth) {
    const intervalWidth = getIntervalWidth(chartWidth, metadata);
    if (intervalWidth > 0) {
      for (let index = 0; index < metadata.intervalRange.length - 1; index++) {
        const date = metadata.intervalRange[index];

        const x = getDateLocation(date, metadata, chartWidth);
        const y = MARGIN;
        const width = intervalWidth;
        const height = HEADER_HEIGHT;

        const text = getIntervalLabel(date, metadata.unit);

        context.font = `bold ${FONT_SIZE_HEADER}px sans-serif`;
        context.fillStyle = DARK_GRAY;
        drawTextToFitWidth(context, text, x, y, width, height);
      }
    }
  }

  function drawDependencyConnections(
    context,
    dependentTasks,
    parentTask,
    chartWidth,
    metadata
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
        metadata.taskToRowIndexMap.get(lowestTask) <
        metadata.taskToRowIndexMap.get(dependantTask)
      ) {
        lowestTask = dependantTask;
      }
    }

    if (firstTask == null || lowestTask == null) {
      return;
    }

    const firstBarRect = getBarRect(
      getTaskRect(firstTask, metadata, chartWidth)
    );
    const lowestBarRect = getBarRect(
      getTaskRect(lowestTask, metadata, chartWidth)
    );
    const parentBarRect = getBarRect(
      getTaskRect(parentTask, metadata, chartWidth)
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

    // Draw horizontal lines (with arrows) to connect each dependent task.
    for (let i = 0; i < dependentTasks.length; i++) {
      const dependantTask = dependentTasks[i];
      const dependantBarRect = getBarRect(
        getTaskRect(dependantTask, metadata, chartWidth)
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

  return {
    drawDependencyConnections,
    drawTaskRow,
    drawUnitGrid,
    drawUnitHeaders,
  };
}
