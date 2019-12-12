import {Window} from 'interfaces/window';
import {AnyAction} from 'redux';
import {WorkspaceActions} from 'redux/constants/workspaceConstants';
import {WorkspaceState} from 'redux/stateDefs/workspaceState';
import {$$} from 'utils/stringPaster';

const genesisState: WorkspaceState = {
  windows: {},
};

const minimizeWindow = (id: string, state: WorkspaceState): { [key: string]: Window } => {
  const windows: { [id: string]: Window } = {...state.windows};
  return {...windows, [id]: {...windows[id], minimized: true}};
};

const restoreWindow = (id: string, state: WorkspaceState): { [key: string]: Window } => {
  const windows: { [id: string]: Window } = {...state.windows};
  return {...windows, [id]: {...windows[id], minimized: false}};
};

const removeWindow = (id: string, state: WorkspaceState): { [key: string]: Window } => {
  const windows: { [id: string]: Window } = {...state.windows};
  // Remove it from the copy
  delete windows[id];
  // Return the new state
  return windows;
};

const setWindowAutoSize = ({id}: { id: string, title: string }, state: WorkspaceState): { [key: string]: Window } => {
  const windows: { [id: string]: Window } = state.windows;
  return {...windows, [id]: {...windows[id], autoSize: true}};
};

const setWindowTitle = ({id, title}: { id: string, title: string }, state: WorkspaceState): { [key: string]: Window } => {
  const windows: { [id: string]: Window } = state.windows;
  return {...windows, [id]: {...windows[id], title}};
};

const addWindow = (window: Window, state: WorkspaceState): { [key: string]: Window } => {
  const windows: { [id: string]: Window } = state.windows;
  // Return the new state
  return {...windows, [window.id]: window};
};

const isResizing = (original: Window, geometry: ClientRect): boolean => {
  if (!original.geometry)
    return false;
  const {width, height} = original.geometry;
  return width !== geometry.width || height !== geometry.height;
};

const updateWindowGeometry = ({id, geometry}: { id: string, geometry: ClientRect }, state: WorkspaceState): { [key: string]: Window } => {
  const windows: { [id: string]: Window } = state.windows;
  const original: Window = windows[id];
  // This is only supposed to set the autosize to false if
  // the object is resizing, if it's already false or the object
  // is only moving, there's no need to change it
  const autoSize: boolean = original.autoSize && !isResizing(original, geometry);
  return {...windows, [id]: {...original, geometry, autoSize}};
};

const bringToFront = ({id}: { id: string }, state: WorkspaceState): { [key: string]: Window } => {
  const getMaxZIndex = (windows: { [key: string]: Window }) => {
    const values: Window[] = Object.values(windows);
    return Math.max(...values.map((w: Window) => w.zIndex !== undefined ? w.zIndex : -1));
  };

  const entries: [string, Window][] = Object.entries(state.windows);
  const reorderedWindows = entries
    .reduce((windows: { [key: string]: Window }, [key, window]: [string, Window]) => {
      if (key === id)
        return windows;
      const maxZIndex: number = getMaxZIndex(windows);
      windows[key] = {...window, zIndex: 1 + maxZIndex};
      // Return the new object
      return windows;
    }, {});
  // Nothing changed
  return {...reorderedWindows, [id]: {...state.windows[id], zIndex: getMaxZIndex(reorderedWindows)}};
};

export const createWorkspaceReducer = (id: string, initialState: WorkspaceState = genesisState) => {
  return (state: WorkspaceState = initialState, {type, data}: AnyAction): WorkspaceState => {
    switch (type) {
      case $$(id, WorkspaceActions.SetWindowAutoSize):
        return {...state, windows: setWindowAutoSize(data, state)};
      case $$(id, WorkspaceActions.SetWindowTitle):
        return {...state, windows: setWindowTitle(data, state)};
      case $$(id, WorkspaceActions.MinimizeWindow):
        return {...state, windows: minimizeWindow(data, state)};
      case $$(id, WorkspaceActions.AddWindow):
        return {...state, windows: addWindow(data, state)};
      case $$(id, WorkspaceActions.UpdateGeometry):
        return {...state, windows: updateWindowGeometry(data, state)};
      case $$(id, WorkspaceActions.RemoveWindow):
        return {...state, windows: removeWindow(data, state)};
      case $$(id, WorkspaceActions.RestoreWindow):
        return {...state, windows: restoreWindow(data, state)};
      case $$(id, WorkspaceActions.BringToFront):
        return {...state, windows: bringToFront(data, state)};
      default:
        return state;
    }
  };
};

