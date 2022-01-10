import { useLayoutEffect, useMemo, useRef, useState } from "react";
import Tooltip from "./Tooltip";
import createDrawingUtils from "./drawingUtils";

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

  const [tooltipState, setTooltipState] = useState(DEFAULT_TOOLTIP_STATE);

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
      drawTaskRow(context, taskIndex, metadata, team, ownerToImageMap, width);
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
    metadata,
    ownerToImageMap,
    team,
    width,
  ]);

  const handleMouseMove = (event) => {
    const { offsetX, offsetY } = event.nativeEvent;

    for (let [text, rect] of metadata.textDOMRects) {
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
