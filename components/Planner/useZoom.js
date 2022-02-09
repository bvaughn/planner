import { useEffect, useReducer, useRef } from "react";
import { normalizeWheelEvent } from "../utils/mouse";

const DOUBLE_TAP_MAX_DURATION = 200;
const DOUBLE_TAP_ZOOM_IN_DELTA = -50;
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

  // Current pan and zoom
  x: 0,
  y: 0,
  z: 1,
};

// TODO Ignore right click
// https://github.com/d3/d3-zoom/blob/main/src/zoom.js#L11

// getDateLocation() should be kep in-sync with getDateLocation() in "drawingUtils.js"
function getDateLocation(date, metadata, z, width) {
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

  return width * offset * z;
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
    case "set-metadata": {
      const { metadata } = payload;
      return {
        ...state,
        metadata,

        // Reset scroll state when metadata changes.
        x: 0,
        y: 0,
        z: 1,
      };
    }
    case "pan": {
      const { deltaX, deltaY } = payload;
      const { height, metadata, naturalHeight, z, width } = state;

      if (deltaX !== 0) {
        // TODO Can we cache this on "zoom" (and "set-chart-size") ?
        const maxX =
          width - getDateLocation(metadata.stopDate, metadata, z, width);

        const x = Math.min(0, Math.max(maxX, state.x - deltaX));

        return {
          ...state,
          x: Math.round(x),
        };
      } else if (deltaY !== 0) {
        const maxY = height - naturalHeight;

        // TODO Respect natural scroll preference (if we can detect it?).
        const newY = state.y - deltaY;
        const y = Math.min(0, Math.max(maxY, newY));

        return {
          ...state,
          y: Math.round(y),
        };
      }
    }
    case "zoom": {
      const { metadata, x, width } = state;
      const { delta, locationX } = payload;

      const z = Math.max(
        MIN_SCALE,
        Math.min(MAX_SCALE, state.z - delta * ZOOM_MULTIPLIER)
      );

      const maxX =
        width - getDateLocation(metadata.stopDate, metadata, z, width);

      // Zoom in/out around the point we're currently hovered over.
      const scaleMultiplier = z / state.z;
      const scaledDelta = locationX - locationX * scaleMultiplier;
      const newX = x * scaleMultiplier + scaledDelta;
      const newClampedX = Math.min(0, Math.max(maxX, newX));

      return {
        ...state,
        x: Math.round(newClampedX),
        z,
      };
    }
    default: {
      throw new Error(`Unrecognized action "${type}"`);
    }
  }
}

export default function useZoom({
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
      let currentTouchStartCenterX;
      let currentTouchStartLength = 0;
      let currentTouchStartTime = 0;
      let isDragging;
      let lastTouches;

      const handleMouseDown = (event) => {
        isDragging = true;
      };

      const handleMouseMove = (event) => {
        if (!isDragging) {
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
        isDragging = false;
      };

      const handleTouchEnd = (event) => {
        lastTouches = null;
        currentTouchStartCenterX = null;
      };

      const handleTouchMove = (event) => {
        if (lastTouches == null) {
          return;
        }

        const { changedTouches, touches } = event;
        if (changedTouches.length !== lastTouches.length) {
          return;
        }

        stopEvent(event);

        // Return an array of changed deltas, sorted along the x axis.
        // This sorting is required for "zoom" logic since positive or negative values
        // depend on the direction of the touch (which finger is pinching).
        const sortedTouches = Array.from(changedTouches).sort((a, b) => {
          if (a.pageX < b.pageX) {
            return 1;
          } else if (a.pageX > b.pageX) {
            return -1;
          } else {
            return 0;
          }
        });

        const lastTouchesMap = new Map();
        for (let touch of lastTouches) {
          lastTouchesMap.set(touch.identifier, {
            pageX: touch.pageX,
            pageY: touch.pageY,
          });
        }

        const deltas = [];
        for (let changedTouch of sortedTouches) {
          const touch = lastTouchesMap.get(changedTouch.identifier);
          if (touch) {
            deltas.push([
              changedTouch.pageX - touch.pageX,
              changedTouch.pageY - touch.pageY,
            ]);
          }
        }

        // TODO Check delta threshold(s)

        if (deltas.length === 1) {
          const [deltaX, deltaY] = deltas[0];
          if (Math.abs(deltaX) > Math.abs(deltaY)) {
            dispatch({
              type: "pan",
              payload: { deltaX: 0 - deltaX, deltaY: 0 },
            });
          } else {
            dispatch({
              type: "pan",
              payload: { deltaX: 0, deltaY: 0 - deltaY },
            });
          }
        } else if (deltas.length === 2) {
          const [[deltaX0, deltaY0], [deltaX1, deltaY1]] = deltas;
          const deltaXAbsolute = Math.abs(deltaX0) + Math.abs(deltaX1);
          const deltaYAbsolute = Math.abs(deltaY0) + Math.abs(deltaY1);

          // Horizontal zooms; ignore vertical.
          if (deltaXAbsolute > deltaYAbsolute) {
            const delta =
              Math.abs(deltaX0) > Math.abs(deltaX1) ? 0 - deltaX0 : deltaX1;

            dispatch({
              type: "zoom",
              payload: {
                delta,
                locationX: currentTouchStartCenterX,
              },
            });
          }
        }

        lastTouches = touches;
      };

      const handleTouchStart = (event) => {
        const { touches } = event;

        stopEvent(event);

        const length = touches.length;
        const now = performance.now();

        if (
          now - currentTouchStartTime < DOUBLE_TAP_MAX_DURATION &&
          length === currentTouchStartLength &&
          length === 1
        ) {
          const locationX = touches[0].pageX;

          dispatch({
            type: "zoom",
            payload: { delta: DOUBLE_TAP_ZOOM_IN_DELTA, locationX },
          });
        } else {
          currentTouchStartCenterX =
            length === 1
              ? touches[0].pageX
              : touches[0].pageX + (touches[1].pageX - touches[0].pageX) / 2;
        }

        lastTouches = touches;
        currentTouchStartLength = length;
        currentTouchStartTime = now;
      };

      const handleWheel = (event) => {
        const { shiftKey, x } = event;
        const { deltaX, deltaY } = normalizeWheelEvent(event);

        const deltaYAbsolute = Math.abs(deltaY);
        const deltaXAbsolute = Math.abs(deltaX);

        // Horizontal wheel pans; vertical wheel zooms (unless the SHIFT modifier is used).
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
                payload: { delta: deltaY, locationX },
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
      canvas.addEventListener("touchstart", handleTouchStart);
      canvas.addEventListener("wheel", handleWheel);

      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      window.addEventListener("touchend", handleTouchEnd);
      window.addEventListener("touchmove", handleTouchMove, { passive: false });

      return () => {
        canvas.removeEventListener("mousedown", handleMouseDown);
        canvas.removeEventListener("touchstart", handleTouchStart);
        canvas.removeEventListener("wheel", handleWheel);

        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
        window.removeEventListener("touchend", handleTouchEnd);
        window.removeEventListener("touchmove", handleTouchMove, {
          passive: false,
        });
      };
    }
  }, [canvasRef]);

  return state;
}
