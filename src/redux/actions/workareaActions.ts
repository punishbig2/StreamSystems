import {API} from 'API';
import {Strategy} from 'interfaces/strategy';
import {AnyAction} from 'redux';
import {Action} from 'redux/action';
import {createAction} from 'redux/actionCreator';
import {AsyncAction} from 'redux/asyncAction';
import {TileTypes, WorkareaActions} from 'redux/constants/workareaConstants';
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

export const addTile = (type: TileTypes, id: string): Action<WorkareaActions> => {
  // Make the other reducer add this ...
  return createAction(WorkareaActions.AddTile, {type, id});
};

/*
export const createOrder = (order: Order): AsyncAction<WorkareaActions> => {
  const handler = async (): Promise<AnyAction> => {
    const result = await API.createOrder(order);
    console.log(result);
    if (result.Status === 'Success')
      return createAction(WorkareaActions.OrderCreated);
    return createAction(WorkareaActions.OrderCreationFailed);
  };
  return new AsyncAction(handler, createAction(WorkareaActions.CreatingOrder));
};*/

export const initialize = (): AsyncAction<WorkareaActions> => {
  const handler = async (): Promise<AnyAction> => {
    const symbols: string[] = await API.getSymbols();
    const products: Strategy[] = await API.getProducts();
    const tenors: string[] = await API.getTenors();
    // When all have responded ...
    return createAction(WorkareaActions.Initialized, {symbols, products, tenors});
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

