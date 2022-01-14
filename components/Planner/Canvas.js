import { useLayoutEffect, useMemo, useRef, useState } from "react";
import Tooltip from "./Tooltip";
import createDrawingUtils from "./drawingUtils";
import { openInNewTab } from "../utils/url";
import useContextMenu from "../hooks/useContextMenu";

const TOOLTIP_HEIGHT = 20;

const DEFAULT_TOOLTIP_STATE = {
  label: null,
  left: null,
  right: null,
  top: null,
};

// Processes data; arguably should be moved into Preloader component.
export default function Canvas({
  config,
  metadata,
  ownerToImageMap,
  tasks,
  team,
  width,
}) {
  const {
    AVATAR_SIZE,
    HEADER_HEIGHT,
    MARGIN,
    TASK_BAR_HEIGHT,
    TOOLTIP_OFFSET,
  } = config;
  const TASK_ROW_HEIGHT =
    MARGIN + AVATAR_SIZE + MARGIN + TASK_BAR_HEIGHT + MARGIN;

  const {
    drawDependencyConnections,
    drawTaskRow,
    drawUnitGrid,
    drawUnitHeaders,
  } = useMemo(() => createDrawingUtils(config), [config]);

  const height = HEADER_HEIGHT + metadata.maxRowIndex * TASK_ROW_HEIGHT;

  const canvasRef = useRef();

  const contextMenu = useContextMenu(canvasRef, (x, y) => {
    const match = findTaskAtPoint(x, y, metadata);
    if (match) {
      const { task } = match;
      const items = [
        {
          name: "Copy task details",
          callback: () => {
            navigator.clipboard.writeText(JSON.stringify(task));
          },
        },
      ];

      if (task.url) {
        items.push({
          name: "Open task URL",
          callback: () => {
            openInNewTab(task.url);
          },
        });
      }

      return items;
    }

    return null;
  });

  const [tooltipState, setTooltipState] = useState(DEFAULT_TOOLTIP_STATE);
  const [hoveredTask, setHoveredTask] = useState(null);

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
    drawUnitGrid(context, metadata, width, height);

    // Render header text for month columns.
    drawUnitHeaders(context, metadata, width);

    for (let taskIndex = 0; taskIndex < metadata.tasks.length; taskIndex++) {
      drawTaskRow(
        context,
        taskIndex,
        metadata,
        team,
        ownerToImageMap,
        width,
        hoveredTask
      );
    }

    // Draw arrows between dependencies.
    metadata.dependenciesMap.forEach((dependentTasks, parentTask) => {
      drawDependencyConnections(
        context,
        dependentTasks,
        parentTask,
        width,
        metadata
      );
    });
  }, [
    drawDependencyConnections,
    drawTaskRow,
    drawUnitGrid,
    drawUnitHeaders,
    height,
    hoveredTask,
    metadata,
    ownerToImageMap,
    team,
    width,
  ]);

  const handleClick = (event) => {
    const { offsetX, offsetY, target: canvas } = event.nativeEvent;

    const match = findTaskAtPoint(offsetX, offsetY, metadata);
    if (match) {
      const { task } = match;

      canvas.style.cursor = "default";

      if (task.url) {
        openInNewTab(task.url);
      }
    }
  };

  const handleMouseLeave = (event) => {
    const { target: canvas } = event.nativeEvent;

    setTooltipState(DEFAULT_TOOLTIP_STATE);

    canvas.style.cursor = "default";
  };

  const handleMouseMove = (event) => {
    const { offsetX, offsetY, target: canvas } = event.nativeEvent;

    const match = findTaskAtPoint(offsetX, offsetY, metadata);
    if (match) {
      const { domMetadata, task } = match;

      setHoveredTask(task);

      canvas.style.cursor = task.url ? "pointer" : "default";

      if (domMetadata.isClipped) {
        let left = null;
        let right = null;
        if (offsetX <= width / 2) {
          left = offsetX + TOOLTIP_OFFSET;
        } else {
          right = width - offsetX + TOOLTIP_OFFSET;
        }

        let top = Math.min(offsetY + TOOLTIP_OFFSET, height - TOOLTIP_HEIGHT);

        setTooltipState({ left, right, text: task.name, top });
      }
    } else {
      setTooltipState(DEFAULT_TOOLTIP_STATE);

      canvas.style.cursor = "default";
    }
  };

  return (
    <>
      <canvas
        ref={canvasRef}
        height={height}
        onClick={handleClick}
        onMouseLeave={handleMouseLeave}
        onMouseMove={handleMouseMove}
        width={width}
      />
      <Tooltip {...tooltipState} />
      {contextMenu}
    </>
  );
}

function findTaskAtPoint(x, y, metadata) {
  for (let [task, domMetadata] of metadata.taskDOMMetadata) {
    const { isClipped, rect } = domMetadata;

    if (
      x >= rect.x &&
      x <= rect.x + rect.width &&
      y >= rect.y &&
      y <= rect.y + rect.height
    ) {
      return { domMetadata, task };
    }
  }

  return null;
}
