import { useScrollbarHandleGrabber } from "hooks/useScrollbarHandleGrabber";
import React, { Children } from "react";
import ResizeObserver from "resize-observer-polyfill";

type Props = React.PropsWithChildren<{}>;

export const ScrollArea: React.FC<Props> = (
  props: Props
): React.ReactElement => {
  const [container, setContainer] = React.useState<HTMLElement | null>(null);
  const [scrollbar, setScrollbar] = React.useState<HTMLElement | null>(null);
  const [handle, setHandle] = React.useState<HTMLElement | null>(null);
  useScrollbarHandleGrabber(handle, container);
  const array: ReadonlyArray<React.ReactNode> = Children.toArray<React.ReactNode>(
    props.children
  );
  if (array.length !== 1) {
    throw new Error("scroll areas only make sense with a single child");
  }
  const updateScrollbar = React.useCallback((): void => {
    if (container === null || scrollbar === null || handle === null) return;
    const track = handle.parentElement as HTMLElement;
    const ratio = container.offsetHeight / container.scrollHeight;
    const padding = 2;
    if (ratio < 1) {
      scrollbar.style.visibility = "visible";
      scrollbar.style.top = `${container.offsetTop + padding}px`;
      scrollbar.style.height = `${container.offsetHeight - 2 * padding}px`;
      scrollbar.style.right = "0";
      // Update the handle as well
      const maxScrollTop = container.scrollHeight - container.offsetHeight;
      const maxPosition = track.offsetHeight - handle.offsetHeight;
      const handlePosition = (maxPosition * container.scrollTop) / maxScrollTop;
      handle.style.height = `${100 * ratio}%`;
      handle.style.top = `${handlePosition}px`;
      // TODO: when resizing the scrollTop seems to stay the same
    } else {
      scrollbar.style.visibility = "hidden";
    }
  }, [container, handle, scrollbar]);
  React.useEffect((): void | (() => void) => {
    if (container === null) return;
    const resizeObserver = new ResizeObserver(updateScrollbar);
    const mutateObserver = new MutationObserver(updateScrollbar);
    resizeObserver.observe(container);
    mutateObserver.observe(container, { childList: true });
    return (): void => {
      resizeObserver.disconnect();
      mutateObserver.disconnect();
    };
  }, [container, updateScrollbar]);
  const element = array[0] as React.ReactElement;
  return (
    <>
      {React.cloneElement(element, { ref: setContainer })}
      <div ref={setScrollbar} className={"scrollbar-track"}>
        <div ref={setHandle} className={"scrollbar-handle"} />
      </div>
    </>
  );
};