import type { RefObject } from "react";
import { useEffect, useState } from "react";

interface useResizeObserverRect {
  bottom: number;
  height: number;
  left: number;
  right: number;
  top: number;
  width: number;
  x: number;
  y: number;
}

const useResizeObserver = (ref?: RefObject<HTMLDivElement>) => {
  const [rect, setRect] = useState<useResizeObserverRect>({
    bottom: 0,
    height: 0,
    left: 0,
    right: 0,
    top: 0,
    width: 0,
    x: 0,
    y: 0,
  });

  useEffect(() => {
    if (!ref?.current) return;
    const observer = new ResizeObserver((entries) => {
      if (entries[0]) {
        const { x, y, width, height, top, left, bottom, right } =
          entries[0].contentRect;
        setRect({ x, y, width, height, top, left, bottom, right });
      }
    });
    observer.observe(ref.current);
    return () => {
      observer.disconnect();
    };
  }, [ref]);

  return rect;
};

export default useResizeObserver;
