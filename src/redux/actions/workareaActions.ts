import {API} from 'API';
import {ExecTypes, MessageBlotterEntry} from 'interfaces/messageBlotterEntry';
import {Strategy} from 'interfaces/strategy';
import {User} from 'interfaces/user';
import {AnyAction} from 'redux';
import {Action} from 'redux/action';
import {createAction} from 'redux/actionCreator';
import {AsyncAction} from 'redux/asyncAction';
import {MessageBlotterActions} from 'redux/constants/messageBlotterConstants';
import {RunActions} from 'redux/constants/runConstants';
import {WindowTypes, WorkareaActions} from 'redux/constants/workareaConstants';
import {injectNamedReducer, removeNamedReducer} from 'redux/store';
import {createWorkspaceReducer} from 'redux/reducers/workspaceReducer';
import shortid from 'shortid';
import {toRunId} from 'utils';
import {getAuthenticatedUser} from 'utils/getCurrentUser';
import {$$} from 'utils/stringPaster';
import moment, {Moment} from 'moment';

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
const getOrders = (snapshot: MessageBlotterEntry[]): MessageBlotterEntry[] => {
  const user: User = getAuthenticatedUser();
  const now: Moment = moment();
  return snapshot
    .filter((entry: MessageBlotterEntry) => {
      const date: Moment = moment(entry.TransactTime, 'YYYYMMDD-HH:mm:ss');
      if (date.dayOfYear() !== now.dayOfYear())
        return false;
      return entry.Username === user.email && entry.ExecType !== ExecTypes.Canceled;
    })
    .filter((entry: MessageBlotterEntry) => {
      return !snapshot.find((other: MessageBlotterEntry) => {
        return other.OrderID === entry.OrderID && other.ExecType === ExecTypes.Canceled;
      });
    });
};

export const initialize = (): AsyncAction<AnyAction> => {
  const handler = async (): Promise<AnyAction[]> => {
    const symbols: string[] = await API.getSymbols();
    const products: Strategy[] = await API.getProducts();
    const tenors: string[] = await API.getTenors();
    const messages: MessageBlotterEntry[] = await API.getMessagesSnapshot();
    const orders: MessageBlotterEntry[] = getOrders(messages);
    // Map entries to actions
    const orderToActionMapper = (entry: MessageBlotterEntry): Action => {
      return createAction($$(toRunId(entry.Symbol, entry.Strategy), RunActions.UpdateOrders), entry);
    };
    // Build a set of update actions
    const actions: Action[] = orders.map(orderToActionMapper);
    // Return the initialization action
    return [
      createAction(WorkareaActions.Initialized, {symbols, products, tenors, messages}),
      // If there are anu Message Blotter windows update them
      createAction(MessageBlotterActions.Initialize, messages),
      ...actions,
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

