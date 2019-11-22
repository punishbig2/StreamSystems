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

const addWindow = (window: Window, state: WorkspaceState): { [key: string]: Window } => {
  const windows: { [id: string]: Window } = state.windows;
  // Return the new state
  return {...windows, [window.id]: window};
};

const moveWindow = ({id, geometry}: { id: string, geometry: ClientRect }, state: WorkspaceState): { [key: string]: Window } => {
  const windows: { [id: string]: Window } = state.windows;
  return {...windows, [id]: {...windows[id], geometry}};
};

export const createWorkspaceReducer = (id: string, initialState: WorkspaceState = genesisState) => {
  return (state: WorkspaceState = initialState, {type, data}: AnyAction): WorkspaceState => {
    switch (type) {
      case $$(id, WorkspaceActions.MinimizeWindow):
        return {...state, windows: minimizeWindow(data, state)};
      case $$(id, WorkspaceActions.AddWindow):
        return {...state, windows: addWindow(data, state)};
      case $$(id, WorkspaceActions.UpdateGeometry):
        return {...state, windows: moveWindow(data, state)};
      case $$(id, WorkspaceActions.RemoveWindow):
        return {...state, windows: removeWindow(data, state)};
      case $$(id, WorkspaceActions.RestoreWindow):
        return {...state, windows: restoreWindow(data, state)};
      default:
        return state;
    }
  };
};

