import {Window} from 'interfaces/window';
import {WorkspaceActions} from 'redux/constants/workspaceConstants';
import {WorkspaceState, STRM} from 'redux/stateDefs/workspaceState';
import {equal} from 'utils/equal';
import {UserProfileActions} from 'redux/reducers/userProfileReducer';
import {FXOAction} from 'redux/fxo-action';

export interface WorkspaceAction {
  workspaceID: string;
}

const initialState: WorkspaceState = {
  id: '',
  name: '',
  windows: {},
  toast: null,
  toolbarState: {
    pinned: false,
    hovering: false,
    visible: false,
  },
  isUserProfileModalVisible: false,
  markets: [],
  errorMessage: null,
  personality: STRM,
};

const minimizeWindow = (id: string, state: WorkspaceState): { [key: string]: Window } => {
  const windows: { [id: string]: Window } = {...state.windows};
  if (windows[id].minimized) return windows;
  return {...windows, [id]: {...windows[id], minimized: true}};
};

const restoreWindow = (id: string, state: WorkspaceState): { [key: string]: Window } => {
  const windows: { [id: string]: Window } = {...state.windows};
  if (!windows[id].minimized) return windows;
  return {...windows, [id]: {...windows[id], minimized: false}};
};

const removeWindow = (id: string, state: WorkspaceState): { [key: string]: Window } => {
  const windows: { [id: string]: Window } = {...state.windows};
  // Remove it from the copy
  delete windows[id];
  // Return the new state
  return windows;
};

const setWindowAutoSize = ({id}: { id: string; title: string }, state: WorkspaceState): { [key: string]: Window } => {
  const windows: { [id: string]: Window } = state.windows;
  if (windows[id].autoSize) return windows;
  return {...windows, [id]: {...windows[id], autoSize: true}};
};

const setWindowTitle = ({id, title}: { id: string; title: string }, state: WorkspaceState): { [key: string]: Window } => {
  const windows: { [id: string]: Window } = state.windows;
  if (windows[id].title === title) return windows;
  return {...windows, [id]: {...windows[id], title}};
};

const addWindow = (workspaceID: string, window: Window, state: WorkspaceState): { [key: string]: Window } => {
  const windows: { [id: string]: Window } = state.windows;
  // Return the new state
  return {...windows, [window.id]: window};
};

const updateWindowGeometry = ({id, geometry, resized}: { id: string; geometry: ClientRect; resized: boolean }, state: WorkspaceState): { [key: string]: Window } => {
  const windows: { [id: string]: Window } = state.windows;
  const original: Window = windows[id];
  if (equal(original.geometry, geometry)) {
    return windows;
  }
  const autoSize: boolean = original.autoSize && !resized;
  // We know that at least the geometry changed
  return {...windows, [id]: {...original, geometry, autoSize}};
};
const bringToFront = ({id}: { id: string }, state: WorkspaceState): { [key: string]: Window } => {
  const getMaxZIndex = (windows: { [key: string]: Window }) => {
    const values: Window[] = Object.values(windows);
    return Math.max(
      ...values.map((w: Window) => (w.zIndex !== undefined ? w.zIndex : -1)),
    );
  };
  const entries: [string, Window][] = Object.entries(state.windows);
  const reorderedWindows = entries.reduce(
    (windows: { [key: string]: Window }, [key, window]: [string, Window]) => {
      if (key === id) return windows;
      const maxZIndex: number = getMaxZIndex(windows);
      windows[key] = {...window, zIndex: 1 + maxZIndex};
      // Return the new object
      return windows;
    },
    {},
  );
  if (equal(reorderedWindows, state.windows)) return state.windows;
  // Nothing changed
  return {
    ...reorderedWindows,
    [id]: {...state.windows[id], zIndex: getMaxZIndex(reorderedWindows)},
  };
};

type ActionType = FXOAction<WorkspaceActions & UserProfileActions, WorkspaceAction>;
export const workspaceReducer = (state: WorkspaceState = initialState, action: ActionType): WorkspaceState => {
  const {type, data, workspaceID} = action;
  switch (type) {
    case WorkspaceActions.SetWindowAutoSize:
      return {...state, windows: setWindowAutoSize(data, state)};
    case WorkspaceActions.SetWindowTitle:
      return {...state, windows: setWindowTitle(data, state)};
    case WorkspaceActions.MinimizeWindow:
      return {...state, windows: minimizeWindow(data, state)};
    case WorkspaceActions.AddWindow:
      return {...state, windows: addWindow(workspaceID, data, state)};
    case WorkspaceActions.UpdateGeometry:
      return {...state, windows: updateWindowGeometry(data, state)};
    case WorkspaceActions.RemoveWindow:
      return {...state, windows: removeWindow(data, state)};
    case WorkspaceActions.RestoreWindow:
      return {...state, windows: restoreWindow(data, state)};
    case WorkspaceActions.BringToFront:
      return {...state, windows: bringToFront(data, state)};
    case WorkspaceActions.Toast:
      return {...state, toast: data};
    case UserProfileActions.SetUserProfile:
      return {...state};
    case WorkspaceActions.UpdateMarkets:
      return {...state, markets: data};
    case WorkspaceActions.SetPersonality:
      return {...state, personality: data};
    case WorkspaceActions.SetUserProfileModalVisible:
      return {...state, isUserProfileModalVisible: data};
    case WorkspaceActions.ShowError:
      return {...state, errorMessage: data};
    case WorkspaceActions.CloseErrorModal:
      return {...state, errorMessage: null};
    default:
      return state;
  }
};
