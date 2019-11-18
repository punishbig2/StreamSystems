import React, {useCallback, useEffect, useReducer} from 'react';
import {createAction} from 'redux/actionCreator';

const cancelEvent = (event: Event | React.SyntheticEvent) => {
  event.stopPropagation();
  event.preventDefault();
};

interface State {
  grabbed: boolean;
  offset: number;
  position: number;
}

const reducer = (state: State, {type, data}: { type: string, data: any }): State => {
  switch (type) {
    case 'update':
      return {...state, ...data};
    case 'grab':
      return {...state, grabbed: true, offset: data};
    case 'ungrab':
      return {...state, grabbed: false};
    default:
      return state;
  }
};

export const useScroller = (reference: React.MutableRefObject<HTMLDivElement | null>): number => {
  const [state, dispatch] = useReducer(reducer, {position: 0, grabbed: false, offset: 0});
  // Get a reference to the reference :D
  const slider: HTMLElement | null = reference.current;
  // Effects ...
  const nextPosition = useCallback((value: number): number => {
    if (slider === null)
      return 0;
    const parent: HTMLDivElement | null = slider.parentNode as HTMLDivElement | null;
    if (parent === null)
      return 0;
    return Math.max(Math.min(value, parent.offsetHeight - slider.offsetHeight), 0);
  }, [slider]);
  useEffect(() => {
    if (!state.grabbed)
      return;
    // Capture mouse moves
    const onMove = (event: MouseEvent) => {
      // Compute movement
      const movement: number = event.clientY - state.offset;
      // Cancel the original event
      cancelEvent(event);
      // Update the position
      dispatch(createAction('update', {position: nextPosition(state.position + movement), offset: event.clientY}));
    };
    // If the mouse is released we should stop everything
    const onRelease = (event: MouseEvent) => {
      // Cancel the original event please
      cancelEvent(event);
      // Disconnect listeners
      document.removeEventListener('mouseup', onRelease);
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseleave', onRelease);
      // Unset grabbed
      dispatch(createAction('ungrab'));
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseleave', onRelease);
    document.addEventListener('mouseup', onRelease);
    return () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onRelease);
      document.removeEventListener('mouseleave', onRelease);
    };
  }, [nextPosition, state]);
  useEffect(() => {
    if (slider === null)
      return;
    const onGrab = (event: MouseEvent) => {
      cancelEvent(event);
      // Update internal state
      dispatch(createAction('grab', event.clientY));
    };
    slider.addEventListener('mousedown', onGrab, true);
    return () => slider.removeEventListener('mousedown', onGrab, true);
  }, [slider]);
  return state.position;
};
