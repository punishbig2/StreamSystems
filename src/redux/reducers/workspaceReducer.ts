import { Window } from "interfaces/window";
import { AnyAction } from "redux";
import { WorkspaceActions } from "redux/constants/workspaceConstants";
import {
  ToolbarState,
  WorkspaceState,
  STRM
} from "redux/stateDefs/workspaceState";
import { equal } from "utils/equal";
import { $$ } from "utils/stringPaster";

const genesisState: WorkspaceState = {
  windows: {},
  toast: null,
  toolbarState: {
    pinned: false,
    hovering: false,
    visible: false
  },
  isUserProfileModalVisible: false,
  markets: [],
  errorMessage: null,
  personality: STRM
};

const minimizeWindow = (
  id: string,
  state: WorkspaceState
): { [key: string]: Window } => {
  const windows: { [id: string]: Window } = { ...state.windows };
  if (windows[id].minimized) return windows;
  return { ...windows, [id]: { ...windows[id], minimized: true } };
};

const restoreWindow = (
  id: string,
  state: WorkspaceState
): { [key: string]: Window } => {
  const windows: { [id: string]: Window } = { ...state.windows };
  if (!windows[id].minimized) return windows;
  return { ...windows, [id]: { ...windows[id], minimized: false } };
};

const removeWindow = (
  id: string,
  state: WorkspaceState
): { [key: string]: Window } => {
  const windows: { [id: string]: Window } = { ...state.windows };
  // Remove it from the copy
  delete windows[id];
  // Return the new state
  return windows;
};

const setWindowAutoSize = (
  { id }: { id: string; title: string },
  state: WorkspaceState
): { [key: string]: Window } => {
  const windows: { [id: string]: Window } = state.windows;
  if (windows[id].autoSize) return windows;
  return { ...windows, [id]: { ...windows[id], autoSize: true } };
};

const setWindowTitle = (
  { id, title }: { id: string; title: string },
  state: WorkspaceState
): { [key: string]: Window } => {
  const windows: { [id: string]: Window } = state.windows;
  if (windows[id].title === title) return windows;
  return { ...windows, [id]: { ...windows[id], title } };
};

const addWindow = (
  workspaceID: string,
  window: Window,
  state: WorkspaceState
): { [key: string]: Window } => {
  const windows: { [id: string]: Window } = state.windows;
  // Return the new state
  return { ...windows, [window.id]: window };
};

const updateWindowGeometry = (
  {
    id,
    geometry,
    resized
  }: { id: string; geometry: ClientRect; resized: boolean },
  state: WorkspaceState
): { [key: string]: Window } => {
  const windows: { [id: string]: Window } = state.windows;
  const original: Window = windows[id];
  if (equal(original.geometry, geometry)) {
    return windows;
  }
  const autoSize: boolean = original.autoSize && !resized;
  // We know that at least the geometry changed
  return { ...windows, [id]: { ...original, geometry, autoSize } };
};

const bringToFront = (
  { id }: { id: string },
  state: WorkspaceState
): { [key: string]: Window } => {
  const getMaxZIndex = (windows: { [key: string]: Window }) => {
    const values: Window[] = Object.values(windows);
    return Math.max(
      ...values.map((w: Window) => (w.zIndex !== undefined ? w.zIndex : -1))
    );
  };
  const entries: [string, Window][] = Object.entries(state.windows);
  const reorderedWindows = entries.reduce(
    (windows: { [key: string]: Window }, [key, window]: [string, Window]) => {
      if (key === id) return windows;
      const maxZIndex: number = getMaxZIndex(windows);
      windows[key] = { ...window, zIndex: 1 + maxZIndex };
      // Return the new object
      return windows;
    },
    {}
  );
  if (equal(reorderedWindows, state.windows)) return state.windows;
  // Nothing changed
  return {
    ...reorderedWindows,
    [id]: { ...state.windows[id], zIndex: getMaxZIndex(reorderedWindows) }
  };
};

const toolbarReducer = (
  state: ToolbarState,
  { type }: AnyAction
): ToolbarState => {
  switch (type) {
    case WorkspaceActions.ToolbarTryShow:
      return { ...state, hovering: true };
    case WorkspaceActions.ToolbarShow:
      return { ...state, visible: true, hovering: false };
    case WorkspaceActions.ToolbarHide:
      return { ...state, visible: false, hovering: false };
    case WorkspaceActions.ToolbarTogglePin:
      return { ...state, pinned: !state.pinned };
    default:
      return state;
  }
};

export const createWorkspaceReducer = (
  id: string,
  initialState: WorkspaceState = genesisState
) => {
  return (
    state: WorkspaceState = initialState,
    { type, data }: AnyAction
  ): WorkspaceState => {
    switch (type) {
      case $$(id, WorkspaceActions.SetWindowAutoSize):
        return { ...state, windows: setWindowAutoSize(data, state) };
      case $$(id, WorkspaceActions.SetWindowTitle):
        return { ...state, windows: setWindowTitle(data, state) };
      case $$(id, WorkspaceActions.MinimizeWindow):
        return { ...state, windows: minimizeWindow(data, state) };
      case $$(id, WorkspaceActions.AddWindow):
        return { ...state, windows: addWindow(id, data, state) };
      case $$(id, WorkspaceActions.UpdateGeometry):
        return { ...state, windows: updateWindowGeometry(data, state) };
      case $$(id, WorkspaceActions.RemoveWindow):
        return { ...state, windows: removeWindow(data, state) };
      case $$(id, WorkspaceActions.RestoreWindow):
        return { ...state, windows: restoreWindow(data, state) };
      case $$(id, WorkspaceActions.BringToFront):
        return { ...state, windows: bringToFront(data, state) };
      case $$(id, WorkspaceActions.Toast):
        return { ...state, toast: data };
      case $$(id, WorkspaceActions.ToolbarTryShow):
        return {
          ...state,
          toolbarState: toolbarReducer(state.toolbarState, {
            type: WorkspaceActions.ToolbarTryShow,
            data
          })
        };
      case $$(id, WorkspaceActions.ToolbarShow):
        return {
          ...state,
          toolbarState: toolbarReducer(state.toolbarState, {
            type: WorkspaceActions.ToolbarShow,
            data
          })
        };
      case $$(id, WorkspaceActions.ToolbarHide):
        return {
          ...state,
          toolbarState: toolbarReducer(state.toolbarState, {
            type: WorkspaceActions.ToolbarHide,
            data
          })
        };
      case $$(id, WorkspaceActions.ToolbarTogglePin):
        return {
          ...state,
          toolbarState: toolbarReducer(state.toolbarState, {
            type: WorkspaceActions.ToolbarTogglePin,
            data
          })
        };
      case $$(id, WorkspaceActions.UpdateMarkets):
        return { ...state, markets: data };
      case $$(id, WorkspaceActions.SetPersonality):
        return { ...state, personality: data };
      case $$(id, WorkspaceActions.SetUserProfileModalVisible):
        return { ...state, isUserProfileModalVisible: data };
      case $$(id, WorkspaceActions.ShowError):
        return { ...state, errorMessage: data };
      case $$(id, WorkspaceActions.CloseErrorModal):
        return { ...state, errorMessage: null };
      default:
        return state;
    }
  };
};
