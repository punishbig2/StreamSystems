import {useObjectGrabber} from 'hooks/objectGrabber';
import React, {CSSProperties, ReactElement, useRef} from 'react';

interface OwnProps {
  onGeometryChange: (geometry: ClientRect) => void;
  geometry?: ClientRect;
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

const newDOMRect = (x: number, y: number, width: number, height: number): DOMRect => {
  return new DOMRect(x < 1 ? 1 : x, y < 1 ? 1 : y, width, height);
};

const onMove = (update: (geometry: ClientRect) => void) =>
  (r: ClientRect, x: number, y: number) => {
    update(newDOMRect(r.left + x, r.top + y, r.width, r.height));
  };

const onResize = (update: (geometry: ClientRect) => void, side: 'top' | 'bottom' | 'left' | 'right') =>
  (r: ClientRect, x: number, y: number) => {
    switch (side) {
      case 'top':
        update(newDOMRect(r.left, r.top + y, r.width, r.height - y));
        break;
      case 'bottom':
        update(newDOMRect(r.left, r.top, r.width, r.height + y));
        break;
      case 'left':
        update(newDOMRect(r.left + x, r.top, r.width - x, r.height));
        break;
      case 'right':
        update(newDOMRect(r.left, r.top, r.width + x, r.height));
        break;
    }
  };

export const WindowElement: React.FC<Props> = (props: Props): ReactElement => {
  const {onGeometryChange} = props;
  const container: React.MutableRefObject<HTMLDivElement | null> = useRef<HTMLDivElement | null>(null);
  // Moving object, the handle is the whole window
  const [isGrabbed, setMoveHandle] = useObjectGrabber(container, onMove(onGeometryChange));
  // These installs all the resize handles
  const [, setBottomResizeHandle] = useObjectGrabber(container, onResize(onGeometryChange, 'bottom'));
  const [, setTopResizeHandle] = useObjectGrabber(container, onResize(onGeometryChange, 'top'));
  const [, setRightResizeHandle] = useObjectGrabber(container, onResize(onGeometryChange, 'right'));
  const [, setLeftResizeHandle] = useObjectGrabber(container, onResize(onGeometryChange, 'left'));
  // Compute the style
  const style: CSSProperties | undefined = toStyle(props.geometry);
  return (
    <div className={'window-element container' + (isGrabbed ? ' grabbed' : '')} ref={container} style={style}>
      <div className={'content'} ref={setMoveHandle}>{props.children}</div>
      <div className={'horizontal resize-handle left'} ref={setLeftResizeHandle}/>
      <div className={'horizontal resize-handle right'} ref={setRightResizeHandle}/>
      <div className={'vertical resize-handle bottom'} ref={setBottomResizeHandle}/>
      <div className={'vertical resize-handle top'} ref={setTopResizeHandle}/>
    </div>
  );
};
