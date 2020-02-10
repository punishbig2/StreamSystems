import {API} from 'API';
import {createWorkspaceAction} from 'redux/actionCreator';
import {AsyncAction} from 'redux/asyncAction';
import {WindowTypes} from 'redux/constants/workareaConstants';
import {WorkspaceActions} from 'redux/constants/workspaceConstants';
import {defaultWindowState, WindowState} from 'redux/stateDefs/windowState';
import {removeNamedReducer, DummyAction} from 'redux/store';
import {FXOptionsDB} from 'fx-options-db';
import {FXOAction} from 'redux/fxo-action';
import shortid from 'shortid';

export const removeWindow = (workspaceID: string, windowID: string): FXOAction<string> => {
  FXOptionsDB.removeWindow(workspaceID, windowID);
  removeNamedReducer(windowID);
  return createWorkspaceAction(workspaceID, WorkspaceActions.RemoveWindow, windowID);
};

export const minimizeWindow = (workspaceID: string, windowID: string): FXOAction<string> => {
  return createWorkspaceAction(workspaceID, WorkspaceActions.MinimizeWindow, windowID);
};

export const restoreWindow = (workspaceID: string, windowID: string): FXOAction<string> => {
  return createWorkspaceAction(workspaceID, WorkspaceActions.RestoreWindow, windowID);
};

export const addWindow = (workspaceID: string, type: WindowTypes): FXOAction<string> => {
  const id: string = `wn-${shortid()}-${type}`;
  const window: WindowState = {...defaultWindowState, id, type};
  FXOptionsDB.addWindow(workspaceID, window);
  return createWorkspaceAction(workspaceID, WorkspaceActions.AddWindow, window);
};

export const moveWindow = (workspaceID: string, windowID: string, geometry: ClientRect, resized: boolean): AsyncAction<any> => {
  return new AsyncAction(async () => {
    // FIXME: we should do this when the mouse is released instead to avoid writing too
    //        often to the database
    FXOptionsDB.setWindowGeometry(windowID, geometry);
    FXOptionsDB.setWindowAutosize(windowID, false);
    const data = {
      id: windowID,
      ...{geometry, resized},
    };
    return createWorkspaceAction(workspaceID, WorkspaceActions.UpdateGeometry, data);
  }, DummyAction);
};

export const bringToFront = (workspaceID: string, windowID: string): FXOAction<string> => {
  return createWorkspaceAction(workspaceID, WorkspaceActions.BringToFront, {id: windowID});
};

export const setWindowTitle = (workspaceID: string, windowID: string, title: string): FXOAction<string> => {
  return createWorkspaceAction(workspaceID, WorkspaceActions.SetWindowTitle, {id: windowID, title});
};

export const setToast = (workspaceID: string, message: string | null): FXOAction<string> => {
  return createWorkspaceAction(workspaceID, WorkspaceActions.Toast, message);
};

export const setWindowAutoSize = (workspaceID: string, windowID: string): FXOAction<string> => {
  FXOptionsDB.setWindowAutosize(windowID, true);
  return createWorkspaceAction(workspaceID, WorkspaceActions.SetWindowAutoSize, {
    id: windowID,
  });
};

export const loadMarkets = (workspaceID: string) =>
  new AsyncAction<any, any>(async (): Promise<any> => {
    const markets: string[] = await API.getBanks();
    // Dispatch the action
    return createWorkspaceAction(workspaceID, WorkspaceActions.UpdateMarkets, markets);
  }, createWorkspaceAction(workspaceID, WorkspaceActions.LoadingMarkets));

export const setPersonality = (workspaceID: string, personality: string) => {
  return new AsyncAction(async () => {
    await FXOptionsDB.setPersonality(workspaceID, personality);
    return createWorkspaceAction(workspaceID, WorkspaceActions.SetPersonality, personality);
  }, createWorkspaceAction(workspaceID, WorkspaceActions.SetPersonality, personality));
};

export const showUserProfileModal = (workspaceID: string): FXOAction<WorkspaceActions> => {
  return createWorkspaceAction(workspaceID, WorkspaceActions.SetUserProfileModalVisible, true);
};

export const closeUserProfileModal = (workspaceID: string): FXOAction<WorkspaceActions> => {
  return createWorkspaceAction(workspaceID, WorkspaceActions.SetUserProfileModalVisible, false);
};

export const closeErrorModal = (workspaceID: string): FXOAction<WorkspaceActions> => {
  return createWorkspaceAction(workspaceID, WorkspaceActions.CloseErrorModal);
};

export const refAll = (workspaceID: string, personality: string) => {
  return new AsyncAction(async () => {
    const result: any = await API.brokerRefAll(personality);
    if (result.Status === 'Failure')
      return createWorkspaceAction(workspaceID, WorkspaceActions.ShowError, result.Response);
    return DummyAction;
  }, DummyAction);
};

