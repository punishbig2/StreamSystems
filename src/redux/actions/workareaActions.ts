import {API} from 'API';
import {Message} from 'interfaces/message';
import {Strategy} from 'interfaces/strategy';
import {AnyAction} from 'redux';
import {Action} from 'redux/action';
import {createAction} from 'redux/actionCreator';
import {AsyncAction} from 'redux/asyncAction';
import {MessageBlotterActions} from 'redux/constants/messageBlotterConstants';
import {WindowTypes, WorkareaActions} from 'redux/constants/workareaConstants';
import {injectNamedReducer, removeNamedReducer} from 'redux/store';
import {createWorkspaceReducer} from 'redux/reducers/workspaceReducer';
import shortid from 'shortid';

export const setWorkspaces = (id: string): AnyAction => createAction(WorkareaActions.SetWorkspace, id);
export const addWorkspaces = (): AnyAction => {
  const id = `workspace-${shortid()}`;
  // Create the reducer now, after doing this we will have the reducer
  // that will work specifically with this email
  injectNamedReducer(id, createWorkspaceReducer);
  // Generate the action to make the reducer insert a new workspace
  return createAction(WorkareaActions.AddWorkspace, {id, name: 'Untitled'});
};

export const addWindow = (type: WindowTypes, id: string): Action<WorkareaActions> => {
  // Make the other reducer add this ...
  return createAction(WorkareaActions.AddTile, {type, id});
};

export const initialize = (): AsyncAction<AnyAction> => {
  const handler = async (): Promise<AnyAction[]> => {
    const symbols: string[] = await API.getSymbols();
    const products: Strategy[] = await API.getProducts();
    const tenors: string[] = await API.getTenors();
    const messages: Message[] = await API.getMessagesSnapshot();
    return [
      createAction(WorkareaActions.Initialized, {symbols, products, tenors, messages}),
      // If there are anu W Blotter windows update them
      createAction(MessageBlotterActions.Initialize, messages),
    ];
  };
  return new AsyncAction(handler, createAction(WorkareaActions.Initializing));
};

export const renameWorkspace = (name: string, id: string): Action<WorkareaActions> => {
  return createAction(WorkareaActions.RenameWorkspace, {name, id});
};

export const closeWorkspace = (id: string): Action<WorkareaActions> => {
  // Remove the reducer
  removeNamedReducer(id);
  // Now dispatch the action
  return createAction(WorkareaActions.CloseWorkspace, id);
};

