import React from "react";

declare global {
  interface Event {
    swallow(): void;
  }

  interface HTMLElement {
    addClass(name: string): void;

    removeClass(name: string): void;
  }
}

Event.prototype.swallow = function (): void {
  this.stopPropagation();
  this.stopImmediatePropagation();
  this.preventDefault();
};

HTMLElement.prototype.addClass = function (className: string): void {
  const { classList } = this;
  if (classList) {
    classList.add(className);
  }
};

HTMLElement.prototype.removeClass = function (className: string): void {
  const { classList } = this;
  if (classList) {
    classList.remove(className);
  }
};

export const useScrollbarHandleGrabber = (
  handle: HTMLElement | null,
  container: HTMLElement | null
): void => {
  const onStartDrag = React.useCallback(
    (grab: MouseEvent): void => {
      const handle = grab.target as HTMLElement;
      const track: HTMLElement | null = handle.parentElement;
      if (track === null || container === null) return;
      grab.swallow();
      // Stop the event completely
      grab.stopPropagation();
      grab.preventDefault();
      const onMove = (move: MouseEvent): void => {
        const maxScrollTop = container.scrollHeight - container.offsetHeight;
        const newPosition = handle.offsetTop + move.movementY;
        const maxTop = track.offsetHeight - handle.offsetHeight;
        const position = Math.min(Math.max(newPosition, 0), maxTop);
        move.swallow();
        // Update the position of the handle
        handle.style.top = `${position}px`;
        // Let's compute the fraction of the scroll
        const fraction = position / maxTop;
        container.scrollTop = Math.round(fraction * maxScrollTop);
      };
      const onRelease = (): void => {
        document.removeEventListener("mousemove", onMove, true);
        document.removeEventListener("mouseup", onRelease, true);
        handle.removeClass("grabbed");
      };
      document.addEventListener("mousemove", onMove, true);
      document.addEventListener("mouseup", onRelease, true);
      handle.addClass("grabbed");
    },
    [container]
  );
  React.useEffect((): void | (() => void) => {
    if (handle === null) return;
    handle.addEventListener("mousedown", onStartDrag, true);
    return (): void => {
      handle.removeEventListener("mousedown", onStartDrag, true);
    };
  }, [handle, onStartDrag]);
};
