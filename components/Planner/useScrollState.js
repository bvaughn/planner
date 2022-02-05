import { useEffect, useReducer, useRef } from "react";
import { normalizeWheelEvent } from "../utils/mouse";

const MIN_SCALE = 1;
const MAX_SCALE = 10;
const PAN_DELTA_THRESHOLD = 1;
const ZOOM_DELTA_THRESHOLD = 1;
const ZOOM_MULTIPLIER = 0.01;

const DEFAULT_STATE = {
  // Passed in externally
  height: 0,
  metadata: null,
  naturalHeight: 0,
  width: 0,

  // Managed internally
  isDragging: false,
  offsetX: 0,
  offsetY: 0,
  scaleX: 1,
};

// getDateLocation() should be kep in-sync with getDateLocation() in "drawingUtils.js"
function getDateLocation(date, metadata, scaleX, width) {
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

  return width * offset * scaleX;
}

function stopEvent(event) {
  event.preventDefault();
  event.stopImmediatePropagation();
}

function reduce(state, action) {
  const { payload, type } = action;
  switch (type) {
    case "set-chart-size": {
      const { height, naturalHeight, width } = payload;
      return {
        ...state,
        height,
        naturalHeight,
        width,
      };
    }
    case "set-is-dragging": {
      const { isDragging } = payload;
      return {
        ...state,
        isDragging,
      };
      break;
    }
    case "set-metadata": {
      const { metadata } = payload;
      return {
        ...state,
        metadata,
        isDragging: false,
        offsetX: 0,
        offsetY: 0,
        scaleX: 1,
      };
    }
    case "pan": {
      const { deltaX, deltaY } = payload;
      const { height, metadata, naturalHeight, scaleX, width } = state;

      if (deltaX !== 0) {
        // TODO Can we cache this on "zoom" (and "set-chart-size") ?
        const maxOffsetX =
          width - getDateLocation(metadata.stopDate, metadata, scaleX, width);

        const offsetX = Math.min(
          0,
          Math.max(maxOffsetX, state.offsetX - deltaX)
        );

        return {
          ...state,
          offsetX: Math.round(offsetX),
        };
      } else if (deltaY !== 0) {
        const maxOffsetY = height - naturalHeight;

        // TODO Respect natural scroll preference (if we can detect it?).
        const newOffsetY = state.offsetY - deltaY;
        const offsetY = Math.min(0, Math.max(maxOffsetY, newOffsetY));

        return {
          ...state,
          offsetY: Math.round(offsetY),
        };
      }
    }
    case "zoom": {
      const { metadata, offsetX, width } = state;
      const { deltaX, deltaY, locationX } = payload;

      const scaleX = Math.max(
        MIN_SCALE,
        Math.min(MAX_SCALE, state.scaleX - deltaY * ZOOM_MULTIPLIER)
      );

      const maxOffsetX =
        width - getDateLocation(metadata.stopDate, metadata, scaleX, width);

      // Zoom in/out around the point we're currently hovered over.
      const scaleMultiplier = scaleX / state.scaleX;
      const scaledDelta = locationX - locationX * scaleMultiplier;
      const newOffsetX = offsetX * scaleMultiplier + scaledDelta;
      const newClampedOffsetX = Math.min(0, Math.max(maxOffsetX, newOffsetX));

      return {
        ...state,
        offsetX: Math.round(newClampedOffsetX),
        scaleX,
      };
    }
    default: {
      throw new Error(`Unrecognized action "${type}"`);
    }
  }
}

export default function useScrollState({
  canvasRef,
  height,
  naturalHeight,
  metadata,
  width,
}) {
  const [state, dispatch] = useReducer(reduce, DEFAULT_STATE);
  if (
    height !== state.height ||
    naturalHeight !== state.naturalHeight ||
    width !== state.width
  ) {
    dispatch({
      type: "set-chart-size",
      payload: { height, naturalHeight, width },
    });
  }
  if (!Object.is(state.metadata, metadata)) {
    dispatch({ type: "set-metadata", payload: { metadata } });
  }

  // Share with mouse event handlers (only attached on mount).
  const stateRef = useRef(state);
  if (stateRef.current !== state) {
    stateRef.current = state;
  }

  // Note that useEffect() contains "canvasRef" as a dependency;
  // This isn't necessary but "react-hooks" rules don't know this is a React-managed ref.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const handleMouseDown = (event) => {
        dispatch({ type: "set-is-dragging", payload: { isDragging: true } });
      };

      const handleMouseMove = (event) => {
        const currentState = stateRef.current;
        if (!currentState.isDragging) {
          return;
        }

        const { movementX, movementY } = event;

        const movementYAbsolute = Math.abs(movementY);
        const movementXAbsolute = Math.abs(movementX);

        if (movementYAbsolute > movementXAbsolute) {
          stopEvent(event);

          if (movementYAbsolute > PAN_DELTA_THRESHOLD) {
            const deltaY = 0 - movementY;

            dispatch({
              type: "pan",
              payload: { deltaX: 0, deltaY },
            });
          }
        } else {
          stopEvent(event);

          if (movementXAbsolute > PAN_DELTA_THRESHOLD) {
            const deltaX = 0 - movementX;

            dispatch({
              type: "pan",
              payload: { deltaX, deltaY: 0 },
            });
          }
        }
      };

      const handleMouseUp = (event) => {
        dispatch({ type: "set-is-dragging", payload: { isDragging: false } });
      };

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
            stopEvent(event);

            if (deltaYAbsolute > PAN_DELTA_THRESHOLD) {
              dispatch({
                type: "pan",
                payload: { deltaX: 0, deltaY },
              });
            }
          } else {
            stopEvent(event);

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
          stopEvent(event);

          if (deltaXAbsolute > PAN_DELTA_THRESHOLD) {
            dispatch({
              type: "pan",
              payload: { deltaX, deltaY: 0 },
            });
          }
        }
      };

      canvas.addEventListener("mousedown", handleMouseDown);
      canvas.addEventListener("wheel", handleWheel);

      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);

      return () => {
        canvas.removeEventListener("mousedown", handleMouseDown);
        canvas.removeEventListener("wheel", handleWheel);

        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [canvasRef]);

  return state;
}
