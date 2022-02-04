import {
  drawAvatarCircle,
  drawDiagonalStripePattern,
  drawRoundedRect,
  drawTextToCenterWithin,
  drawTextToFit,
  drawTopCornerBadge,
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
import { getOwnerNames, getPrimaryOwnerName } from "../utils/task";
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
  OWNERS_BADGE_SIZE,
  OWNERS_BADGE_ALPHA,
  PADDING,
  TOOLTIP_OFFSET,
}) {
  const TASK_ROW_HEIGHT = MARGIN + AVATAR_SIZE + MARGIN;

  function getIntervalWidth(metadata, scrollState, chartWidth) {
    let intervalWidth = 0;
    if (metadata.intervalRange.length === 1) {
      intervalWidth = chartWidth;
    } else if (metadata.intervalRange.length > 1) {
      const x0 = getDateLocation(
        metadata.intervalRange[0],
        metadata,
        scrollState,
        chartWidth
      );
      const x1 = getDateLocation(
        metadata.intervalRange[1],
        metadata,
        scrollState,
        chartWidth
      );
      intervalWidth = x1 - x0;
    }
    return intervalWidth;
  }

  function getDateLocation(date, metadata, scrollState, chartWidth) {
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

    // This is the only place that needs to account for zoom/scale and offset.
    // because all other positioning logic (including width) is based on this return value.
    return chartWidth * offset * scrollState.scaleX + scrollState.offsetX;
  }

  function shouldShowAvatar(taskRect, image) {
    return taskRect.width > getAvatarRect(taskRect, image).width * 2;
  }

  function getTaskRect(task, metadata, scrollState, chartWidth) {
    const rowIndex = metadata.taskToRowIndexMap.get(task);
    const { start, stop } = metadata.taskToTemporalMap.get(task);

    const x = getDateLocation(start, metadata, scrollState, chartWidth);
    const y =
      HEADER_HEIGHT + MARGIN + rowIndex * TASK_ROW_HEIGHT + scrollState.offsetY;
    const width = getDateLocation(stop, metadata, scrollState, chartWidth) - x;
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

  function getTextRect(taskRect, image, scrollState) {
    let rect;

    const showAvatar = shouldShowAvatar(taskRect, image);
    if (showAvatar) {
      const avatarRect = getAvatarRect(taskRect, image);

      rect = {
        x: avatarRect.x + avatarRect.width + PADDING,
        y: taskRect.y,
        width: taskRect.width - avatarRect.width - PADDING * 2,
        height: taskRect.height,
      };
    } else {
      rect = {
        x: taskRect.x + PADDING,
        y: taskRect.y,
        width: taskRect.width - PADDING * 2,
        height: taskRect.height,
      };
    }

    // Ensure text is always visible (even when zoomed)
    if (rect.x < 0) {
      rect.width = rect.width + rect.x;
      rect.x = 0;
    }

    return rect;
  }

  function drawOwnerAvatar(
    context,
    taskRect,
    task,
    team,
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
        const ownerName = getPrimaryOwnerName(task, team);
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

      if (Array.isArray(task.owner) && task.owner.length > 1) {
        const badgeRect = {
          x: avatarRect.x + avatarRect.width - OWNERS_BADGE_SIZE,
          y: avatarRect.y,
          width: OWNERS_BADGE_SIZE,
          height: OWNERS_BADGE_SIZE,
        };

        // Contrast against the base color, rather than the hoverColor,
        // because hoverColor changes on mouse-over and it's jarring for the foreground to change color on hover.
        const contrastColor =
          getContrastRatio(color, WHITE) > getContrastRatio(color, BLACK)
            ? WHITE
            : BLACK;

        drawTopCornerBadge(
          context,
          badgeRect.x,
          badgeRect.y,
          badgeRect.width,
          badgeRect.height,
          avatar?.image ? CORNER_RADIUS : 0
        );
        context.fillStyle = hexToRgba(contrastColor, OWNERS_BADGE_ALPHA);
        context.fill();

        context.font = `bold ${FONT_SIZE_SMALL}px sans-serif`;
        context.fillStyle = color;
        drawTextToCenterWithin(
          context,
          `+${task.owner.length - 1}`,
          badgeRect.x + badgeRect.width / 2,
          badgeRect.y,
          badgeRect.width / 2,
          badgeRect.height / 2
        );
      }
    }
  }

  function drawTaskText(
    context,
    task,
    team,
    taskRect,
    color,
    avatar,
    metadata,
    scrollState,
    isHovered
  ) {
    const textRect = getTextRect(taskRect, avatar?.image, scrollState);

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

    const { isClipped: isTopClipped } = drawTextToFit(
      context,
      task.name,
      topTextRect,
      {
        align: "top",
      }
    );

    fillStyle =
      getContrastRatio(color, WHITE) > getContrastRatio(color, BLACK)
        ? "rgba(255,255,255,.8)"
        : "rgba(0,0,0,.8)";

    context.font = `${FONT_SIZE_SMALL}px sans-serif`;
    context.fillStyle = fillStyle;

    const { start, stop } = metadata.taskToTemporalMap.get(task);

    const ownerNames = getOwnerNames(task, team);
    const durationLabel = getDurationLabel(start, stop, metadata.unit);

    const { isClipped: isBottomClipped } = drawTextToFit(
      context,
      // Try to render names and duration.
      // If that won't fit, all back to rendering just the names.
      [`${ownerNames} - (${durationLabel})`, ownerNames],
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
    scrollState,
    task,
    taskRect,
    color,
    chartWidth,
    isHovered
  ) {
    const barRect = getBarRect(taskRect);

    const fillColor = isHovered ? highlight(color) : color;

    drawRoundedRect(
      context,
      barRect.x,
      barRect.y,
      barRect.width,
      barRect.height,
      CORNER_RADIUS
    );

    if (!isHovered && task.isOngoing) {
      const pattern = drawDiagonalStripePattern(color, highlight(color));
      context.fillStyle = context.createPattern(pattern, "repeat");
    } else {
      context.fillStyle = fillColor;
    }

    context.fill();
  }

  function drawTaskRow(
    context,
    taskIndex,
    metadata,
    scrollState,
    team,
    ownerToImageMap,
    chartWidth,
    hoveredTask
  ) {
    const task = metadata.tasks[taskIndex];
    const taskRect = getTaskRect(task, metadata, scrollState, chartWidth);

    // Do not render tasks that are not at least partially visible.
    if (taskRect.x + taskRect.width <= 0 || taskRect.x >= chartWidth) {
      return;
    }

    const isHovered = task === hoveredTask;

    const ownerName = getPrimaryOwnerName(task, team);
    const owner = Array.isArray(task.owner)
      ? team[task.owner[0]]
      : team[task.owner];

    const color = task.color || owner?.color || getColorForString(ownerName);
    const avatar = ownerToImageMap.get(owner);

    drawTaskBar(
      context,
      metadata,
      scrollState,
      task,
      taskRect,
      color,
      chartWidth,
      isHovered
    );
    drawOwnerAvatar(context, taskRect, task, team, color, avatar, isHovered);
    drawTaskText(
      context,
      task,
      team,
      taskRect,
      color,
      avatar,
      metadata,
      scrollState,
      isHovered
    );
  }

  function drawUnitGrid(
    context,
    metadata,
    scrollState,
    chartWidth,
    chartHeight
  ) {
    for (let index = 0; index < metadata.intervalRange.length - 1; index++) {
      const date = metadata.intervalRange[index];
      const nextDate = metadata.intervalRange[index + 1];

      const x = getDateLocation(date, metadata, scrollState, chartWidth);
      const y = 0;
      const width =
        nextDate != null
          ? getDateLocation(nextDate, metadata, scrollState, chartWidth) - x
          : chartWidth - x;
      const height = chartHeight;
      const fillStyle = index % 2 === 1 ? LIGHT_GRAY : WHITE;

      context.beginPath();
      context.fillStyle = fillStyle;
      context.rect(x, y, width, height);
      context.fill();
    }
  }

  function drawUnitHeaders(context, metadata, scrollState, chartWidth) {
    for (let index = 0; index < metadata.intervalRange.length - 1; index++) {
      const date = metadata.intervalRange[index];
      const nextDate = metadata.intervalRange[index + 1];

      const x = getDateLocation(date, metadata, scrollState, chartWidth);
      const y = 0;
      const width =
        nextDate != null
          ? getDateLocation(nextDate, metadata, scrollState, chartWidth) - x
          : chartWidth - x;
      const height = HEADER_HEIGHT;
      const fillStyle = index % 2 === 1 ? LIGHT_GRAY : WHITE;

      context.beginPath();
      context.fillStyle = hexToRgba(fillStyle, 0.9);
      context.rect(x, y, width, height);
      context.fill();

      const text = getIntervalLabel(date, metadata.unit);

      context.font = `bold ${FONT_SIZE_HEADER}px sans-serif`;
      context.fillStyle = DARK_GRAY;

      drawTextToFit(context, text, {
        x: x + PADDING,
        y,
        width: width - PADDING * 2,
        height,
      });
    }
  }

  function drawDependencyConnections(
    context,
    dependentTasks,
    parentTask,
    chartWidth,
    metadata,
    scrollState
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

    const highestTaskRect = getTaskRect(
      firstTask,
      metadata,
      scrollState,
      chartWidth
    );
    const lowestTaskRect = getTaskRect(
      lowestTask,
      metadata,
      scrollState,
      chartWidth
    );
    const parentBarRect = getBarRect(
      getTaskRect(parentTask, metadata, scrollState, chartWidth)
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
      const dependantBarRect = getTaskRect(
        dependantTask,
        metadata,
        scrollState,
        chartWidth
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
    getTaskRect,
    drawTaskRow,
    drawUnitGrid,
    drawUnitHeaders,
  };
}
