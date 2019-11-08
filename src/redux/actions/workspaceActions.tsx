import {WorkspaceWindow} from 'components/Workspace/workspaceWindow';
import {Action} from 'redux/action';
import {createAction} from 'redux/actionCreator';
import {WindowTypes} from 'redux/constants/workareaConstants';
import {WorkspaceActions} from 'redux/constants/workspaceConstants';
import {createWindowReducer} from 'redux/reducers/tileReducer';
import {DefaultWindowState} from 'redux/stateDefs/windowState';
import {injectNamedReducer} from 'redux/store';
import {$$} from 'utils/stringPaster';

export const addWindow = (id: string, type: WindowTypes): Action<string> => {
  const window: WorkspaceWindow = new WorkspaceWindow(type);
  // This will create a custom window reducer
  injectNamedReducer(window.id, createWindowReducer, DefaultWindowState);
  // Build-up the action
  // FIXME: centralize action name generators
  return createAction($$(id, WorkspaceActions.AddWindow), window);
};

export const moveWindow = (id: string, windowId: string, geometry: ClientRect): Action<string> => {
  return createAction($$(id, WorkspaceActions.UpdateGeometry), {id: windowId, geometry});
};
