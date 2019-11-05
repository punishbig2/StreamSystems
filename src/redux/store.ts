import {HubConnection} from '@microsoft/signalr';
import {Message} from 'interfaces/md';
import {IWorkspace} from 'interfaces/workspace';
import {
  Action, AnyAction,
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
import {ApplicationState} from 'redux/applicationState';
import {AsyncAction} from 'redux/asyncAction';
import {SignalRActions} from 'redux/constants/signalRConstants';
// redux-persist
import {createTileReducer} from 'redux/reducers/tileReducer';
import {createRowReducer} from 'redux/reducers/tobRowReducer';
import workareaReducer from 'redux/reducers/workareaReducer';
// Reducers
import {createWorkspaceReducer} from 'redux/reducers/workspaceReducer';
import {ConnectionManager} from 'redux/signalR/connectionManager';
import {TileState} from 'redux/stateDefs/tileState';
import {WorkareaState} from 'redux/stateDefs/workareaState';
import {SignalRAction} from 'redux/signalRAction';
import {WorkspaceState} from 'redux/stateDefs/workspaceState';
import {wMessageToAction} from 'utils/wMessageToAction';

const getObjectFromStorage = <T>(key: string): T => {
  const item: string | null = localStorage.getItem(key);
  if (item === null)
    return {} as T;
  return JSON.parse(item);
};

enum PersistedKeys {
  Workarea = 'workarea',
}

const dynamicReducers: { [name: string]: Reducer } = {};
// Build the reducer from the fixed and dynamic reducers
export const createReducer = (dynamicReducers: {} = {}): Reducer<any, Action> => {
  return combineReducers<any, Action>({workarea: workareaReducer, ...dynamicReducers});
};

export const injectNamedReducer = (name: string, reducer: (name: string, initialState: any) => Reducer, initialState: any = {}) => {
  dynamicReducers[name] = reducer(name, initialState);
  // Replace the reducer
  store.replaceReducer(createReducer(dynamicReducers));
};

export const removeNamedReducer = <T>(name: string) => {
  delete dynamicReducers[name];
  // Replace the reducer
  store.replaceReducer(createReducer(dynamicReducers));
};

const savedWorkarea: WorkareaState = getObjectFromStorage<any>(PersistedKeys.Workarea);
const urlParameters: URLSearchParams = new URLSearchParams(window.location.search);
const currentUserId: string = urlParameters.get('user') || 'ashar@anttechnologies.com';
const initialState: ApplicationState = {
  workarea: {
    symbols: [],
    products: [],
    tenors: [],
    workspaces: {},
    activeWorkspace: null,
    user: {id: currentUserId},
    // Merge with the saved value
    ...savedWorkarea,
  },
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
  createDynamicReducers(state.tiles, createTileReducer, (state: TileState) => {
    createDynamicReducers(state.rows, createRowReducer, null);
  });
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
    const connectionManager: ConnectionManager<A> = new ConnectionManager<A>();
    // Create a new custom dispatch function
    const dispatch: Dispatch<A> = <T extends A>(action: A): T => {
      if (action instanceof AsyncAction) {
        // noinspection JSIgnoredPromiseFromCall
        action.handle($dispatch);
        // Return an ignored action
        return {type: 'IGNORE'} as T;
      } else if (action instanceof SignalRAction) {
        if (connection === null) {
          throw Error('this should never happen, connection MUST be defined if SignalRActions are dispatched');
        } else {
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
      wMessageToAction(data, dispatch);
    };
    // Setup the connection manager now
    connectionManager.setOnConnectedListener(onConnected);
    connectionManager.setOnUpdateMarketDataListener(onUpdateMarketData);
    connectionManager.setOnDisconnectedListener(onDisconnected);
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
  // Save the global attributes
  localStorage.setItem(PersistedKeys.Workarea, JSON.stringify(persistedObject));
  // Save the dynamic keys
  for (const [key, object] of Object.entries(entries)) {
    if (key.startsWith('__'))
      continue;
    localStorage.setItem(key, JSON.stringify(object));
  }
});
