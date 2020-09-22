import { WindowDef } from "mobx/stores/workspaceStore";
import { useEffect, useState } from "react";
import { Size, getOptimalSize } from "utils/windowUtils";

const sizesReducer = (limits: ClientRect) => (
  result: ClientRect[],
  size: Size,
  index: number
): ClientRect[] => {
  const { width, height } = size;
  if (index === 0) {
    result.push(new DOMRect(0, 0, width, height));
  } else {
    const { left, top, width: offsetWidth, height: offsetHeight } = result[
      index - 1
    ];
    if (top + offsetHeight + height >= limits.bottom) {
      result.push(
        new DOMRect(left + offsetWidth + 1, 0, size.width, size.height)
      );
    } else {
      result.push(
        new DOMRect(left, top + offsetHeight + 1, size.width, size.height)
      );
    }
  }
  return result;
};

const objectToMap = (sorted: WindowDef[]) => (
  map: { [k: string]: ClientRect },
  geometry: ClientRect,
  index: number
) => {
  const window: WindowDef = sorted[index];
  map[window.id] = geometry;
  return map;
};

export const useSnapToNeighbors = (
  styles: CSSStyleSheet,
  windows: ReadonlyArray<WindowDef>,
  ready: boolean,
  area: ClientRect
): { [id: string]: ClientRect } => {
  const { body } = document;
  const [layoutCompleted, setLayoutCompleted] = useState<boolean>(false);
  const [geometries, setGeometries] = useState<{ [id: string]: ClientRect }>(
    {}
  );
  // This will mostly not change
  const limits: DOMRect | ClientRect = body.getBoundingClientRect();
  useEffect(() => {
    if (!ready || layoutCompleted || windows.length === 0) return;
    const layout = () => {
      const sorted: WindowDef[] = [...windows];
      sorted.sort((w1: WindowDef, w2: WindowDef) => w1.position - w2.position);
      const sizes: Size[] = sorted.map((windowDef: WindowDef) => {
        const element: HTMLElement | null = document.getElementById(
          windowDef.id
        );
        if (element instanceof HTMLDivElement) {
          return getOptimalSize(element);
        } else {
          return { width: 0, height: 0 };
        }
      });
      setGeometries(
        sizes.reduce(sizesReducer(limits), []).reduce(objectToMap(sorted), {})
      );
      setLayoutCompleted(true);
    };
    setTimeout(layout, 0);
  }, [styles, windows, ready, layoutCompleted, area, limits]);
  return geometries;
};
