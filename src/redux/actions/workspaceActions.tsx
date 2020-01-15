import {API} from 'API';
import {WorkspaceWindow} from 'components/Workspace/workspaceWindow';
import {Action} from 'redux/action';
import {createAction} from 'redux/actionCreator';
import {AsyncAction} from 'redux/asyncAction';
import {WindowTypes} from 'redux/constants/workareaConstants';
import {WorkspaceActions} from 'redux/constants/workspaceConstants';
import {createWindowReducer} from 'redux/reducers/tobReducer';
import {DefaultWindowState} from 'redux/stateDefs/windowState';
import {injectNamedReducer, removeNamedReducer, DummyAction} from 'redux/store';
import {$$} from 'utils/stringPaster';
import {FXOptionsDB} from 'fx-options-db';

export const removeWindow = (workspaceID: string, windowID: string): Action<string> => {
  FXOptionsDB.removeWindow(workspaceID, windowID);
  removeNamedReducer(windowID);
  return createAction($$(workspaceID, WorkspaceActions.RemoveWindow), windowID);
};

export const minimizeWindow = (id: string, windowID: string): Action<string> => {
  return createAction($$(id, WorkspaceActions.MinimizeWindow), windowID);
};

export const restoreWindow = (id: string, windowID: string): Action<string> => {
  return createAction($$(id, WorkspaceActions.RestoreWindow), windowID);
};

export const addWindow = (workspaceID: string, type: WindowTypes): Action<string> => {
  const window: WorkspaceWindow = new WorkspaceWindow(type);
  if (type === WindowTypes.TOB)
    injectNamedReducer(window.id, createWindowReducer, DefaultWindowState);
  FXOptionsDB.addWindow(workspaceID, window);
  return createAction($$(workspaceID, WorkspaceActions.AddWindow), window);
};

export const moveWindow = (id: string, windowID: string, geometry: ClientRect): AsyncAction<any> => {
  return new AsyncAction(async () => {
    // FIXME: we should do this when the mouse is released instead to avoid writing too
    //        often to the database
    FXOptionsDB.setWindowGeometry(windowID, geometry);
    return createAction($$(id, WorkspaceActions.UpdateGeometry), {id: windowID, geometry});
  }, DummyAction);
};

export const bringToFront = (id: string, windowID: string): Action<string> => {
  return createAction($$(id, WorkspaceActions.BringToFront), {id: windowID});
};

export const setWindowTitle = (id: string, windowID: string, title: string): Action<string> => {
  return createAction($$(id, WorkspaceActions.SetWindowTitle), {id: windowID, title});
};

export const setToast = (id: string, message: string | null): Action<string> => {
  return createAction($$(id, WorkspaceActions.Toast), message);
};

export const setWindowAutoSize = (id: string, windowID: string): Action<string> => {
  return createAction($$(id, WorkspaceActions.SetWindowAutoSize), {id: windowID});
};

export const toolbarShow = (id: string) => createAction($$(id, WorkspaceActions.ToolbarShow));
export const toolbarTryShow = (id: string) => createAction($$(id, WorkspaceActions.ToolbarTryShow));
export const toolbarHide = (id: string) => createAction($$(id, WorkspaceActions.ToolbarHide));
export const toolbarTogglePin = (id: string) => {
  return new AsyncAction(async () => {
    FXOptionsDB.togglePinToolbar(id);
    return createAction($$(id, WorkspaceActions.ToolbarTogglePin));
  }, DummyAction);
};

export const loadMarkets = (id: string) =>
  new AsyncAction<any, any>(
    async (): Promise<any> => {
      const markets: string[] = await API.getBanks();
      // Dispatch the action
      return createAction($$(id, WorkspaceActions.UpdateMarkets), markets);
    }, createAction($$(id, WorkspaceActions.LoadingMarkets)),
  );

export const setPersonality = (id: string, personality: string) => {
  return new AsyncAction(async () => {
    await FXOptionsDB.setPersonality(id, personality);
    return createAction(WorkspaceActions.SetPersonality, personality);
  }, createAction($$(id, WorkspaceActions.SetPersonality), personality));
};

export const showUserProfileModal = (id: string): Action<WorkspaceActions> => {
  return createAction($$(id, WorkspaceActions.SetUserProfileModalVisible), true);
};

export const closeUserProfileModal = (id: string): Action<WorkspaceActions> => {
  return createAction($$(id, WorkspaceActions.SetUserProfileModalVisible), false);
};

export const closeErrorModal = (id: string): Action<WorkspaceActions> => {
  return createAction($$(id, WorkspaceActions.CloseErrorModal));
};

export const refAll = (id: string) => {
  return new AsyncAction(async () => {
    const result: any = await API.brokerRefAll();
    if (result.Status === 'Failure')
      return createAction($$(id, WorkspaceActions.ShowError), result.Response);
    return DummyAction;
  }, DummyAction);
};
