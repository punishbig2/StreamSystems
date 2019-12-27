import React, {Children, useEffect, useRef, useState} from 'react';
import Scrollbars from 'react-custom-scrollbars';

interface Props {
  className: string;
  itemSize: number;
}

export const VirtualScroll: React.FC<React.PropsWithChildren<Props>> = (props: React.PropsWithChildren<Props>) => {
  const {itemSize} = props;
  const [offset, setOffset] = useState<number>(0);
  const [visibleCount, setVisibleCount] = useState<number>(0);
  const [height, setHeight] = useState<number>(0);
  const reference: React.MutableRefObject<HTMLDivElement | null> = useRef<HTMLDivElement>(null);

  const array = Children.toArray(props.children);
  useEffect(() => {
    if (reference.current === null)
      return;
    const element: HTMLDivElement = reference.current;
    const parent: (Node & ParentNode) | null = element.parentNode;
    if (parent === null)
      return;
    const observable: HTMLElement | null = parent.parentElement;
    if (observable === null)
      return;
    const observer = new ResizeObserver((entries: readonly ResizeObserverEntry[]) => {
      if (entries.length !== 1)
        return;
      const {contentRect} = entries[0];
      const {style} = element;
      if (contentRect.height !== observable.offsetHeight) {
        style.height = 'auto';
        const child: HTMLDivElement | null = element.querySelector('.tbody-scrollable-content');
        if (child !== null) {
          const {style} = child;
          style.height = 'auto';
        }
        setHeight(element.offsetHeight);
        if (child !== null) {
          const {style} = child;
          style.height = `${element.offsetHeight}px`;
        }
      }
    });
    // Start with the initial size
    setHeight(element.offsetHeight);
    // Watch for resizing ...
    observer.observe(observable);
    return () => observer.disconnect();
  }, [reference]);
  useEffect(() => {
    setVisibleCount(height / itemSize);
  }, [height, itemSize]);
  const onScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const {currentTarget} = event;
    const offset: number = Math.round(currentTarget.scrollTop / itemSize);
    // Clear old timeout
    setOffset(offset);
  };
  const preHeight: number = itemSize * (offset - 1);
  const postHeight: number = itemSize * (array.length - visibleCount - offset);
  // TODO: use a scrollbar that is guaranteed to be overlay
  return (
    <div className={props.className} ref={reference}>
      <div className={'tbody-scrollable-content'} style={{height}} onScroll={onScroll}>
        <div className={'tbody-fill-area pre'} style={{height: Math.max(preHeight, 0)}}/>
        {offset > 0 ? array[offset - 1] : null}
        {array.slice(offset, offset + visibleCount + 1)}
        <div className={'tbody-fill-area post'} style={{height: Math.max(postHeight, 0)}}/>
      </div>
    </div>
  );
};
