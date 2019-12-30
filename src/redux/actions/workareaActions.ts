import {API} from 'API';
import {Currency} from 'interfaces/currency';
import {Message} from 'interfaces/message';
import {Strategy} from 'interfaces/strategy';
import {IWorkspace} from 'interfaces/workspace';
import {AnyAction, Dispatch} from 'redux';
import {Action} from 'redux/action';
import {createAction} from 'redux/actionCreator';
import {AsyncAction} from 'redux/asyncAction';
import {MessageBlotterActions} from 'redux/constants/messageBlotterConstants';
import {SignalRActions} from 'redux/constants/signalRConstants';
import {WindowTypes, WorkareaActions} from 'redux/constants/workareaConstants';
import {createWorkspaceReducer} from 'redux/reducers/workspaceReducer';
import {SignalRAction} from 'redux/signalRAction';
import {WorkspaceState} from 'redux/stateDefs/workspaceState';
import {injectNamedReducer, removeNamedReducer} from 'redux/store';
import shortid from 'shortid';

const defaultWorkspaceState: WorkspaceState = {
  windows: {},
  toast: null,
  toolbarState: {visible: false, hovering: false, pinned: false},
  markets: [],
};

export const clearLastExecution = () => createAction(WorkareaActions.ClearLastExecution);
export const setWorkspace = (id: string): AnyAction => createAction(WorkareaActions.SetWorkspace, id);
export const addWorkspace = (): AnyAction => {
  const name: string = 'Untitled';
  const id: string = `workspace-${shortid()}`;
  const newWorkspace: IWorkspace = {id, name};
  // Create the reducer now, after doing this we will have the reducer
  // that will work specifically with this email
  injectNamedReducer(id, createWorkspaceReducer, defaultWorkspaceState);
  // Generate the action to make the reducer insert a new workspace
  return createAction(WorkareaActions.AddWorkspace, newWorkspace);
};

export const addWindow = (type: WindowTypes, id: string): Action<WorkareaActions> => {
  // Make the other reducer add this ...
  return createAction(WorkareaActions.AddTile, {type, id});
};

export const currencyToNumber = (value: string) => {
  return 1000 * value.charCodeAt(0) + value.charCodeAt(3);
};

export const loadMessages = (lastInitializationTimestamp?: string): AsyncAction<AnyAction> => {
  const handler = async (): Promise<AnyAction[]> => {
    const messages: Message[] = await API.getMessagesSnapshot(lastInitializationTimestamp);
    return [
      createAction(MessageBlotterActions.Initialize, messages),
    ];
  };
  return new AsyncAction(handler, createAction(WorkareaActions.LoadingMessages));
};

export const initialize = (): AsyncAction<AnyAction> => {
  const handler = async (dispatch?: Dispatch<AnyAction>): Promise<AnyAction[]> => {
    if (!dispatch)
      throw new Error('this handler must receive a dispatch function');
    dispatch(createAction(WorkareaActions.LoadingSymbols));
    const symbols: Currency[] = await API.getSymbols();

    dispatch(createAction(WorkareaActions.LoadingStrategies));
    const products: Strategy[] = await API.getProducts();

    dispatch(createAction(WorkareaActions.LoadingTenors));
    const tenors: string[] = await API.getTenors();

    dispatch(createAction(WorkareaActions.LoadingUsersList));
    const users: any[] = await API.getUsers();
    // Sort symbols
    symbols.sort((a: Currency, b: Currency) => {
      return currencyToNumber(a.name) - currencyToNumber(b.name);
    });
    return [
      createAction(WorkareaActions.Initialized, {symbols, products, tenors, users}),
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

export const quit = () => {
};

export const subscribeToMessages = (email: string): SignalRAction<SignalRActions> => {
  return new SignalRAction(SignalRActions.SubscribeForMBMsg, [email]);
};

export const unsubscribeFromMessages = (email: string): SignalRAction<SignalRActions> => {
  return new SignalRAction(SignalRActions.UnsubscribeForMBMsg, [email]);
};

