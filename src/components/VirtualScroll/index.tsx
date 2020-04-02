import React, { Children, useEffect, useRef, useState } from 'react';

interface Props {
  className: string;
  itemSize: number;
}

export const VirtualScroll: React.FC<React.PropsWithChildren<Props>> = (
  props: React.PropsWithChildren<Props>,
) => {
  const { itemSize } = props;
  const [offset, setOffset] = useState<number>(0);
  const [visibleCount, setVisibleCount] = useState<number>(0);
  const [height, setHeight] = useState<number>(0);

  const reference: React.MutableRefObject<HTMLDivElement | null> = useRef<HTMLDivElement>(null);

  const array = Children.toArray(props.children);
  useEffect(() => {
    if (reference.current === null)
      return;
    const element: HTMLDivElement = reference.current;
    let parent: (Node & ParentNode) | null = element.parentNode;
    if (parent === null)
      return;
    parent = parent.parentElement;
    if (parent === null)
      return;
    const observable: HTMLElement | null = parent.parentElement;
    if (observable === null)
      return;
    const content: HTMLDivElement | null = element.querySelector('.tbody-scrollable-content');
    const scrollbar: HTMLDivElement | null = element.querySelector('.scrollbar-container');

    const setupScrollbar = (content: HTMLDivElement, scrollbar: HTMLDivElement) => {
      const ratio: number = content.offsetHeight / content.scrollHeight;
      const classes: DOMTokenList = scrollbar.classList;
      const size: number = ratio * content.offsetHeight;
      const handle: HTMLDivElement | null = scrollbar.querySelector('.handle');
      if (handle === null)
        throw new Error('scrollbars MUST have a handle');
      const style: CSSStyleDeclaration = handle.style;
      if (ratio >= 1) {
        classes.add('hidden');
      } else {
        classes.remove('hidden');
      }
      style.height = `${size}px`;
    };

    setTimeout(() => {
      if (content !== null && scrollbar !== null) {
        setupScrollbar(content, scrollbar);
      }
    });

    const onMouseMove = (event: MouseEvent) => {
      event.preventDefault();
      event.stopPropagation();
      if (scrollbar !== null) {
        const handle: HTMLDivElement | null = scrollbar.querySelector('.handle');
        const padding: number = 3;
        if (handle !== null) {
          const style: CSSStyleDeclaration = handle.style;
          const top: number = handle.offsetTop;
          const maxTop = scrollbar.offsetHeight - handle.offsetHeight - padding - 2;
          const newTop: number = Math.min(Math.max(padding, top + event.movementY), maxTop);
          style.top = `${newTop}px`;
          if (content !== null) {
            content.scrollTop = ((newTop - padding) / (maxTop - padding - 2)) * (content.scrollHeight - content.offsetHeight);
          }
        }
      }
    };

    const onGrabHandle = (event: MouseEvent) => {
      const onMouseUp = () => {
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
      };
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    };

    const installMouseHandlers = () => {
      if (scrollbar !== null) {
        const handle: HTMLDivElement | null = scrollbar.querySelector('.handle');
        if (handle !== null) {
          handle.addEventListener('mousedown', onGrabHandle);
        }
      }
    };

    const uninstallMouseHandlers = () => {
      if (scrollbar !== null) {
        const handle: HTMLDivElement | null = scrollbar.querySelector('.handle');
        if (handle !== null) {
          handle.removeEventListener('mousedown', onGrabHandle);
        }
      }
    };

    const observer = new ResizeObserver(
      (entries: readonly ResizeObserverEntry[]) => {
        if (entries.length !== 1)
          return;
        if (content !== null) {
          const { style } = content;
          style.height = '0';
        }
        setHeight(element.offsetHeight);
        if (content !== null) {
          const { style } = content;
          style.height = `${element.offsetHeight}px`;
        }
        if (content !== null && scrollbar !== null) {
          setupScrollbar(content, scrollbar);
        }
      },
    );
    const mutationObserver: MutationObserver = new MutationObserver(() => {
      if (content !== null && scrollbar !== null) {
        setupScrollbar(content, scrollbar);
      }
    });
    // Start with the initial size
    setHeight(element.offsetHeight);
    // Watch for resizing ...
    observer.observe(observable);
    mutationObserver.observe(observable, {
      childList: true,
      subtree: true,
    });
    // Install event handlers
    installMouseHandlers();
    return () => {
      uninstallMouseHandlers();
      observer.disconnect();
    };
  }, [reference]);
  useEffect(() => {
    setVisibleCount(Math.max(Math.ceil(height / itemSize), 12));
  }, [height, itemSize]);
  const onScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const { currentTarget } = event;
    const offset: number = Math.round(currentTarget.scrollTop / itemSize);
    // Clear old timeout
    setOffset(offset);
  };
  const preHeight: number = itemSize * (offset - 1);
  const postHeight: number = itemSize * (array.length - visibleCount - offset);
  return (
    <div className={props.className} ref={reference}>
      <div className={'tbody-scrollable-content'} style={{ height }} onScroll={onScroll}>
        <div className={'tbody-fill-area pre'} style={{ height: Math.max(preHeight, 0) }}/>
        {offset > 0 ? array[offset - 1] : null}
        {array.slice(offset, offset + visibleCount + 1)}
        <div className={'tbody-fill-area post'} style={{ height: Math.max(postHeight, 0) }}/>
        <div className={'scrollbar-container'}>
          <div className={'handle'}/>
        </div>
      </div>
    </div>
  );
};
