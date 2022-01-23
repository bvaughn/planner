import {
  drawAvatarCircle,
  drawDiagonalStripePattern,
  drawRoundedRect,
  drawTextToCenterWithin,
  drawTextToFit,
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
  highlight,
} from "../utils/color";
import { getOwnerName } from "../utils/task";
import { getDurationLabel, getIntervalLabel } from "../utils/time";

export default function createDrawingUtils({
  ARROW_SIZE,
  AVATAR_SIZE,
  CORNER_RADIUS,
  FONT_SIZE_AVATAR,
  FONT_SIZE_HEADER,
  FONT_SIZE_NORMAL,
  FONT_SIZE_SMALL,
  HEADER_HEIGHT,
  LINE_SEGMENT_MIN_LENGTH,
  LINE_WIDTH,
  MARGIN,
  PADDING,
  TOOLTIP_OFFSET,
}) {
  const TASK_ROW_HEIGHT = MARGIN + AVATAR_SIZE + MARGIN;

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

  function shouldShowAvatar(taskRect, image) {
    return taskRect.width > getAvatarRect(taskRect, image).width * 2;
  }

  function getTaskRect(task, metadata, chartWidth) {
    const rowIndex = metadata.taskToRowIndexMap.get(task);
    const { start, stop } = metadata.taskToTemporalMap.get(task);

    const x = getDateLocation(start, metadata, chartWidth);
    const y = HEADER_HEIGHT + MARGIN + rowIndex * TASK_ROW_HEIGHT;
    const width = getDateLocation(stop, metadata, chartWidth) - x;
    const height = TASK_ROW_HEIGHT;

    return { x, y, width, height };
  }

  function getBarRect(taskRect) {
    return {
      x: taskRect.x + MARGIN,
      y: taskRect.y + MARGIN,
      width: taskRect.width - MARGIN * 2,
      height: taskRect.height - MARGIN * 2,
    };
  }

  function getAvatarRect(taskRect, image) {
    if (image) {
      const aspectRatio = image.width / image.height;
      const height = taskRect.height - MARGIN * 2;
      const width = aspectRatio * height;

      return {
        x: taskRect.x + MARGIN,
        y: taskRect.y + MARGIN,
        width,
        height,
      };
    } else {
      return {
        x: taskRect.x + MARGIN,
        y: taskRect.y + MARGIN,
        width: AVATAR_SIZE,
        height: AVATAR_SIZE,
      };
    }
  }

  function getTextRect(taskRect, image) {
    const showAvatar = shouldShowAvatar(taskRect, image);
    if (showAvatar) {
      const avatarRect = getAvatarRect(taskRect, image);
      return {
        x: avatarRect.x + avatarRect.width + PADDING,
        y: taskRect.y,
        width: taskRect.width - avatarRect.width - PADDING * 2,
        height: taskRect.height,
      };
    } else {
      return {
        x: taskRect.x + PADDING,
        y: taskRect.y,
        width: taskRect.width - PADDING * 2,
        height: taskRect.height,
      };
    }
  }

  function drawOwnerAvatar(
    context,
    taskRect,
    ownerName,
    isOngoing,
    color,
    avatar,
    isHovered
  ) {
    const showAvatar = shouldShowAvatar(taskRect, avatar?.image);
    if (showAvatar) {
      const avatarRect = getAvatarRect(taskRect, avatar?.image);
      const hoverColor = isHovered ? highlight(color) : color;

      if (avatar?.image) {
        drawAvatarCircle(
          context,
          avatar,
          avatarRect.x,
          avatarRect.y,
          avatarRect.width,
          avatarRect.height,
          CORNER_RADIUS
        );
      } else {
        const character = ownerName.charAt(0).toUpperCase();

        drawRoundedRect(
          context,
          avatarRect.x,
          avatarRect.y,
          avatarRect.width,
          avatarRect.height,
          {
            topLeft: CORNER_RADIUS,
            bottomLeft: CORNER_RADIUS,
            topRight: 0,
            bottomRight: 0,
          }
        );
        context.fillStyle = color;
        context.fill();

        // Draw a border between solid color avatar and task.
        context.beginPath();
        context.rect(
          avatarRect.x + avatarRect.width,
          avatarRect.y,
          LINE_WIDTH,
          avatarRect.height
        );
        context.fillStyle = WHITE;
        context.fill();

        // Contrast against the base color, rather than the hoverColor,
        // because hoverColor changes on mouse-over and it's jarring for the foreground to change color on hover.
        const contrastColor =
          getContrastRatio(color, WHITE) > getContrastRatio(color, BLACK)
            ? WHITE
            : BLACK;
        context.font = `bold ${FONT_SIZE_AVATAR}px sans-serif`;
        context.fillStyle = contrastColor;
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
  }

  function drawTaskText(
    context,
    task,
    taskRect,
    color,
    avatar,
    metadata,
    isHovered
  ) {
    const textRect = getTextRect(taskRect, avatar?.image);

    const height = (textRect.height - PADDING * 2 - PADDING) / 2;
    const verticalCenter = textRect.y + textRect.height / 2;

    const topTextRect = {
      ...textRect,
      y: verticalCenter - height - PADDING / 2,
      height,
    };
    const bottomTextRect = {
      ...textRect,
      y: verticalCenter + PADDING / 2,
      height,
    };

    let fillStyle =
      getContrastRatio(color, WHITE) > getContrastRatio(color, BLACK)
        ? WHITE
        : BLACK;

    context.font = `${FONT_SIZE_NORMAL}px sans-serif`;
    context.fillStyle = fillStyle;

    const [_, isTopClipped] = drawTextToFit(context, task.name, topTextRect, {
      align: "top",
    });

    fillStyle =
      getContrastRatio(color, WHITE) > getContrastRatio(color, BLACK)
        ? "rgba(255,255,255,.8)"
        : "rgba(0,0,0,.8)";

    context.font = `small-caps ${FONT_SIZE_SMALL}px sans-serif`;
    context.fillStyle = fillStyle;

    const { start, stop } = metadata.taskToTemporalMap.get(task);

    const [__, isBottomClipped] = drawTextToFit(
      context,
      getDurationLabel(start, stop, metadata.unit),
      bottomTextRect,
      {
        align: "top",
      }
    );

    metadata.taskDOMMetadata.set(task, {
      isClipped: isTopClipped || isBottomClipped,
      rect: taskRect,
    });
  }

  function drawTaskBar(
    context,
    metadata,
    task,
    taskRect,
    color,
    chartWidth,
    isHovered
  ) {
    const barRect = getBarRect(taskRect);

    const hoverColor = isHovered ? highlight(color) : color;

    drawRoundedRect(
      context,
      barRect.x,
      barRect.y,
      barRect.width - MARGIN,
      barRect.height,
      CORNER_RADIUS
    );

    if (task.isOngoing) {
      const pattern = drawDiagonalStripePattern(
        hoverColor,
        highlight(hoverColor)
        // hexToRgba(hoverColor, 0.2)
      );
      context.fillStyle = context.createPattern(pattern, "repeat");
    } else {
      context.fillStyle = hoverColor;
    }

    context.fill();
  }

  function drawTaskRow(
    context,
    taskIndex,
    metadata,
    team,
    ownerToImageMap,
    chartWidth,
    hoveredTask
  ) {
    const task = metadata.tasks[taskIndex];
    const taskRect = getTaskRect(task, metadata, chartWidth);

    const isHovered = task === hoveredTask;

    const ownerName = getOwnerName(task, team);
    const owner = team[task.owner];

    const color = task.color || owner?.color || getColorForString(ownerName);
    const avatar = ownerToImageMap.get(owner);

    drawTaskBar(
      context,
      metadata,
      task,
      taskRect,
      color,
      chartWidth,
      isHovered
    );
    drawOwnerAvatar(
      context,
      taskRect,
      ownerName,
      task.isOngoing,
      color,
      avatar,
      isHovered
    );
    drawTaskText(context, task, taskRect, color, avatar, metadata, isHovered);
  }

  function drawUnitGrid(context, metadata, chartWidth, chartHeight) {
    let prevX = 0;

    // We don't need to draw the first grid line because it's always left-aligned.
    for (let index = 1; index <= metadata.intervalRange.length - 1; index++) {
      const date = metadata.intervalRange[index];

      const x = getDateLocation(date, metadata, chartWidth);

      context.beginPath();
      context.fillStyle = index % 2 === 0 ? LIGHT_GRAY : WHITE;
      context.rect(prevX, 0, x - prevX, chartHeight);
      context.fill();

      prevX = x;
    }
  }

  function drawUnitHeaders(context, metadata, chartWidth) {
    const intervalWidth = getIntervalWidth(chartWidth, metadata);
    if (intervalWidth > 0) {
      for (let index = 0; index < metadata.intervalRange.length - 1; index++) {
        const date = metadata.intervalRange[index];

        const x = getDateLocation(date, metadata, chartWidth) + PADDING;
        const y = 0;
        const width = intervalWidth - PADDING * 2;
        const height = HEADER_HEIGHT;

        const text = getIntervalLabel(date, metadata.unit);

        context.font = `bold ${FONT_SIZE_HEADER}px sans-serif`;
        context.fillStyle = DARK_GRAY;
        drawTextToFit(context, text, { x, y, width, height });
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

    const highestTaskRect = getTaskRect(firstTask, metadata, chartWidth);
    const lowestTaskRect = getTaskRect(lowestTask, metadata, chartWidth);
    const parentBarRect = getBarRect(
      getTaskRect(parentTask, metadata, chartWidth)
    );

    const x = Math.max(
      parentBarRect.x + MARGIN,
      Math.min(
        highestTaskRect.x - LINE_SEGMENT_MIN_LENGTH - MARGIN,
        // Ideal target alignment:
        parentBarRect.x + parentBarRect.width / 2
      )
    );

    const y0 = parentBarRect.y + parentBarRect.height + MARGIN;
    const y1 = lowestTaskRect.y + lowestTaskRect.height / 2;

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
      const dependantBarRect = getTaskRect(dependantTask, metadata, chartWidth);

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
    getTaskRect,
    drawTaskRow,
    drawUnitGrid,
    drawUnitHeaders,
  };
}
