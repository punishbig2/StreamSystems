import {HubConnection, HubConnectionState} from '@microsoft/signalr';
import {API} from 'API';
import {ExecTypes, Message} from 'interfaces/message';
import {Sides} from 'interfaces/order';
import {W} from 'interfaces/w';
import {IWorkspace} from 'interfaces/workspace';
import {
  Action,
  AnyAction,
  combineReducers,
  createStore,
  DeepPartial,
  Dispatch,
  Reducer,
  Store,
  StoreEnhancer,
  StoreEnhancerStoreCreator,
} from 'redux';
import {createAction} from 'redux/actionCreator';
// State shapes
import {ApplicationState} from 'redux/applicationState';
// Special action types
import {AsyncAction} from 'redux/asyncAction';
import {MessageBlotterActions} from 'redux/constants/messageBlotterConstants';
import {RowActions} from 'redux/constants/rowConstants';
// Action enumerators
import {SignalRActions} from 'redux/constants/signalRConstants';
import {WorkareaActions} from 'redux/constants/workareaConstants';
// Reducers
import messageBlotterReducer from 'redux/reducers/messageBlotterReducer';
import settings from 'redux/reducers/settingsReducer';
import {createWindowReducer} from 'redux/reducers/tobReducer';
import workareaReducer from 'redux/reducers/workareaReducer';
// Dynamic reducer creators
import {createWorkspaceReducer} from 'redux/reducers/workspaceReducer';
// Special object helper for connection management
import {SignalRManager} from 'redux/signalR/signalRManager';
import {SignalRAction} from 'redux/signalRAction';
import {WorkareaState} from 'redux/stateDefs/workareaState';
import {WorkspaceState} from 'redux/stateDefs/workspaceState';
// Websocket action parsers/converters
import {handlers} from 'utils/messageHandler';
import {$$} from 'utils/stringPaster';

const getObjectFromStorage = <T>(key: string): T => {
  const item: string | null = localStorage.getItem(key);
  if (item === null)
    return {} as T;
  return JSON.parse(item);
};

enum PersistedKeys {
  Workarea = 'workarea',
}

const SidesMap: { [key: string]: Sides } = {'1': Sides.Buy, '2': Sides.Sell};
const savedWorkarea: WorkareaState = getObjectFromStorage<any>(PersistedKeys.Workarea);

const preloadedState: ApplicationState = {
  workarea: {
    symbols: [],
    products: [],
    tenors: [],
    workspaces: {},
    activeWorkspace: null,
    // Merge with the saved value
    ...savedWorkarea,
    connected: false,
    lastExecution: null,
  },
  messageBlotter: {
    entries: [],
  },
  settings: {},
};

const dynamicReducers: { [name: string]: Reducer } = {};
// Build the reducer from the fixed and dynamic reducers
export const createReducer = (dynamicReducers: {} = {}): Reducer<ApplicationState, Action> => {
  return combineReducers<any, Action<any>>({
    workarea: workareaReducer,
    messageBlotter: messageBlotterReducer,
    settings,
    // Dynamically generated reducers
    ...dynamicReducers,
  });
};

type NamedReducerCreator = (name: string, initialState: any) => Reducer;
export const injectNamedReducer = (name: string, createNamedReducer: NamedReducerCreator, initialState: any = {}) => {
  if (dynamicReducers.hasOwnProperty(name)) {
    console.warn('creating the reducer more than once seems to me like a bug: `' + name + '\'');
    // Simple don't do it because it already exists
    return;
  }
  dynamicReducers[name] = createNamedReducer(name, initialState);
  const finalReducer: Reducer = createReducer(dynamicReducers);
  // Replace the reducer
  store.replaceReducer(finalReducer);
};

export const removeNamedReducer = <T>(name: string) => {
  delete dynamicReducers[name];
  // Replace the reducer
  store.replaceReducer(createReducer(dynamicReducers));
};

type ReducerCreator = (key: string, state: any) => Reducer;

const createDynamicReducers = (base: any, creator: ReducerCreator, nest: ((state: any) => void) | null) => {
  if (!base)
    return;
  // Install workspaces
  const keys = Object.keys(base);
  for (const key of keys) {
    const state: any = getObjectFromStorage<any>(key);
    // Nest to the next level if needed
    if (nest !== null) {
      nest(state);
    }
    // Add the reducer to the list
    dynamicReducers[key] = creator(key, state);
  }
};

const {workarea} = preloadedState;
// Now that there's a store ... create the dynamic reducers
createDynamicReducers(workarea.workspaces, createWorkspaceReducer, (state: WorkspaceState) => {
  createDynamicReducers(state.windows, createWindowReducer, null);
});

const connectionManager: SignalRManager<AnyAction> = new SignalRManager<AnyAction>();
const DummyAction: AnyAction = {type: undefined};
const enhancer: StoreEnhancer = (nextCreator: StoreEnhancerStoreCreator) => {
  let connection: HubConnection | null = null;
  // Return a store creator
  return <S, A extends Action>(reducer: Reducer<S, A>, preloadedState?: DeepPartial<S>) => {
    const actionQueue: SignalRAction<A>[] = [];
    // FIXME: we can load the state here actually
    const store: Store<S, A> = nextCreator(reducer, preloadedState);
    // We have created the store
    const $dispatch: Dispatch<A> = store.dispatch;
    // Extract the "api"
    // Create a new custom dispatch function
    const dispatch: Dispatch<A> = <T extends A>(action: A): T => {
      if (action instanceof AsyncAction) {
        // noinspection JSIgnoredPromiseFromCall
        action.handle($dispatch);
        // Return an ignored action
        return {type: 'IGNORE'} as T;
      } else if (action instanceof SignalRAction) {
        // FIXME: we should schedule lost actions instead of discarding them
        // If connection is `null' we just ignore this for now
        if (connection !== null) {
          if (connection.state === HubConnectionState.Connected) {
            // noinspection JSIgnoredPromiseFromCall
            action.handle(connection);
          } else {
            actionQueue.push(action);
          }
        } else {
          actionQueue.push(action);
        }
      } else {
        return $dispatch(action) as T;
      }
      return DummyAction as T;
    };
    // Here go all the listeners
    const onConnected = (newConnection: HubConnection) => {
      // Update the connection reference
      connection = newConnection;
      // Dispatch an action to notify successful connection
      dispatch(createAction<any, A>(SignalRActions.Connected));
      // Dispatch all the actions from the queue
      actionQueue.forEach((action: SignalRAction<A>) => {
        if (connection !== null) {
          action.handle(connection);
        }
      });
      actionQueue.splice(0, actionQueue.length);
    };
    const onDisconnected = (error: any) => {
      // Update the connection reference
      connection = null;
      // Dispatch an action to notify disconnection
      dispatch(createAction<any, A>(SignalRActions.Disconnected));
    };
    const onUpdateMarketData = (data: W) => {
      // This is the default market data handler
      dispatch(handlers.W<A>(data));
    };
    const onUpdateMessageBlotter = (data: Message) => {
      switch (data.OrdStatus) {
        case ExecTypes.Filled:
          API.cancelAll(data.Symbol, data.Strategy, SidesMap[data.Side]);
        // eslint-disable-next-line no-fallthrough
        case ExecTypes.PartiallyFilled:
          const type: string = $$('__ROW', data.Tenor, data.Symbol, data.Strategy, RowActions.Executed);
          // Set last execution to trigger the popup
          dispatch(createAction<any, A>(WorkareaActions.SetLastExecution, data));
          // Now try to highlight the related row
          dispatch(createAction<any, A>(type));
          break;
        default:
          break;
      }
      dispatch(createAction<any, A>(MessageBlotterActions.Update, data));
    };
    // Setup the connection manager now
    connectionManager.setOnConnectedListener(onConnected);
    connectionManager.setOnUpdateMarketDataListener(onUpdateMarketData);
    connectionManager.setOnDisconnectedListener(onDisconnected);
    connectionManager.setOnUpdateMessageBlotter(onUpdateMessageBlotter);
    connectionManager.connect();

    // Build a new store with the modified dispatch
    return {...store, dispatch};
  };
};
// Create the store
export const store: Store = createStore(createReducer(dynamicReducers), preloadedState, enhancer);

const saveToLocalStorage = (state: ApplicationState) => {
  const {workarea, ...entries} = state;
  const workspaces: { [id: string]: IWorkspace } = workarea.workspaces;
  // FIXME: improve this with mobX (probably)
  const persistedObject: any = {
    activeWorkspace: workarea.activeWorkspace,
    workspaces: workspaces,
  };
  const filter = (name: string, value: any): string | undefined => {
    if (name.startsWith('__'))
      return undefined;
    return value;
  };
  // Save the global attributes
  localStorage.setItem(PersistedKeys.Workarea, JSON.stringify(persistedObject, filter));
  // Save the dynamic keys
  for (const [key, object] of Object.entries(entries)) {
    if (key.startsWith('__'))
      continue;
    localStorage.setItem(key, JSON.stringify(object, filter));
  }
};

// Store persistence layer
// FIXME keep references to check what changed and save that only
store.subscribe(() => {
  const state: ApplicationState = store.getState();
  saveToLocalStorage(state);
});
