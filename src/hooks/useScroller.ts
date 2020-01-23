import React, { useCallback, useEffect, useReducer } from "react";
import { createAction } from "redux/actionCreator";

const cancelEvent = (event: Event | React.SyntheticEvent) => {
  event.stopPropagation();
  event.preventDefault();
};

interface State {
  value: number;
  grabbedAt: number | null;
}

enum ScrollerActions {
  Update,
  Grab,
  Release
}

const reducer = (
  state: State,
  { type, data }: { type: ScrollerActions; data: any }
): State => {
  switch (type) {
    case ScrollerActions.Update:
      return { ...state, value: state.value + data };
    case ScrollerActions.Grab:
      return { ...state, grabbedAt: data };
    case ScrollerActions.Release:
      return { ...state, grabbedAt: null };
    default:
      return state;
  }
};

const useMoveHandler = (
  grabbedAt: number | null,
  onUpdated: (value: number) => void,
  onReleased: () => void
) => {
  useEffect(() => {
    let offset: number | null = grabbedAt;
    let timer: number = setTimeout(() => null, 0);
    if (offset === null) return;
    // Capture mouse moves
    const onMove = (event: MouseEvent) => {
      // Compute movement
      const movement: number = event.clientY - (offset as number);
      // Cancel the original event
      cancelEvent(event);
      // Remove previous timer
      clearTimeout(timer);
      // Create a new timer
      timer = setTimeout(() => {
        // Update internally kept offset
        offset = event.clientY;
        // Call the updater callback
        onUpdated(movement);
      }, 0);
    };
    // If the mouse is released we should stop everything
    const onRelease = (event: MouseEvent) => {
      // Cancel the original event please
      cancelEvent(event);
      // Disconnect listeners
      document.removeEventListener("mouseup", onRelease);
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseleave", onRelease);
      // Release the slider
      onReleased();
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseleave", onRelease);
    document.addEventListener("mouseup", onRelease);
    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onRelease);
      document.removeEventListener("mouseleave", onRelease);
    };
  }, [grabbedAt, onReleased, onUpdated]);
};

export const useScroller = (
  reference: React.MutableRefObject<HTMLDivElement | null>
): [number, number] => {
  const [state, dispatch] = useReducer(reducer, { value: 0, grabbedAt: null });
  const { grabbedAt } = state;
  // Get a reference to the reference :D
  const slider: HTMLElement | null = reference.current;

  const getMax = useCallback((): number => {
    const getSliderHeight = () => {
      if (slider === null) return 0;
      return slider.offsetHeight;
    };

    const getParentHeight = () => {
      if (slider === null) return 0;
      const parent: (Node & ParentNode) | null = slider.parentNode;
      if (parent === null) return 0;
      const element: HTMLElement = parent as HTMLElement;
      // Return the offset height of the element
      return element.offsetHeight;
    };

    const parentHeight: number = getParentHeight();
    const sliderHeight: number = getSliderHeight();
    if (parentHeight === 0 || sliderHeight === 0) return 0;
    return parentHeight - sliderHeight;
  }, [slider]);

  const onUpdated = useCallback(
    (value: number) => dispatch(createAction(ScrollerActions.Update, value)),
    []
  );
  const onReleased = useCallback(
    () => dispatch(createAction(ScrollerActions.Release)),
    []
  );
  // Add the move effect
  useMoveHandler(grabbedAt, onUpdated, onReleased);

  useEffect(() => {
    if (slider === null) return;
    const onGrab = (event: MouseEvent) => {
      cancelEvent(event);
      // Update internal state
      dispatch(createAction(ScrollerActions.Grab, event.clientY));
    };
    slider.addEventListener("mousedown", onGrab, true);
    return () => slider.removeEventListener("mousedown", onGrab, true);
  }, [slider]);

  const max: number = getMax();
  const offset: number = Math.max(Math.min(state.value, max), 0);
  return [offset / max, offset];
};
