import {IWorkspace} from 'interfaces/workspace';
import {Action, applyMiddleware, combineReducers, createStore, Reducer, Store, StoreEnhancer} from 'redux';
import {ApplicationState} from 'redux/applicationState';
import {createTileReducer} from 'redux/reducers/tileReducer';
import workareaReducer from 'redux/reducers/workareaReducer';
// redux-persist
import {asyncActionMiddleware} from 'redux/middleware/asyncActionMiddleware';
import {signalRMiddleware} from 'redux/middleware/signalR';
import {WorkareaState} from 'redux/stateDefs/workareaState';
// Reducers
import {createWorkspaceReducer} from 'redux/reducers/workspaceReducer';

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

export const injectNamedReducer = <T>(name: string, reducer: (name: string) => Reducer) => {
  dynamicReducers[name] = reducer(name);
  // Replace the reducer
  store.replaceReducer(createReducer(dynamicReducers));
};

export const removeNamedReducer = <T>(name: string) => {
  delete dynamicReducers[name];
  // Replace the reducer
  store.replaceReducer(createReducer(dynamicReducers));
};

const savedWorkarea: WorkareaState = getObjectFromStorage<any>(PersistedKeys.Workarea);
const initialState: ApplicationState = {
  workarea: {
    symbols: [],
    products: [],
    tenors: [],
    workspaces: {},
    activeWorkspace: null,
    user: {id: '1'},
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
const createDynamicReducers = (base: any, creator: ReducerCreator, nest: (state: any) => void) => {
  if (!base)
    return;
  // Install workspaces
  const keys = Object.keys(base);
  for (const key of keys) {
    const state: any = getObjectFromStorage<any>(key);
    // Nest to the next level if needed
    nest(state);
    // Add the reducer to the list
    dynamicReducers[key] = creator(key, state);
  }
};
const workarea: WorkareaState = initialState.workarea;
// FIXME: prettify this
createDynamicReducers(workarea.workspaces, createWorkspaceReducer, (state: any) => {
  createDynamicReducers(state.tiles, createTileReducer, () => null);
});

// Configure middleware
const enhancers: StoreEnhancer = applyMiddleware(asyncActionMiddleware, signalRMiddleware);
// Create the store
export const store: Store = createStore(createReducer(dynamicReducers), initialState, enhancers);

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
    localStorage.setItem(key, JSON.stringify(object));
  }
});
