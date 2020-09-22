import { DefaultWindowButtons } from "components/DefaultWindowButtons";
import { adjustToContent } from "components/WindowManager/helpers/adjustToContent";
import { move } from "components/WindowManager/helpers/move";
import { resize } from "components/WindowManager/helpers/resize";
import { toStyle } from "components/WindowManager/helpers/toStyle";
import { useObjectGrabber } from "hooks/useObjectGrabber";
import { observer } from "mobx-react";

import messages, { MessagesStore } from "mobx/stores/messagesStore";
import { PodTileStore } from "mobx/stores/podTileStore";
import { WindowStore } from "mobx/stores/windowStore";
import { WindowTypes } from "mobx/stores/workareaStore";
import React, {
  CSSProperties,
  ReactElement,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { getOptimalSize, Size } from "utils/windowUtils";

interface OwnProps {
  id: string;
  geometry?: ClientRect;
  minimized?: boolean;
  type: WindowTypes;
  isDefaultWorkspace: boolean;
  area: ClientRect;
  fitToContent: boolean;
  fixed?: boolean;
  title: (
    props: any,
    store: PodTileStore | MessagesStore | null
  ) => ReactElement | string | null;
  content: (
    props: any,
    store: PodTileStore | MessagesStore | null
  ) => ReactElement | string | null;
  onLayoutModify: () => void;
  onClose: (id: string) => void;
}

type Props = React.PropsWithChildren<OwnProps>;
type WindowSide = "top" | "bottom" | "left" | "right" | "bottom-corner";

const onMove = (
  area: ClientRect,
  update: (geometry: ClientRect, resized: boolean) => void
) => (r: ClientRect, x: number, y: number) => {
  update(move(r.left + x, r.top + y, r.width, r.height, area), false);
};

const onResize = (
  area: ClientRect,
  minWidth: number,
  update: (geometry: ClientRect, resized: boolean) => void,
  side: WindowSide
) => {
  switch (side) {
    case "bottom-corner":
      return (r: ClientRect, x: number, y: number) => {
        update(
          resize(r.left, r.top, r.width + x, r.height + y, area, minWidth),
          true
        );
      };
    case "top":
      return (r: ClientRect, x: number, y: number) =>
        update(
          resize(r.left, r.top + y, r.width, r.height - y, area, minWidth),
          true
        );
    case "bottom":
      return (r: ClientRect, x: number, y: number) =>
        update(
          resize(r.left, r.top, r.width, r.height + y, area, minWidth),
          true
        );
    case "left":
      return (r: ClientRect, x: number) =>
        update(
          resize(r.left + x, r.top, r.width - x, r.height, area, minWidth),
          true
        );
    case "right":
      return (r: ClientRect, x: number) =>
        update(
          resize(r.left, r.top, r.width + x, r.height, area, minWidth),
          true
        );
  }
};

const getContentStore = (
  id: string,
  type: WindowTypes
): MessagesStore | PodTileStore | null => {
  switch (type) {
    case WindowTypes.PodTile:
      return new PodTileStore(id);
    case WindowTypes.MessageBlotter:
      return messages;
  }
  return null;
};

export const WindowElement: React.FC<Props> = observer(
  (props: Props): ReactElement => {
    const { id, area, geometry, type, fixed, fitToContent } = props;

    const [store] = useState<WindowStore>(new WindowStore(id, type, fixed));
    const [minWidth, setMinWidth] = useState<number>(-1);
    const { onLayoutModify } = props;

    useEffect(() => {
      if (geometry !== undefined) {
        store.saveGeometry(geometry);
      }
    }, [geometry, store]);

    useEffect(() => {
      store.setFitToContent(fitToContent);
    }, [fitToContent, store]);

    // Create a reference to the window container
    const containerRef: React.MutableRefObject<HTMLDivElement | null> = useRef<HTMLDivElement | null>(
      null
    );
    const tryToSnapToSiblings = useCallback(
      (geometry: ClientRect, resized: boolean) => {
        const window: HTMLDivElement | null = containerRef.current;
        if (window === null) return;
        const parent: HTMLElement | null = window.parentElement;
        if (parent === null) {
          store.setGeometry(geometry, resized);
          // Notify the workspace
          onLayoutModify();
        } else {
          const elements: NodeListOf<Element> = parent.querySelectorAll(
            ".window-element"
          );
          const windows: Element[] = Array.from(elements);
          const borders: ClientRect[] = windows
            .filter((element: Element) => {
              return element !== window;
            })
            .map((element: Element) => {
              const window: HTMLDivElement = element as HTMLDivElement;
              return new DOMRect(
                window.offsetLeft,
                window.offsetTop,
                window.offsetWidth,
                window.offsetHeight
              );
            });
          const threshold: number = 10;
          const newGeometry: ClientRect = borders.reduce(
            (geometry: ClientRect, border: ClientRect) => {
              if (geometry.left < threshold)
                geometry = new DOMRect(
                  0,
                  geometry.top,
                  geometry.width,
                  geometry.height
                );
              if (geometry.top < threshold)
                geometry = new DOMRect(
                  geometry.left,
                  0,
                  geometry.width,
                  geometry.height
                );
              if (Math.abs(border.right - geometry.left) < threshold)
                geometry = new DOMRect(
                  border.right + 1,
                  geometry.top,
                  geometry.width,
                  geometry.height
                );
              if (
                Math.abs(border.top + border.height - geometry.top) < threshold
              )
                geometry = new DOMRect(
                  geometry.left,
                  border.top + border.height + 1,
                  geometry.width,
                  geometry.height
                );
              if (Math.abs(border.left - geometry.right) < threshold)
                geometry = new DOMRect(
                  border.left - geometry.width + 1,
                  geometry.top,
                  geometry.width,
                  geometry.height
                );
              return geometry;
            },
            geometry
          );
          store.setGeometry(newGeometry, resized);
          // Notify the workspace
          onLayoutModify();
        }
      },
      [onLayoutModify, store]
    );
    // Callbacks
    const resizeCallback = useCallback(
      (side: WindowSide) => {
        return onResize(area, minWidth, tryToSnapToSiblings, side);
      },
      [area, minWidth, tryToSnapToSiblings]
    );
    const onGeometryChangeComplete = (geometry: ClientRect) =>
      store.saveGeometry(geometry);
    const moveCallback = useCallback(onMove(area, tryToSnapToSiblings), [
      area,
      tryToSnapToSiblings,
    ]);
    // Moving object, the handle is the whole window
    const [isGrabbed, setMoveHandle] = useObjectGrabber(
      containerRef,
      moveCallback,
      onGeometryChangeComplete
    );
    const [contentStore, setContentStore] = useState<
      MessagesStore | PodTileStore | null
    >(getContentStore(id, type));
    // These installs all the resize handles
    const [, setBottomResizeHandle] = useObjectGrabber(
      containerRef,
      resizeCallback("bottom"),
      onGeometryChangeComplete
    );
    const [, setTopResizeHandle] = useObjectGrabber(
      containerRef,
      resizeCallback("top"),
      onGeometryChangeComplete
    );
    const [, setRightResizeHandle] = useObjectGrabber(
      containerRef,
      resizeCallback("right"),
      onGeometryChangeComplete
    );
    const [, setLeftResizeHandle] = useObjectGrabber(
      containerRef,
      resizeCallback("left"),
      onGeometryChangeComplete
    );
    const [, setBottomCornerResizeHandle] = useObjectGrabber(
      containerRef,
      resizeCallback("bottom-corner"),
      onGeometryChangeComplete
    );
    // Compute the style
    const classes: string[] = ["window-element"];
    if (isGrabbed && !fixed) classes.push("grabbed");
    if (store.minimized) classes.push("minimized");
    if (fixed) classes.push("fixed");
    if (type === WindowTypes.MessageBlotter) classes.push("not-adjustable");
    const style: CSSProperties | undefined = {
      ...toStyle(store.geometry),
      minWidth: minWidth,
    };
    // Keep the min width up to date
    useEffect(() => {
      const { current: parent } = containerRef;
      if (parent === null) return;
      const element: HTMLDivElement | null = parent.querySelector(
        ".window-content"
      );
      if (element === null) return;
      const size: Size = getOptimalSize(element);
      // Save this for later reference
      setMinWidth(size.width);
    }, [area.width]);

    useEffect(() => {
      if (fixed || containerRef.current === null) return;
      setMoveHandle(containerRef.current);
    }, [containerRef, setMoveHandle, fixed]);

    useEffect(() => {
      if (fixed || store.minimized || !store.fitToContent) return;
      const { current: container } = containerRef;
      if (container === null) return;
      const content: HTMLDivElement | null = container.querySelector(
        ".window-content"
      );
      if (content === null) return;
      const observer = new MutationObserver(() => {
        adjustToContent(container);
      });
      // Observe changes
      observer.observe(content, { childList: true, subtree: true });
      // Do it because relevant values have changed
      adjustToContent(container);
      // Cleanup by removing the observer
      return () => observer.disconnect();
    }, [containerRef, area, fixed, store.fitToContent, store.minimized]);

    const bringToFront = () => {
      const element: HTMLDivElement | null = containerRef.current;
      if (element === null) return;
      const parent: HTMLElement | null = element.parentElement;
      if (parent === null) return;
      const front: Element | null = parent.querySelector("[data-front-tile]");
      if (front !== null) front.removeAttribute("data-front-tile");
      element.setAttribute("data-front-tile", "true");
    };

    const onClose = () => {
      props.onClose(store.id);
      props.onLayoutModify();
    };

    const onMinimize = () => {
      props.onLayoutModify();
      store.toggleMinimized();
    };

    const onAdjustSize = () => {
      props.onLayoutModify();
      store.setFitToContent();
    };

    const getTitlebarButtons = (): ReactElement | null => {
      if (fixed) return null;
      return (
        <DefaultWindowButtons
          isMinimized={store.minimized}
          isAdjusted={store.fitToContent}
          onMinimize={onMinimize}
          onAdjustSize={onAdjustSize}
          onClose={onClose}
        />
      );
    };

    useEffect(() => {
      if (props.minimized === undefined) return;
      if (props.minimized !== store.minimized) {
        store.toggleMinimized();
      }
    }, [store, props.minimized]);

    useEffect(() => {
      setContentStore(getContentStore(id, type));
    }, [id, type]);

    const contentProps = {
      scrollable: !store.fitToContent,
      minimized: store.minimized,
    };

    return (
      <div
        id={store.id}
        className={classes.join(" ")}
        ref={containerRef}
        style={style}
        onClickCapture={bringToFront}
      >
        <div className={"window-title-bar"}>
          {props.title(contentProps, contentStore)}
          {getTitlebarButtons()}
        </div>
        <div className={"window-content"}>
          {props.content(contentProps, contentStore)}
        </div>
        {!store.minimized && !fixed && (
          <div
            className={"horizontal resize-handle left"}
            ref={setLeftResizeHandle}
          />
        )}
        {!store.minimized && !fixed && (
          <div
            className={"horizontal resize-handle right"}
            ref={setRightResizeHandle}
          />
        )}
        {!store.minimized && !fixed && (
          <div
            className={"vertical resize-handle bottom"}
            ref={setBottomResizeHandle}
          />
        )}
        {!store.minimized && !fixed && (
          <div
            className={"vertical resize-handle top"}
            ref={setTopResizeHandle}
          />
        )}
        {!store.minimized && !fixed && (
          <div
            className={"corner resize-handle"}
            ref={setBottomCornerResizeHandle}
          />
        )}
      </div>
    );
  }
);
