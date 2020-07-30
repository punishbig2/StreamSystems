import React, {
  Children,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { OverlayScrollbarsComponent } from "overlayscrollbars-react";

interface Props {
  className: string;
  itemSize: number;
}

export const VirtualScroll: React.FC<React.PropsWithChildren<Props>> = (
  props: React.PropsWithChildren<Props>
) => {
  const { itemSize } = props;
  const [offset, setOffset] = useState<number>(0);
  const [visibleCount, setVisibleCount] = useState<number>(0);
  const [height, setHeight] = useState<number>(0);

  const reference: React.MutableRefObject<HTMLDivElement | null> = useRef<
    HTMLDivElement
  >(null);

  const array = Children.toArray(props.children);

  useEffect(() => {
    if (reference.current === null) return;
    const element: HTMLDivElement = reference.current;
    let parent: (Node & ParentNode) | null = element.parentNode;
    if (parent === null) return;
    parent = parent.parentElement;
    if (parent === null) return;
    const observable: HTMLElement | null = parent.parentElement;
    if (observable === null) return;
    const content: HTMLDivElement | null = element.querySelector(
      ".tbody-scrollable-content"
    );

    if (height !== 0) return;

    const resizeObserver = new ResizeObserver(
      (entries: readonly ResizeObserverEntry[]) => {
        if (entries.length !== 1) return;
        if (content !== null) {
          const { style } = content;
          style.height = "0";
        }
        setHeight(element.offsetHeight);
        if (content !== null) {
          const { style } = content;
          style.height = `${element.offsetHeight}px`;
        }
      }
    );
    // Start with the initial size
    setHeight(element.offsetHeight);
    // Watch for resizing ...
    resizeObserver.observe(observable);
    return () => {
      resizeObserver.disconnect();
    };
  }, [reference]);

  useEffect(() => {
    setVisibleCount(Math.max(Math.ceil(height / itemSize), 12));
  }, [height, itemSize]);

  const debounce = (fn: (...args: any[]) => void, duration: number) => {
    let timer = setTimeout(() => undefined, 0);
    return (...args: any[]) => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        fn.apply(null, args);
      }, duration);
    };
  };
  console.log("rendering");
  const debouncedSetOffset = useCallback(debounce(setOffset, 100), []);
  const onScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const target: HTMLDivElement = event.target as HTMLDivElement;
    const offset: number = Math.floor(target.scrollTop / itemSize);
    // This will not immediately, and will be cancelled if
    // it times out
    debouncedSetOffset(offset);
  };

  const preHeight: number = itemSize * (offset - 1);
  const postHeight: number = itemSize * (array.length - visibleCount - offset);
  const classes = [props.className, "scroll-area"];
  const className = classes.join(" ");
  return (
    <div className={props.className} ref={reference}>
      <OverlayScrollbarsComponent className={className} style={{ height }}>
        {array}
        {/*<div
          className={"pre-fill"}
          style={{ height: Math.max(preHeight, 0) }}
        />*/}
        {/* offset > 0 ? array[offset - 1] : null */}
        {/*array.slice(offset, offset + visibleCount + 1)*/}
        {/* <div
          className={"post-fill"}
          style={{ height: Math.max(postHeight, 0) }
        />*/}
      </OverlayScrollbarsComponent>
    </div>
  );
};
