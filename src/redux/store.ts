import {HubConnection} from '@microsoft/signalr';
import {Message} from 'interfaces/md';
import {ExecTypes, MessageBlotterEntry} from 'interfaces/messageBlotterEntry';
import {User} from 'interfaces/user';
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
// Reducers
import messageBlotterReducer from 'redux/reducers/messageBlotterReducer';
import {createWindowReducer} from 'redux/reducers/tileReducer';
import workareaReducer from 'redux/reducers/workareaReducer';
// Dynamic reducer creators
import {createWorkspaceReducer} from 'redux/reducers/workspaceReducer';
// Special object helper for connection management
import {SignalRManager} from 'redux/signalR/signalRManager';
import {SignalRAction} from 'redux/signalRAction';
import {WorkareaState} from 'redux/stateDefs/workareaState';
import {WorkspaceState} from 'redux/stateDefs/workspaceState';
import {toRowId} from 'utils';
import {$$} from 'utils/stringPaster';
// Websocket action parsers/converters
import {toWMessageAction} from 'utils/toWMessageAction';

const getObjectFromStorage = <T>(key: string): T => {
  const item: string | null = localStorage.getItem(key);
  if (item === null)
    return {} as T;
  return JSON.parse(item);
};

enum PersistedKeys {
  Workarea = 'workarea',
}

const AvailableUsers: User[] = [{
  email: 'iharob.alasimi@vascarsolutions.com',
  firm: 'DBCO',
  isBroker: false,
}, {
  email: 'asharnisar@yahoo.com',
  firm: 'CITI',
  isBroker: false,
}, {
  email: 'eric.greenspan@connectivityinabox.com',
  firm: 'CITI',
  isBroker: false,
}, {
  email: 'ashar@anttechnologies.com',
  firm: 'DBCO',
  isBroker: false,
}];

const {location} = window;

const savedWorkarea: WorkareaState = getObjectFromStorage<any>(PersistedKeys.Workarea);
const urlParameters: URLSearchParams = new URLSearchParams(location.search);
const email: string | null = urlParameters.get('user');
const currentUser: User | undefined = AvailableUsers.find((user: User): boolean => user.email === email);
if (!currentUser)
  throw new Error('user not found...');
const initialState: ApplicationState = {
  auth: {
    user: currentUser,
  },
  workarea: {
    symbols: [],
    products: [],
    tenors: [],
    workspaces: {},
    activeWorkspace: null,
    // Merge with the saved value
    ...savedWorkarea,
  },
  messageBlotter: {
    connected: false,
    entries: [],
  },
};

const dynamicReducers: { [name: string]: Reducer } = {};
// Build the reducer from the fixed and dynamic reducers
export const createReducer = (dynamicReducers: {} = {}): Reducer<ApplicationState, Action> => {
  return combineReducers<any, Action>({
    workarea: workareaReducer,
    messageBlotter: messageBlotterReducer,
    auth: (state: { user: User } = initialState.auth) => state,
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

/**
 * Generate dynamic reducers from saved state
 * @param base
 * @param creator
 * @param nest
 */
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
const workarea: WorkareaState = initialState.workarea;
// FIXME: prettify this
createDynamicReducers(workarea.workspaces, createWorkspaceReducer, (state: WorkspaceState) => {
  createDynamicReducers(state.windows, createWindowReducer, null);
});

const DummyAction: AnyAction = {type: undefined};
const enhancer: StoreEnhancer = (nextCreator: StoreEnhancerStoreCreator) => {
  let connection: HubConnection | null = null;
  // Return a store creator
  return <S, A extends Action>(reducer: Reducer<S, A>, preloadedState?: DeepPartial<S>) => {
    // FIXME: we can load the state here actually
    const store: Store<S, A> = nextCreator(reducer, preloadedState);
    // We have created the store
    const $dispatch: Dispatch<A> = store.dispatch;
    // Extract the "api"
    const connectionManager: SignalRManager<A> = new SignalRManager<A>();
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
          // noinspection JSIgnoredPromiseFromCall
          action.handle(connection);
        }
      } else {
        return $dispatch(action) as T;
      }
      return DummyAction as T;
    };
    // FIXME: super ugly trick
    dispatch(createAction<any, A>(SignalRActions.Disconnected));
    // Here go all the listeners
    const onConnected = (newConnection: HubConnection) => {
      // Update the connection reference
      connection = newConnection;
      // Dispatch an action to notify successful connection
      dispatch(createAction<any, A>(SignalRActions.Connected));
    };
    const onDisconnected = () => {
      // Update the connection reference
      connection = null;
      // Dispatch an action to notify disconnection
      dispatch(createAction<any, A>(SignalRActions.Disconnected));
    };
    const onUpdateMarketData = (data: Message) => {
      dispatch(toWMessageAction<A>(data));
    };
    const onUpdateMessageBlotter = (data: MessageBlotterEntry) => {
      switch (data.ExecType) {
        case ExecTypes.New:
          dispatch(createAction<any, A>(MessageBlotterActions.Update, data));
          break;
        case ExecTypes.Canceled:
          const type: string = $$(toRowId(data.Tenor, data.Symbol, data.Strategy), RowActions.Remove);
          // Dispatch an action to update any message blotter present
          // in the workspace
          dispatch(createAction<any, A>(MessageBlotterActions.Update, data));
          // Dispatch an action to update any row and remove the entry
          // if applicable
          dispatch(createAction<any, A>(type, data.Side));
          break;
      }
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
export const store: Store = createStore(createReducer(dynamicReducers), initialState, enhancer);

// Store persistence layer
// FIXME keep references to check what changed and save that only
store.subscribe(() => {
  const state: ApplicationState = store.getState();
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
});
