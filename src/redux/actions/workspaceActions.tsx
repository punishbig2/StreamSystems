import {WorkspaceWindow} from 'components/Workspace/workspaceWindow';
import {Action} from 'redux/action';
import {createAction} from 'redux/actionCreator';
import {WindowTypes} from 'redux/constants/workareaConstants';
import {WorkspaceActions} from 'redux/constants/workspaceConstants';
import {createWindowReducer} from 'redux/reducers/tobReducer';
import {DefaultWindowState} from 'redux/stateDefs/windowState';
import {injectNamedReducer, removeNamedReducer} from 'redux/store';
import {$$} from 'utils/stringPaster';

export const removeWindow = (id: string, windowId: string): Action<string> => {
  // Side effects
  removeNamedReducer(windowId);
  // Remove the window from the list
  return createAction($$(id, WorkspaceActions.RemoveWindow), windowId);
};

export const minimizeWindow = (id: string, windowId: string): Action<string> => {
  return createAction($$(id, WorkspaceActions.MinimizeWindow), windowId);
};

export const restoreWindow = (id: string, windowId: string): Action<string> => {
  return createAction($$(id, WorkspaceActions.RestoreWindow), windowId);
};

export const addWindow = (id: string, type: WindowTypes): Action<string> => {
  const window: WorkspaceWindow = new WorkspaceWindow(type);
  // This will create a custom window reducer
  if (type === WindowTypes.TOB) {
    injectNamedReducer(window.id, createWindowReducer, DefaultWindowState);
  } else {
    console.log('we don\'t create custom reducers for these');
  }
  // Build-up the action
  // FIXME: centralize action name generators
  return createAction($$(id, WorkspaceActions.AddWindow), window);
};

export const moveWindow = (id: string, windowId: string, geometry: ClientRect): Action<string> => {
  return createAction($$(id, WorkspaceActions.UpdateGeometry), {id: windowId, geometry});
};

export const bringToFront = (id: string, windowId: string): Action<string> => {
  return createAction($$(id, WorkspaceActions.BringToFront), {id: windowId});
};

export const setWindowTitle = (id: string, windowId: string, title: string): Action<string> => {
  return createAction($$(id, WorkspaceActions.SetWindowTitle), {id: windowId, title});
};

export const setWindowAutoSize = (id: string, windowId: string): Action<string> => {
  return createAction($$(id, WorkspaceActions.SetWindowAutoSize), {id: windowId});
};

