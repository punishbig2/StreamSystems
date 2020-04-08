/*import { WorkspaceActions } from 'redux/constants/workspaceConstants';
import { WorkspaceState, STRM } from 'redux/stateDefs/workspaceState';
import { equal } from 'utils/equal';
import { UserProfileActions } from 'redux/reducers/userProfileReducer';
import { FXOAction, ActionKind } from 'redux/fxo-action';
import { PodTileAction, podTileReducer } from 'redux/reducers/podTileReducer';
import { WindowState } from 'redux/stateDefs/windowState';
import { WindowTypes } from 'redux/constants/workareaConstants';

export interface WorkspaceAction {
  workspaceID: string;
}

const initialState: WorkspaceState = {
  id: '',
  name: '',
  windows: {},
  toast: null,
  isDefaultWorkspace: false,
  isUserProfileModalVisible: false,
  markets: [],
  errorMessage: null,
  personality: STRM,
};

const minimizeWindow = (id: string, state: WorkspaceState): { [key: string]: WindowState } => {
  const windows: { [id: string]: WindowState } = { ...state.windows };
  const geometry: ClientRect = windows[id].geometry;
  if (windows[id].minimized) {
    const savedSize: { width: number, height: number } | null = windows[id].savedSize;
    if (savedSize === null)
      throw new Error('minimized windows MUST save their size');
    const finalGeometry: ClientRect = new DOMRect(geometry.left, geometry.top, savedSize.width, savedSize.height);
    // Return the resulting object
    return { ...windows, [id]: { ...windows[id], minimized: false, geometry: finalGeometry, savedSize: null } };
  } else {
    const savedSize: { width: number, height: number } = {
      height: geometry.height,
      width: geometry.width,
    };
    return { ...windows, [id]: { ...windows[id], minimized: true, savedSize } };
  }
};

const restoreWindow = (id: string, state: WorkspaceState): { [key: string]: WindowState } => {
  const windows: { [id: string]: WindowState } = { ...state.windows };
  if (!windows[id].minimized)
    return windows;
  return { ...windows, [id]: { ...windows[id], minimized: false } };
};

const removeWindow = (id: string, state: WorkspaceState): { [key: string]: WindowState } => {
  const windows: { [id: string]: WindowState } = { ...state.windows };
  // Remove it from the copy
  delete windows[id];
  // Return the new state
  return windows;
};

const setWindowAutoSize = ({ id }: { id: string; title: string }, state: WorkspaceState): { [key: string]: WindowState } => {
  const windows: { [id: string]: WindowState } = state.windows;
  if (windows[id].fitContent)
    return windows;
  return { ...windows, [id]: { ...windows[id], fitContent: true } };
};

const setWindowTitle = ({ id, title }: { id: string; title: string }, state: WorkspaceState): { [key: string]: WindowState } => {
  const windows: { [id: string]: WindowState } = state.windows;
  if (windows[id].title === title)
    return windows;
  return { ...windows, [id]: { ...windows[id], title } };
};

const addWindow = (workspaceID: string, window: WindowState, state: WorkspaceState): { [key: string]: WindowState } => {
  const windows: { [id: string]: WindowState } = state.windows;
  // Return the new state
  return { ...windows, [window.id]: window };
};

const updateAllGeometries = (workspaceID: string, geometries: { [id: string]: ClientRect }, state: WorkspaceState): { [key: string]: WindowState } => {
  const windows: { [id: string]: WindowState } = state.windows;
  const keys: string[] = Object.keys(geometries);
  return keys.reduce((updatedWindows: { [key: string]: WindowState }, id: string) => {
    updatedWindows[id] = { ...windows[id], geometry: geometries[id] };
    return updatedWindows;
  }, {});
};

const updateWindowGeometry = ({ id, geometry, resized }: { id: string; geometry: ClientRect; resized: boolean }, state: WorkspaceState): { [key: string]: WindowState } => {
  const windows: { [id: string]: WindowState } = state.windows;
  const original: WindowState = windows[id];
  if (equal(original.geometry, geometry)) {
    return windows;
  }
  const fitContent: boolean = original.fitContent && !resized;
  // We know that at least the geometry changed
  return { ...windows, [id]: { ...original, geometry, fitContent } };
};

const bringToFront = ({ id }: { id: string }, state: WorkspaceState): { [key: string]: WindowState } => {
  const getMaxZIndex = (windows: { [key: string]: WindowState }) => {
    const values: WindowState[] = Object.values(windows);
    return Math.max(
      ...values.map((w: WindowState) => (w.zIndex !== undefined ? w.zIndex : -1)),
    );
  };
  const entries: [string, WindowState][] = Object.entries(state.windows);
  const reorderedWindows = entries.reduce(
    (windows: { [key: string]: WindowState }, [key, window]: [string, WindowState]) => {
      if (key === id) return windows;
      const maxZIndex: number = getMaxZIndex(windows);
      windows[key] = { ...window, zIndex: 1 + maxZIndex };
      // Return the new object
      return windows;
    },
    {},
  );
  if (equal(reorderedWindows, state.windows))
    return state.windows;
  // Nothing changed
  return {
    ...reorderedWindows,
    [id]: { ...state.windows[id], zIndex: getMaxZIndex(reorderedWindows) },
  };
};

type ActionType = FXOAction<WorkspaceActions & UserProfileActions, WorkspaceAction> & PodTileAction;

const nextReducer = (state: WorkspaceState = initialState, action: ActionType): WorkspaceState => {
  if (action.kind === ActionKind.Window) {
    const windows: { [id: string]: WindowState } = state.windows;
    const id: string = action.windowID;
    const window: WindowState = windows[id];
    if (window === undefined)
      return state; // Probably not my window?
    if (window.type === WindowTypes.PodTile) {
      return {
        ...state,
        windows: {
          ...windows,
          [id]: podTileReducer(window, action),
        },
      };
    } else if (window.type === WindowTypes.MessageBlotter) {
      return {
        ...state,
        windows: {
          ...windows,
          [id]: podTileReducer(window, action),
        },
      };
    } else {
      return state;
    }
  } else {
    return state;
  }
};

export const workspaceReducer = (state: WorkspaceState = initialState, action: ActionType): WorkspaceState => {
  const { type, data, workspaceID } = action;
  switch (type) {
    case WorkspaceActions.SetWindowAutoSize:
      return { ...state, windows: setWindowAutoSize(data, state), isDefaultWorkspace: false };
    case WorkspaceActions.SetWindowTitle:
      return { ...state, windows: setWindowTitle(data, state) };
    case WorkspaceActions.MinimizeWindow:
      return { ...state, windows: minimizeWindow(data, state), isDefaultWorkspace: false };
    case WorkspaceActions.AddWindow:
      return { ...state, windows: addWindow(workspaceID, data, state), isDefaultWorkspace: false };
    case WorkspaceActions.UpdateAllGeometries:
      return { ...state, windows: updateAllGeometries(workspaceID, data, state) };
    case WorkspaceActions.UpdateGeometry:
      return { ...state, windows: updateWindowGeometry(data, state) };
    case WorkspaceActions.RemoveWindow:
      return { ...state, windows: removeWindow(data, state), isDefaultWorkspace: false };
    case WorkspaceActions.RestoreWindow:
      return { ...state, windows: restoreWindow(data, state), isDefaultWorkspace: false };
    case WorkspaceActions.BringToFront:
      return { ...state, windows: bringToFront(data, state), isDefaultWorkspace: false };
    case WorkspaceActions.ShowToast:
      return { ...state, toast: data };
    case WorkspaceActions.UpdateMarkets:
      return { ...state, markets: data };
    case WorkspaceActions.SetPersonality:
      return { ...state, personality: data, isDefaultWorkspace: false };
    case WorkspaceActions.ShowUserProfileModal:
      return { ...state, isUserProfileModalVisible: data };
    case WorkspaceActions.ShowError:
      return { ...state, errorMessage: data };
    case WorkspaceActions.CloseErrorModal:
      return { ...state, errorMessage: null };
    default:
      return nextReducer(state, action);
  }
};*/

export const WorkspaceReducerModule = null;
