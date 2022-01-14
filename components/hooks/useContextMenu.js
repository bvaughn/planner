import { useCallback, useEffect, useState } from "react";
import ContextMenu from "../ContextMenu";

export default function useContextMenu(targetRef, showMenu) {
  const [contextMenuItems, setContextMenuItems] = useState(null);
  const [point, setPoint] = useState(null);

  const hide = useCallback(() => {
    setPoint(null);
    setContextMenuItems(null);
  }, []);

  useEffect(() => {
    const handleContextMenu = (event) => {
      event.preventDefault();

      const { offsetX, offsetY } = event;

      const items = showMenu(offsetX, offsetY);
      if (items != null) {
        setContextMenuItems(items);
        setPoint({ x: offsetX, y: offsetY });
      }
    };

    const target = targetRef.current;
    target.addEventListener("contextmenu", handleContextMenu);

    return () => {
      target.removeEventListener("contextmenu", handleContextMenu);
    };
  }, [showMenu, targetRef]);

  if (!contextMenuItems) {
    return null;
  } else {
    return (
      <ContextMenu
        hide={hide}
        items={contextMenuItems}
        left={point.x}
        top={point.y}
      />
    );
  }
}
