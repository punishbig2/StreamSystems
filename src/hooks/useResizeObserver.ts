import {useEffect, useState} from 'react';

export const useResizeObserver = (element: HTMLDivElement | null): [number, number] => {
  const [containerSize, setContainerSize] = useState<number>(0);
  const [contentSize, setContentSize] = useState<number>(0);
  useEffect(() => {
    if (element === null) return;
    if (window.hasOwnProperty('ResizeObserver')) {
      const callback = () => {
        // Update all
        setContainerSize(element.offsetHeight);
        setContentSize(element.scrollHeight);
      };
      const mutateObserver: MutationObserver = new MutationObserver(callback);
      // @ts-ignore
      const resizeObserver: ResizeObserver = new ResizeObserver(callback);
      mutateObserver.observe(element, {childList: true});
      resizeObserver.observe(element);
      return () => {
        resizeObserver.disconnect();
        mutateObserver.disconnect();
      };
    } else {
      throw new Error('please use a recent browser');
    }
  }, [element, contentSize]);
  return [containerSize, contentSize];
};
