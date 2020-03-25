import {DefaultWindowButtons} from 'components/DefaultWindowButtons';
import {useObjectGrabber} from 'hooks/useObjectGrabber';
import React, {CSSProperties, ReactElement, useCallback, useEffect, useRef, useState} from 'react';

interface OwnProps {
  id: string;
  geometry?: ClientRect;
  area: ClientRect;
  isMinimized: boolean;
  autoSize: boolean;
  fixed?: boolean;
  // Methods/Event handlers
  onGeometryChange: (geometry: ClientRect, resized: boolean) => void;
  onClose: () => void;
  onMinimize: () => void;
  onSetTitle: (title: string) => void;
  onClick: () => void;
  onAdjustSize: () => void;
  onSaveWindowGeometry: (windowID: string, geometry: ClientRect, resized: boolean) => void;
}

type Props = React.PropsWithChildren<OwnProps>;

const toStyle = (geometry: ClientRect | undefined): CSSProperties | undefined => {
  if (geometry === undefined)
    return undefined;
  return {
    left: geometry.left,
    top: geometry.top,
    width: geometry.width,
    height: geometry.height,
  };
};

const resize = (x: number, y: number, width: number, height: number, r: ClientRect, minWidth: number): DOMRect => {
  const left: number = Math.min(Math.max(x, r.left), r.right - Math.min(width, r.width));
  const top: number = Math.min(Math.max(y, r.top), r.bottom - Math.min(height, r.height));
  if (minWidth > 0 && width < minWidth) {
    width = minWidth;
  }
  if (width - left > window.innerWidth)
    return new DOMRect(0, 0, minWidth, height);
  // Create the new rectangle confined to the r rectangle
  return new DOMRect(left, top, width, height);
};

const move = (x: number, y: number, width: number, height: number, r: ClientRect): DOMRect => {
  const left: number = Math.min(Math.max(x, r.left), r.right - Math.min(width, r.width));
  const top: number = Math.min(Math.max(y, r.top), r.bottom - Math.min(height, r.height));
  // Create the new rectangle confined to the r rectangle
  return new DOMRect(left, top, width, height);
};

const onMove = (area: ClientRect, update: (geometry: ClientRect, resized: boolean) => void) => (r: ClientRect, x: number, y: number) => {
  update(move(r.left + x, r.top + y, r.width, r.height, area), false);
};

type WindowSide = 'top' | 'bottom' | 'left' | 'right' | 'bottom-corner';

const onResize = (area: ClientRect, minWidth: number, update: (geometry: ClientRect, resized: boolean) => void, side: WindowSide) => {
  switch (side) {
    case 'bottom-corner':
      return (r: ClientRect, x: number, y: number) => {
        update(resize(r.left, r.top, r.width + x, r.height + y, area, minWidth), true);
      };
    case 'top':
      return (r: ClientRect, x: number, y: number) =>
        update(resize(r.left, r.top + y, r.width, r.height - y, area, minWidth), true);
    case 'bottom':
      return (r: ClientRect, x: number, y: number) =>
        update(resize(r.left, r.top, r.width, r.height + y, area, minWidth), true);
    case 'left':
      return (r: ClientRect, x: number) =>
        update(resize(r.left + x, r.top, r.width - x, r.height, area, minWidth), true);
    case 'right':
      return (r: ClientRect, x: number) =>
        update(resize(r.left, r.top, r.width + x, r.height, area, minWidth), true);
  }
};

const pixels = (x: number): string => `${x}px`;

const adjustToContent = (element: HTMLDivElement, area: ClientRect) => {
  const {style} = element;
  const windowContent: HTMLDivElement | null = element.querySelector('.window-content');
  const contentStyle: any = windowContent ? windowContent.style : {};
  if (windowContent)
    contentStyle.minHeight = 'auto';
  // Let's force scrollWidth and scrollHeight to have the minimal internalValue
  style.width = '1px';
  style.height = '1px';
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
  if (windowContent)
    contentStyle.minHeight = '0';
};

export const WindowElement: React.FC<Props> = (props: Props): ReactElement => {
  const [minWidth, setMinWidth] = useState<number>(-1);
  const {onGeometryChange, autoSize, area} = props;
  // Create a reference to the window container
  const container: React.MutableRefObject<HTMLDivElement | null> = useRef<HTMLDivElement | null>(
    null,
  );
  const tryToSnapToSiblings = useCallback((geometry: ClientRect, resized: boolean) => {
    const window: HTMLDivElement | null = container.current;
    if (window === null)
      return;
    const parent: HTMLElement | null = window.parentElement;
    if (parent === null) {
      onGeometryChange(geometry, resized);
    } else {
      const elements: NodeListOf<Element> = parent.querySelectorAll('.window-element');
      const windows: Element[] = Array.from(elements);
      const borders: ClientRect[] = windows
        .filter((element: Element) => {
          return element !== window;
        })
        .map((element: Element) => {
          const window: HTMLDivElement = element as HTMLDivElement;
          return new DOMRect(window.offsetLeft, window.offsetTop, window.offsetWidth, window.offsetHeight);
        });
      const threshold: number = 15;
      const newGeometry: ClientRect = borders.reduce((geometry: ClientRect, border: ClientRect) => {
        if (geometry.left < threshold)
          geometry = new DOMRect(0, geometry.top, geometry.width, geometry.height);
        if (geometry.top < threshold)
          geometry = new DOMRect(geometry.left, 0, geometry.width, geometry.height);
        if (Math.abs(border.right - geometry.left) < threshold)
          geometry = new DOMRect(border.right, geometry.top, geometry.width, geometry.height);
        if (Math.abs((border.top + border.height) - geometry.top) < threshold)
          geometry = new DOMRect(geometry.left, border.top + border.height, geometry.width, geometry.height);
        if (Math.abs(border.left - geometry.right) < threshold)
          geometry = new DOMRect(border.left - geometry.width, geometry.top, geometry.width, geometry.height);
        return geometry;
      }, geometry);
      onGeometryChange(newGeometry, resized);
    }
  }, [container, onGeometryChange]);
  const {isMinimized} = props;
  // Callbacks
  const resizeCallback = useCallback(
    (side: WindowSide) => {
      return onResize(area, minWidth, tryToSnapToSiblings, side);
    },
    [area, minWidth, tryToSnapToSiblings],
  );
  const onGeometryChangeComplete = (resized: boolean) =>
    (geometry: ClientRect) => {
      return props.onSaveWindowGeometry(props.id, geometry, resized);
    };
  const moveCallback = useCallback(onMove(area, tryToSnapToSiblings), [area, tryToSnapToSiblings]);
  // Moving object, the handle is the whole window
  const [isGrabbed, setMoveHandle] = useObjectGrabber(container, moveCallback, onGeometryChangeComplete(false));
  // These installs all the resize handles
  const [, setBottomResizeHandle] = useObjectGrabber(container, resizeCallback('bottom'), onGeometryChangeComplete(true));
  const [, setTopResizeHandle] = useObjectGrabber(container, resizeCallback('top'), onGeometryChangeComplete(true));
  const [, setRightResizeHandle] = useObjectGrabber(container, resizeCallback('right'), onGeometryChangeComplete(true));
  const [, setLeftResizeHandle] = useObjectGrabber(container, resizeCallback('left'), onGeometryChangeComplete(true));
  const [, setBottomCornerResizeHandle] = useObjectGrabber(container, resizeCallback('bottom-corner'), onGeometryChangeComplete(true));
  // Compute the style
  const classes: string = [
    'window-element',
    props.isMinimized ? 'minimized' : null,
    isGrabbed ? 'grabbed' : null,
  ]
    .join(' ')
    .trim();

  const style: CSSProperties | undefined = toStyle(props.geometry);
  // Keep the min width up to date
  useEffect(() => {
    const {current: parent} = container;
    if (parent === null)
      return;
    const element: HTMLDivElement | null = parent.querySelector('.content');
    if (element === null)
      return;
    const {style} = parent;
    const originalWidth = style.width;
    // Let's force scrollWidth and scrollHeight to have the minimal internalValue
    style.width = '1px';
    // Update the element with the minimal size possible
    if (element.scrollWidth + element.offsetLeft < area.width) {
      style.width = pixels(element.scrollWidth);
    } else {
      style.width = pixels(area.width - element.offsetLeft);
    }
    setMinWidth(parseInt(style.width));
    // Restore original width
    style.width = originalWidth;
  }, [area.width]);

  useEffect(() => {
    if (!autoSize)
      return;
    const {current: parent} = container;
    if (parent === null)
      return;
    const element: HTMLDivElement | null = parent.querySelector('.content');
    if (element === null)
      return;
    const observer = new MutationObserver(() => {
      adjustToContent(parent, area);
    });
    // Observe changes
    observer.observe(element, {childList: true, subtree: true});
    return () => observer.disconnect();
  }, [container, autoSize, area]);

  useEffect(() => {
    if (!autoSize)
      return;
    const {current: parent} = container;
    if (parent === null)
      return;
    adjustToContent(parent, area);
  }, [container, autoSize, area]);

  const getTitlebarButtons = (): ReactElement | null => {
    if (props.fixed)
      return null;
    return (
      <DefaultWindowButtons
        isMinimized={props.isMinimized}
        onClose={props.onClose}
        onMinimize={props.onMinimize}
        onAdjustSize={props.onAdjustSize}/>
    );
  };

  return (
    <div className={classes} ref={container} style={style} onClickCapture={props.onClick}>
      {getTitlebarButtons()}
      <div className={'content'} ref={setMoveHandle}>
        {props.children}
      </div>
      {!isMinimized && <div className={'horizontal resize-handle left'} ref={setLeftResizeHandle}/>}
      {!isMinimized && <div className={'horizontal resize-handle right'} ref={setRightResizeHandle}/>}
      {!isMinimized && <div className={'vertical resize-handle bottom'} ref={setBottomResizeHandle}/>}
      {!isMinimized && <div className={'vertical resize-handle top'} ref={setTopResizeHandle}/>}
      {!isMinimized && <div className={'corner resize-handle'} ref={setBottomCornerResizeHandle}/>}
    </div>
  );
};
