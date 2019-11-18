import React, {useEffect, useState} from 'react';

type DivReference = React.MutableRefObject<HTMLDivElement | null>;

type MoveFn = (x: number, y: number) => void;
type GrabFn = (value: boolean) => void;
const createObjectGrabber = (object: HTMLDivElement, onMove: MoveFn, setGrabbed: GrabFn) => {
  const offset: { x: number, y: number } = {x: 0, y: 0};
  const onMouseMove = (event: MouseEvent) => {
    onMove(event.clientX - offset.x, event.clientY - offset.y);
    // Update offset
    offset.x = event.clientX;
    offset.y = event.clientY;
    // Oh and don't forget to swallow this event completely
    event.stopPropagation();
    event.preventDefault();
  };
  const onGrab = (event: MouseEvent) => {
    if (event.target !== object)
      return;
    event.stopPropagation();
    event.preventDefault();
    // Update offset
    offset.x = event.clientX;
    offset.y = event.clientY;
    const onRelease = () => {
      document.removeEventListener('mousemove', onMouseMove, true);
      document.removeEventListener('mouseup', onRelease, true);
      // Release
      setGrabbed(false);
    };
    document.addEventListener('mousemove', onMouseMove, true);
    document.addEventListener('mouseup', onRelease, true);
    // Grab
    setGrabbed(true);
  };
  object.addEventListener('mousedown', onGrab, true);
  return () => {
    object.removeEventListener('mousedown', onGrab, true);
  };
};

export const useObjectGrabber = (container: DivReference, callback: (geometry: ClientRect, x: number, y: number) => void): [boolean, (element: HTMLDivElement) => void] => {
  const [grabbed, setGrabbed] = useState<boolean>(false);
  const [object, setObject] = useState<HTMLDivElement | null>(null);
  useEffect(() => {
    const element: HTMLDivElement | null = container.current;
    if (object === null || element === null)
      return;
    return createObjectGrabber(object, (x: number, y: number) => {
      const r: ClientRect = new DOMRect(
        element.offsetLeft,
        element.offsetTop,
        element.offsetWidth,
        element.offsetHeight,
      );
      // Call the callback
      callback(r, x, y);
    }, setGrabbed);
  }, [object, container, callback]);
  return [grabbed, setObject];
};

