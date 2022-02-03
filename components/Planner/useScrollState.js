import { useEffect, useReducer, useRef } from "react";
import { normalizeWheelEvent } from "../utils/mouse";

const MIN_SCALE = 1;
const MAX_SCALE = 10;
const PAN_DELTA_THRESHOLD = 1;
const ZOOM_DELTA_THRESHOLD = 1;
const ZOOM_MULTIPLIER = 0.01;

const DEFAULT_STATE = {
  chartWidth: 0,
  metadata: null,
  offsetX: 0,
  offsetY: 0,
  scaleX: 1,
};

// TODO Share with drawingUtils? What about offsetX?
function getDateLocation(date, metadata, scaleX, chartWidth) {
  const { startDate, stopDate } = metadata;

  const dateRangeDelta =
    stopDate.epochMilliseconds - startDate.epochMilliseconds;
  const offset = Math.max(
    0,
    Math.min(
      1,
      (date.epochMilliseconds - startDate.epochMilliseconds) / dateRangeDelta
    )
  );

  // This is the only place that needs to account for zoom/scale and offset.
  // because all other positioning logic (including width) is based on this return value.
  return chartWidth * offset * scaleX;
}

function reduce(state, action) {
  const { payload, type } = action;
  switch (type) {
    case "set-chart-width": {
      const { chartWidth } = payload;
      return {
        ...state,
        chartWidth,
      };
    }
    case "set-metadata": {
      const { metadata } = payload;
      return {
        ...state,
        metadata,
        offsetX: 0,
        offsetY: 0,
        scaleX: 1,
      };
    }
    case "pan": {
      const { deltaX, deltaY } = payload;
      const { chartWidth, metadata, scaleX } = state;

      // TODO Can we cache this on "zoom" (and "set-chart-width") ?
      const maxOffsetX =
        chartWidth -
        getDateLocation(metadata.stopDate, metadata, scaleX, chartWidth);

      const offsetX = Math.min(0, Math.max(maxOffsetX, state.offsetX - deltaX));

      return {
        ...state,
        offsetX,
      };
    }
    case "zoom": {
      const { chartWidth, metadata, offsetX } = state;
      const { deltaX, deltaY, locationX } = payload;

      const scaleX = Math.max(
        MIN_SCALE,
        Math.min(MAX_SCALE, state.scaleX - deltaY * ZOOM_MULTIPLIER)
      );

      const maxOffsetX =
        chartWidth -
        getDateLocation(metadata.stopDate, metadata, scaleX, chartWidth);

      // Zoom in/out around the point we're currently hovered over.
      const scaleMultiplier = scaleX / state.scaleX;
      const scaledDelta = locationX - locationX * scaleMultiplier;
      const newOffsetX = offsetX * scaleMultiplier + scaledDelta;
      const newClampedOffsetX = Math.min(0, Math.max(maxOffsetX, newOffsetX));

      return {
        ...state,
        offsetX: newClampedOffsetX,
        scaleX,
      };
    }
    default: {
      throw new Error(`Unrecognized action "${type}"`);
    }
  }
}

export default function useScrollState(canvasRef, metadata, chartWidth) {
  const [state, dispatch] = useReducer(reduce, DEFAULT_STATE);
  if (chartWidth !== state.chartWidth) {
    dispatch({ type: "set-chart-width", payload: { chartWidth } });
  }
  if (!Object.is(state.metadata, metadata)) {
    dispatch({ type: "set-metadata", payload: { metadata } });
  }
  // Share with "wheel" event handlers (only attached on mount).
  const stateRef = useRef(state);
  if (stateRef.current !== state) {
    stateRef.current = state;
  }

  // Note that useEffect() contains "canvasRef" as a dependency;
  // This isn't necessary but "react-hooks" rules don't know this is a React-managed ref.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const handleWheel = (event) => {
        const { shiftKey, x } = event;
        const { deltaX, deltaY } = normalizeWheelEvent(event);

        const deltaYAbsolute = Math.abs(deltaY);
        const deltaXAbsolute = Math.abs(deltaX);

        const currentState = stateRef.current;

        // Vertical scrolling zooms in and out (unless the SHIFT modifier is used).
        // Horizontal scrolling pans.
        if (deltaYAbsolute > deltaXAbsolute) {
          if (shiftKey) {
            event.preventDefault();
            event.stopPropagation();

            // TOOD Pan vertically (if content taller than Canvas)
          } else {
            event.preventDefault();
            event.stopPropagation();

            if (deltaYAbsolute > ZOOM_DELTA_THRESHOLD) {
              // TODO Can we cache this somehow?
              const rect = canvas.getBoundingClientRect();
              const locationX = x - rect.x;

              dispatch({
                type: "zoom",
                payload: { deltaX, deltaY, locationX },
              });
            }
          }
        } else {
          event.preventDefault();
          event.stopPropagation();

          if (deltaXAbsolute > PAN_DELTA_THRESHOLD) {
            dispatch({
              type: "pan",
              payload: { deltaX, deltaY },
            });
          }
        }
      };

      canvas.addEventListener("wheel", handleWheel);

      return () => {
        canvas.removeEventListener("wheel", handleWheel);
      };
    }
  }, [canvasRef]);

  return state;
}
