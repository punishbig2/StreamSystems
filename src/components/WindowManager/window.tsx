import {DefaultWindowButtons} from 'components/DefaultWindowButtons';
import {useObjectGrabber} from 'hooks/useObjectGrabber';
import React, {CSSProperties, ReactElement, useRef} from 'react';

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

export const WindowElement: React.FC<Props> = (props: Props): ReactElement => {
  const {onGeometryChange, area} = props;
  const container: React.MutableRefObject<HTMLDivElement | null> = useRef<HTMLDivElement | null>(null);
  // Moving object, the handle is the whole window
  const [isGrabbed, setMoveHandle] = useObjectGrabber(container, onMove(area, onGeometryChange));
  // These installs all the resize handles
  const [, setBottomResizeHandle] = useObjectGrabber(container, onResize(area, onGeometryChange, 'bottom'));
  const [, setTopResizeHandle] = useObjectGrabber(container, onResize(area, onGeometryChange, 'top'));
  const [, setRightResizeHandle] = useObjectGrabber(container, onResize(area, onGeometryChange, 'right'));
  const [, setLeftResizeHandle] = useObjectGrabber(container, onResize(area, onGeometryChange, 'left'));
  // Compute the style
  const style: CSSProperties | undefined = toStyle(props.geometry);
  const classes: string = ['window-element', isGrabbed ? 'grabbed' : null, props.isMinimized ? 'minimized' : null]
    .join(' ')
    .trim();
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
