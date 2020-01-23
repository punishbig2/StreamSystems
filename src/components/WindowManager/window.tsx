import { DefaultWindowButtons } from "components/DefaultWindowButtons";
import { useObjectGrabber } from "hooks/useObjectGrabber";
import React, {
  CSSProperties,
  ReactElement,
  useCallback,
  useEffect,
  useRef
} from "react";

interface OwnProps {
  geometry?: ClientRect;
  area: ClientRect;
  forbidden: ClientRect[];
  isMinimized: boolean;
  autoSize: boolean;
  // Methods/Event handlers
  onGeometryChange: (geometry: ClientRect, resized: boolean) => void;
  onClose: () => void;
  onMinimize: () => void;
  onSetTitle: (title: string) => void;
  onClick: () => void;
  onAdjustSize: () => void;
}

type Props = React.PropsWithChildren<OwnProps>;

const toStyle = (
  geometry: ClientRect | undefined
): CSSProperties | undefined => {
  if (geometry === undefined) return undefined;
  return {
    left: geometry.left,
    top: geometry.top,
    width: geometry.width,
    height: geometry.height
  };
};

const resize = (
  x: number,
  y: number,
  width: number,
  height: number,
  r: ClientRect
): DOMRect => {
  const left: number = Math.min(
    Math.max(x, r.left),
    r.right - Math.min(width, r.width)
  );
  const top: number = Math.min(
    Math.max(y, r.top),
    r.bottom - Math.min(height, r.height)
  );
  // Create the new rectangle confined to the r rectangle
  return new DOMRect(left, top, width, height);
};

const move = (
  x: number,
  y: number,
  width: number,
  height: number,
  r: ClientRect
): DOMRect => {
  const left: number = Math.min(
    Math.max(x, r.left),
    r.right - Math.min(width, r.width)
  );
  const top: number = Math.min(
    Math.max(y, r.top),
    r.bottom - Math.min(height, r.height)
  );
  // Create the new rectangle confined to the r rectangle
  return new DOMRect(left, top, width, height);
};

const onMove = (
  area: ClientRect,
  update: (geometry: ClientRect, resized: boolean) => void
) => (r: ClientRect, x: number, y: number) => {
  update(move(r.left + x, r.top + y, r.width, r.height, area), false);
};

type WindowSide = "top" | "bottom" | "left" | "right";
const onResize = (
  area: ClientRect,
  update: (geometry: ClientRect, resized: boolean) => void,
  side: WindowSide
) => {
  switch (side) {
    case "top":
      return (r: ClientRect, x: number, y: number) =>
        update(resize(r.left, r.top + y, r.width, r.height - y, area), true);
    case "bottom":
      return (r: ClientRect, x: number, y: number) =>
        update(resize(r.left, r.top, r.width, r.height + y, area), true);
    case "left":
      return (r: ClientRect, x: number) =>
        update(resize(r.left + x, r.top, r.width - x, r.height, area), true);
    case "right":
      return (r: ClientRect, x: number) =>
        update(resize(r.left, r.top, r.width + x, r.height, area), true);
  }
};

const pixels = (x: number): string => `${x}px`;
const adjustToContent = (element: HTMLDivElement, area: ClientRect) => {
  const { style } = element;
  const windowContent: HTMLDivElement | null = element.querySelector(
    ".window-content"
  );
  const contentStyle: any = windowContent ? windowContent.style : {};
  if (windowContent) contentStyle.minHeight = "auto";
  // Let's force scrollWidth and scrollHeight to have the minimal internalValue
  style.width = "1px";
  style.height = "1px";
  // Update the element with the minimal size possible
  if (element.scrollWidth + element.offsetLeft < area.width) {
    style.width = pixels(element.scrollWidth);
  } else {
    style.width = pixels(area.width - element.offsetLeft);
  }
  if (element.scrollHeight + element.offsetTop < area.height) {
    style.height = pixels(element.scrollHeight);
  } else {
    style.height = pixels(area.height - element.offsetTop);
  }
  if (windowContent) contentStyle.minHeight = "0";
};

export const WindowElement: React.FC<Props> = (props: Props): ReactElement => {
  const { onGeometryChange, autoSize, area } = props;
  // Create a reference to the window container
  const container: React.MutableRefObject<HTMLDivElement | null> = useRef<HTMLDivElement | null>(
    null
  );
  // Callbacks
  const createResizeCallback = useCallback(
    (side: WindowSide) => {
      return onResize(area, onGeometryChange, side);
    },
    [area, onGeometryChange]
  );
  const moveCallback = useCallback(onMove(area, onGeometryChange), [
    area,
    onGeometryChange
  ]);
  // Moving object, the handle is the whole window
  const [isGrabbed, setMoveHandle] = useObjectGrabber(container, moveCallback);
  // These installs all the resize handles
  const [, setBottomResizeHandle] = useObjectGrabber(
    container,
    createResizeCallback("bottom")
  );
  const [, setTopResizeHandle] = useObjectGrabber(
    container,
    createResizeCallback("top")
  );
  const [, setRightResizeHandle] = useObjectGrabber(
    container,
    createResizeCallback("right")
  );
  const [, setLeftResizeHandle] = useObjectGrabber(
    container,
    createResizeCallback("left")
  );
  // Compute the style
  const classes: string = [
    "window-element",
    isGrabbed ? "grabbed" : null,
    props.isMinimized ? "minimized" : null
  ]
    .join(" ")
    .trim();

  const style: CSSProperties | undefined = toStyle(props.geometry);

  useEffect(() => {
    if (!autoSize) return;
    const { current: parent } = container;
    if (parent === null) return;
    const element: HTMLDivElement | null = parent.querySelector(".content");
    if (element === null) return;
    const observer = new MutationObserver(() => {
      adjustToContent(parent, area);
    });
    // Observe changes
    observer.observe(element, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [container, autoSize, area]);

  useEffect(() => {
    if (!autoSize) return;
    const { current: parent } = container;
    if (parent === null) return;
    adjustToContent(parent, area);
  }, [container, autoSize, area]);

  return (
    <div
      className={classes}
      ref={container}
      style={style}
      onClickCapture={props.onClick}
    >
      <DefaultWindowButtons
        onClose={props.onClose}
        onMinimize={props.onMinimize}
        onAdjustSize={props.onAdjustSize}
      />
      <div className={"content"} ref={setMoveHandle}>
        {props.children}
      </div>
      <div
        className={"horizontal resize-handle left"}
        ref={setLeftResizeHandle}
      />
      <div
        className={"horizontal resize-handle right"}
        ref={setRightResizeHandle}
      />
      <div
        className={"vertical resize-handle bottom"}
        ref={setBottomResizeHandle}
      />
      <div className={"vertical resize-handle top"} ref={setTopResizeHandle} />
    </div>
  );
};
