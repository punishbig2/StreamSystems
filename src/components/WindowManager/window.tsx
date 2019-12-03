import {DefaultWindowButtons} from 'components/DefaultWindowButtons';
import {useObjectGrabber} from 'hooks/useObjectGrabber';
import React, {CSSProperties, ReactElement, useCallback, useRef} from 'react';

interface OwnProps {
  onGeometryChange: (geometry: ClientRect) => void;
  geometry?: ClientRect;
  area: ClientRect;
  forbidden: ClientRect[];
  onClose: () => void;
  onMinimize: () => void;
  onSetTitle: (title: string) => void;
  isMinimized: boolean;
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

const resize = (x: number, y: number, width: number, height: number, r: ClientRect): DOMRect => {
  const left: number = Math.min(Math.max(x, r.left), r.right - Math.min(width, r.width));
  const top: number = Math.min(Math.max(y, r.top), r.bottom - Math.min(height, r.height));
  // Create the new rectangle confined to the r rectangle
  return new DOMRect(left, top, width, height);
};

const move = (x: number, y: number, width: number, height: number, r: ClientRect): DOMRect => {
  const left: number = Math.min(Math.max(x, r.left), r.right - Math.min(width, r.width));
  const top: number = Math.min(Math.max(y, r.top), r.bottom - Math.min(height, r.height));
  // Create the new rectangle confined to the r rectangle
  return new DOMRect(left, top, width, height);
};

const onMove = (area: ClientRect, update: (geometry: ClientRect) => void) =>
  (r: ClientRect, x: number, y: number) => {
    update(move(r.left + x, r.top + y, r.width, r.height, area));
  };

type WindowSide = 'top' | 'bottom' | 'left' | 'right';
const onResize = (area: ClientRect, update: (geometry: ClientRect) => void, side: WindowSide) => {
  switch (side) {
    case 'top':
      return (r: ClientRect, x: number, y: number) => update(resize(r.left, r.top + y, r.width, r.height - y, area));
    case 'bottom':
      return (r: ClientRect, x: number, y: number) => update(resize(r.left, r.top, r.width, r.height + y, area));
    case 'left':
      return (r: ClientRect, x: number, y: number) => update(resize(r.left + x, r.top, r.width - x, r.height, area));
    case 'right':
      return (r: ClientRect, x: number, y: number) => update(resize(r.left, r.top, r.width + x, r.height, area));
  }
};

interface Size {
  width?: number,
  height?: number
}

export const WindowElement: React.FC<Props> = (props: Props): ReactElement => {
  const {onGeometryChange, area} = props;
  // const [content, setContent] = useState<HTMLDivElement | null>(null);
  // const [size, setSize] = useState<Size>({});
  // Create a reference to the window container
  const container: React.MutableRefObject<HTMLDivElement | null> = useRef<HTMLDivElement | null>(null);
  // Callbacks
  const createResizeCallback = useCallback((side: WindowSide) => {
    return onResize(area, onGeometryChange, side);
  }, [area, onGeometryChange]);
  const moveCallback = useCallback(onMove(area, onGeometryChange), [area, onGeometryChange]);
  // Moving object, the handle is the whole window
  const [isGrabbed, setMoveHandle] = useObjectGrabber(container, moveCallback);
  // These installs all the resize handles
  const [, setBottomResizeHandle] = useObjectGrabber(container, createResizeCallback('bottom'));
  const [, setTopResizeHandle] = useObjectGrabber(container, createResizeCallback('top'));
  const [, setRightResizeHandle] = useObjectGrabber(container, createResizeCallback('right'));
  const [, setLeftResizeHandle] = useObjectGrabber(container, createResizeCallback('left'));
  // Compute the style
  const classes: string = ['window-element', isGrabbed ? 'grabbed' : null, props.isMinimized ? 'minimized' : null]
    .join(' ')
    .trim();
  /*useEffect(() => {
    if (content === null)
      return;
    const getOptimalSize = (container: Element, offset: DOMRect): DOMRect => {
      const children: Element[] = Array.from(container.children);
      if (children.length === 0)
        return container.getBoundingClientRect() as DOMRect;
      for (const child of children) {
        const target: DOMRect = getOptimalSize(child, offset);
        if (offset.left > target.left)
          offset.x = target.left;
        if (offset.right < target.right)
          offset.width = target.right - offset.left + 1;
        if (offset.top > target.top)
          offset.y = target.top;
        if (offset.bottom < target.bottom)
          offset.height = target.bottom - offset.top + 1;
      }
      return offset;
    };

    const updateSize = () => {
      const computedRect: DOMRect = getOptimalSize(content, new DOMRect());
      const size: Size = {width: computedRect.width, height: computedRect.height + 5};
      // Update the thing
      setSize(size);
    };
    const observer: MutationObserver = new MutationObserver(updateSize);
    // Install the observer
    observer.observe(content, {childList: true});
    // Call for the first time
    updateSize();
    // Cleanup ...
    return () => observer.disconnect();
  }, [content]);*/
  const style: CSSProperties | undefined = toStyle(props.geometry);
  return (
    <div className={classes} ref={container} style={style}>
      <DefaultWindowButtons onClose={props.onClose} onMinimize={props.onMinimize}/>
      <div className={'content'} ref={setMoveHandle}>
        {props.children}
      </div>
      <div className={'horizontal resize-handle left'} ref={setLeftResizeHandle}/>
      <div className={'horizontal resize-handle right'} ref={setRightResizeHandle}/>
      <div className={'vertical resize-handle bottom'} ref={setBottomResizeHandle}/>
      <div className={'vertical resize-handle top'} ref={setTopResizeHandle}/>
    </div>
  );
};
