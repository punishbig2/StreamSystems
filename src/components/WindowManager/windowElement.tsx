import { DefaultWindowButtons } from 'components/DefaultWindowButtons';
import { useObjectGrabber } from 'hooks/useObjectGrabber';
import React, { CSSProperties, ReactElement, useCallback, useEffect, useRef, useState } from 'react';
import { WindowStore } from 'mobx/stores/window';
import { observer } from 'mobx-react';
import { WindowTypes } from 'redux/constants/workareaConstants';
import { PodTileStore } from 'mobx/stores/podTile';

import messages, { MessagesStore } from 'mobx/stores/messages';
import { User } from 'interfaces/user';
import { move } from 'components/WindowManager/helpers/move';
import { resize } from 'components/WindowManager/helpers/resize';
import { toStyle } from 'components/WindowManager/helpers/toStyle';
import { toPixels } from 'components/WindowManager/helpers/toPixels';
import { adjustToContent } from 'components/WindowManager/helpers/adjustToContent';

interface OwnProps {
  id: string;
  geometry?: ClientRect;
  minimized?: boolean;
  type: WindowTypes;
  isDefaultWorkspace: boolean;
  area: ClientRect;
  fixed?: boolean;
  connected: boolean;
  personality: string;
  title: (props: any, store: PodTileStore | MessagesStore | null) => ReactElement | string | null;
  content: (props: any, store: PodTileStore | MessagesStore | null) => ReactElement | string | null;
  user: User;
  onLayoutModify: () => void;
  onClose: (id: string) => void;
}

type Props = React.PropsWithChildren<OwnProps>;
type WindowSide = 'top' | 'bottom' | 'left' | 'right' | 'bottom-corner';

const onMove = (area: ClientRect, update: (geometry: ClientRect, resized: boolean) => void) => (r: ClientRect, x: number, y: number) => {
  update(move(r.left + x, r.top + y, r.width, r.height, area), false);
};

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

const getContentStore = (id: string, type: WindowTypes): MessagesStore | PodTileStore | null => {
  switch (type) {
    case WindowTypes.PodTile:
      return new PodTileStore(id);
    case WindowTypes.MessageBlotter:
      return messages;
  }
  return null;
};

export const WindowElement: React.FC<Props> = observer((props: Props): ReactElement => {
  const { id, area, geometry, type, fixed } = props;

  const [store] = useState<WindowStore>(new WindowStore(id, type, fixed));
  const [minWidth, setMinWidth] = useState<number>(-1);
  const { onLayoutModify } = props;

  useEffect(() => {
    if (geometry !== undefined) {
      store.saveGeometry(geometry);
    }
  }, [geometry, store]);

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
      store.setGeometry(geometry, resized);
      // Notify the workspace
      onLayoutModify();
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
      const threshold: number = 10;
      const newGeometry: ClientRect = borders.reduce((geometry: ClientRect, border: ClientRect) => {
        if (geometry.left < threshold)
          geometry = new DOMRect(0, geometry.top, geometry.width, geometry.height);
        if (geometry.top < threshold)
          geometry = new DOMRect(geometry.left, 0, geometry.width, geometry.height);
        if (Math.abs(border.right - geometry.left) < threshold)
          geometry = new DOMRect(border.right + 1, geometry.top, geometry.width, geometry.height);
        if (Math.abs((border.top + border.height) - geometry.top) < threshold)
          geometry = new DOMRect(geometry.left, border.top + border.height + 1, geometry.width, geometry.height);
        if (Math.abs(border.left - geometry.right) < threshold)
          geometry = new DOMRect(border.left - geometry.width + 1, geometry.top, geometry.width, geometry.height);
        return geometry;
      }, geometry);
      store.setGeometry(newGeometry, resized);
      // Notify the workspace
      onLayoutModify();
    }
  }, [onLayoutModify, store]);
  // Callbacks
  const resizeCallback = useCallback(
    (side: WindowSide) => {
      return onResize(area, minWidth, tryToSnapToSiblings, side);
    },
    [area, minWidth, tryToSnapToSiblings],
  );
  const onGeometryChangeComplete = (geometry: ClientRect) => store.saveGeometry(geometry);
  const moveCallback = useCallback(onMove(area, tryToSnapToSiblings), [area, tryToSnapToSiblings]);
  // Moving object, the handle is the whole window
  const [isGrabbed, setMoveHandle] = useObjectGrabber(container, moveCallback, onGeometryChangeComplete);
  const [contentStore, setContentStore] = useState<MessagesStore | PodTileStore | null>(getContentStore(id, type));
  // These installs all the resize handles
  const [, setBottomResizeHandle] = useObjectGrabber(container, resizeCallback('bottom'), onGeometryChangeComplete);
  const [, setTopResizeHandle] = useObjectGrabber(container, resizeCallback('top'), onGeometryChangeComplete);
  const [, setRightResizeHandle] = useObjectGrabber(container, resizeCallback('right'), onGeometryChangeComplete);
  const [, setLeftResizeHandle] = useObjectGrabber(container, resizeCallback('left'), onGeometryChangeComplete);
  const [, setBottomCornerResizeHandle] = useObjectGrabber(container, resizeCallback('bottom-corner'), onGeometryChangeComplete);
  // Compute the style
  const classes: string = ['window-element', store.minimized ? 'minimized' : null, isGrabbed ? 'grabbed' : null]
    .join(' ')
    .trim();
  const style: CSSProperties | undefined = toStyle(store.geometry);
  // Keep the min width up to date
  useEffect(() => {
    const { current: parent } = container;
    if (parent === null)
      return;
    const element: HTMLDivElement | null = parent.querySelector('.window-content');
    if (element === null)
      return;
    const { style } = parent;
    const originalWidth = style.width;
    // Let's force scrollWidth and scrollHeight to have the minimal internalValue
    style.width = '1px';
    // Update the element with the minimal size possible
    if (element.scrollWidth + element.offsetLeft < area.width) {
      style.width = toPixels(element.scrollWidth);
    } else {
      style.width = toPixels(area.width - element.offsetLeft);
    }
    setMinWidth(parseInt(style.width));
    // Restore original width
    style.width = originalWidth;
  }, [area.width]);

  useEffect(() => {
    if (fixed || container.current === null)
      return;
    setMoveHandle(container.current);
  }, [container, setMoveHandle, fixed]);

  useEffect(() => {
    if (fixed || store.minimized)
      return;
    const { current: parent } = container;
    if (parent === null)
      return;
    const element: HTMLDivElement | null = parent.querySelector('.window-content');
    if (element === null)
      return;
    const observer = new MutationObserver(() => {
      if (store.autoSize) {
        adjustToContent(parent, area);
      }
    });
    // Observe changes
    observer.observe(element, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [container, area, fixed, store.autoSize, store.minimized]);

  useEffect(() => {
    if (fixed || !store.autoSize)
      return;
    const { current: parent } = container;
    if (parent === null)
      return;
    adjustToContent(parent, area);
  }, [container, area, fixed, store.autoSize]);

  const bringToFront = () => {
    const element: HTMLDivElement | null = container.current;
    if (element === null)
      return;
    const parent: HTMLElement | null = element.parentElement;
    if (parent === null)
      return;
    const front: Element | null = parent.querySelector('[data-front-tile]');
    if (front !== null)
      front.removeAttribute('data-front-tile');
    element.setAttribute('data-front-tile', 'true');
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
    store.adjustSize();
  };

  const getTitlebarButtons = (): ReactElement | null => {
    if (fixed)
      return null;
    return (
      <DefaultWindowButtons isMinimized={store.minimized}
                            onMinimize={onMinimize}
                            onAdjustSize={onAdjustSize}
                            onClose={onClose}/>
    );
  };

  useEffect(() => {
    if (props.minimized === undefined)
      return;
    if (props.minimized !== store.minimized) {
      store.toggleMinimized();
    }
  }, [store, props.minimized]);

  useEffect(() => {
    setContentStore(getContentStore(id, type));
  }, [id, type]);

  const contentProps = { scrollable: !store.autoSize, minimized: store.minimized };
  return (
    <div id={store.id} className={classes} ref={container} style={style} onClickCapture={bringToFront}>
      <div className={'window-title-bar'}>
        {props.title(contentProps, contentStore)}
        {getTitlebarButtons()}
      </div>
      <div className={'window-content'}>
        {props.content(contentProps, contentStore)}
      </div>
      {!store.minimized && !fixed && <div className={'horizontal resize-handle left'} ref={setLeftResizeHandle}/>}
      {!store.minimized && !fixed && <div className={'horizontal resize-handle right'} ref={setRightResizeHandle}/>}
      {!store.minimized && !fixed && <div className={'vertical resize-handle bottom'} ref={setBottomResizeHandle}/>}
      {!store.minimized && !fixed && <div className={'vertical resize-handle top'} ref={setTopResizeHandle}/>}
      {!store.minimized && !fixed && <div className={'corner resize-handle'} ref={setBottomCornerResizeHandle}/>}
    </div>
  );
});
