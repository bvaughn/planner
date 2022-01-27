import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useReducer,
  useRef,
} from "react";
import { openInNewTab } from "../utils/url";
import styles from "./MouseControls.module.css";

const DEFAULT_STATE = {
  cursor: {
    offsetX: 0,
    offsetY: 0,
  },
  task: null,
  type: null,
};

function reduce(state, action) {
  const { payload, type } = action;
  switch (type) {
    case "hide":
      return DEFAULT_STATE;
      break;
    case "show-context-menu":
      return {
        cursor: {
          offsetX: payload.offsetX,
          offsetY: payload.offsetY,
        },
        task: payload.task,
        type: "context-menu",
      };
      break;
    case "show-tooltip":
      return {
        cursor: {
          offsetX: payload.offsetX,
          offsetY: payload.offsetY,
        },
        task: payload.task,
        type: "tooltip",
      };
      break;
    default:
      throw new Error(`Unrecognized action "${type}"`);
  }
}

export default function MouseControls({
  canvasRef,
  contextMenuHorizontalOffset,
  contextMenuVerticalOffset,
  findTaskAtPoint,
  metadata,
  setActiveTask,
  tooltipOffset,
}) {
  const [state, dispatch] = useReducer(reduce, DEFAULT_STATE);

  const overlayRef = useRef(null);

  // Listen to mouse-move events to update visible tooltip.
  useEffect(() => {
    if (state.type === "context-menu") {
      // Tooltips shouldn't be shown while the context menu is visible.
      return;
    }

    const canvas = canvasRef.current;

    const handleClick = (event) => {
      const { offsetX, offsetY } = event;

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
      dispatch({ type: "hide" });

      setActiveTask(null);

      canvas.style.cursor = "default";
    };

    const handleMouseMove = (event) => {
      const { offsetX, offsetY } = event;

      const match = findTaskAtPoint(offsetX, offsetY, metadata);
      if (match) {
        const { domMetadata, task } = match;

        setActiveTask(task);

        canvas.style.cursor = task.url ? "pointer" : "default";

        if (domMetadata.isClipped) {
          dispatch({
            type: "show-tooltip",
            payload: {
              task,
              offsetX,
              offsetY,
            },
          });
        } else {
          dispatch({ type: "hide" });
        }
      } else {
        dispatch({ type: "hide" });

        setActiveTask(null);

        canvas.style.cursor = "default";
      }
    };

    canvas.addEventListener("click", handleClick);
    canvas.addEventListener("mouseleave", handleMouseLeave);
    canvas.addEventListener("mousemove", handleMouseMove);

    return () => {
      canvas.removeEventListener("click", handleClick);
      canvas.removeEventListener("mouseleave", handleMouseLeave);
      canvas.removeEventListener("mousemove", handleMouseMove);
    };
  }, [canvasRef, findTaskAtPoint, metadata, setActiveTask, state]);

  // Listen for "contextmenu" events to show/update the visible context menu.
  useEffect(() => {
    const handleContextMenu = (event) => {
      event.preventDefault();

      const { offsetX, offsetY } = event;

      const match = findTaskAtPoint(offsetX, offsetY, metadata);
      if (match) {
        canvas.style.cursor = "default";

        dispatch({
          type: "show-context-menu",
          payload: {
            task: match.task,
            offsetX,
            offsetY,
          },
        });

        setActiveTask(match.task);
      } else {
        dispatch({ type: "hide" });

        setActiveTask(null);
      }
    };

    const canvas = canvasRef.current;
    canvas.addEventListener("contextmenu", handleContextMenu);

    return () => {
      canvas.removeEventListener("contextmenu", handleContextMenu);
    };
  }, [canvasRef, findTaskAtPoint, metadata, setActiveTask]);

  // Hide the active context menu if it's visible
  useEffect(() => {
    if (state.type === "context-menu") {
      const hide = (event) => {
        dispatch({ type: "hide" });

        setActiveTask(null);
      };

      const timeouteID = setTimeout(() => {
        timeouteID = null;

        document.addEventListener("click", hide);
        document.addEventListener("contextmenu", hide);
        document.addEventListener("keydown", hide);
      });

      return () => {
        if (timeouteID !== null) {
          clearTimeout(timeouteID);
        }

        document.removeEventListener("click", hide);
        document.removeEventListener("contextmenu", hide);
        document.removeEventListener("keydown", hide);
      };
    }
  }, [setActiveTask, state]);

  // Reposition context menu or tooltip based on cursor position and size of canvas.
  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    const overlay = overlayRef.current;
    if (overlay == null) {
      return;
    }

    const horizontalOffset =
      state.type === "context-menu"
        ? contextMenuHorizontalOffset
        : tooltipOffset;
    const verticalOffset =
      state.type === "context-menu" ? contextMenuVerticalOffset : tooltipOffset;

    const { offsetX, offsetY } = state.cursor;

    let left = Math.min(
      offsetX + horizontalOffset,
      canvas.offsetWidth - overlay.offsetWidth
    );
    let top = Math.min(
      offsetY + contextMenuVerticalOffset,
      canvas.offsetHeight - overlay.offsetHeight
    );

    overlay.style.left = `${left}px`;
    overlay.style.top = `${top}px`;
  }, [
    canvasRef,
    contextMenuHorizontalOffset,
    contextMenuVerticalOffset,
    state,
    tooltipOffset,
  ]);

  switch (state.type) {
    case "context-menu": {
      const { task } = state;

      const copyTaskToClipboard = () => {
        navigator.clipboard.writeText(JSON.stringify(task));
      };

      const openTaskURL = () => {
        openInNewTab(task.url);
      };

      return (
        <ul
          data-testname="ContextMenu"
          ref={overlayRef}
          className={styles.ContextMenu}
        >
          <li
            data-testname="ContextMenu-CopyTaskDetails"
            className={styles.ContextMenuItem}
            onClick={copyTaskToClipboard}
          >
            Copy task details
          </li>
          {task.url != null && (
            <li
              data-testname="ContextMenu-OpenURL"
              className={styles.ContextMenuItem}
              onClick={openTaskURL}
            >
              Open task URL
            </li>
          )}
        </ul>
      );
    }
    case "tooltip": {
      const { task } = state;

      return (
        <div ref={overlayRef} className={styles.Tooltip}>
          {task.name}
        </div>
      );
    }
    default: {
      return null;
    }
  }
}
