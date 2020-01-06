import {HubConnection, HubConnectionState} from '@microsoft/signalr';
import {API} from 'API';
import {ExecTypes, Message, DarkPoolMessage} from 'interfaces/message';
import {Sides} from 'interfaces/order';
import {W} from 'interfaces/w';
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
import {Window} from 'interfaces/window';
import {createAction} from 'redux/actionCreator';
// State shapes
import {ApplicationState} from 'redux/applicationState';
// Special action types
import {AsyncAction} from 'redux/asyncAction';
import {MessageBlotterActions} from 'redux/constants/messageBlotterConstants';
// Action enumerators
import {SignalRActions} from 'redux/constants/signalRConstants';
import {WorkareaActions} from 'redux/constants/workareaConstants';
// Reducers
import messageBlotterReducer from 'redux/reducers/messageBlotterReducer';
import settingsReducer from 'redux/reducers/settingsReducer';
import workareaReducer from 'redux/reducers/workareaReducer';
// Dynamic reducer creators
// Special object helper for connection management
import {SignalRManager} from 'redux/signalR/signalRManager';
import {SignalRAction} from 'redux/signalRAction';
// Websocket action parsers/converters
import {handlers} from 'utils/messageHandler';
import {$$} from 'utils/stringPaster';
import {FXOptionsDB} from 'fx-options-db';
import {IWorkspace} from 'interfaces/workspace';
import {createWorkspaceReducer} from 'redux/reducers/workspaceReducer';
import {defaultWorkspaceState, ToolbarState} from 'redux/stateDefs/workspaceState';
import {createWindowReducer} from 'redux/reducers/tobReducer';
import {WorkspaceActions} from 'redux/constants/workspaceConstants';
import {manualToRowID, toRunId} from 'utils';
import {RunActions} from 'redux/reducers/runReducer';
import {RowActions} from 'redux/reducers/rowReducer';

const SidesMap: { [key: string]: Sides } = {'1': Sides.Buy, '2': Sides.Sell};

const dynamicReducers: { [name: string]: Reducer } = {};
// Build the reducer from the fixed and dynamic reducers
export const createReducer = (dynamicReducers: {} = {}): Reducer<ApplicationState, Action> => {
  return combineReducers<any, Action<any>>({
    workarea: workareaReducer,
    messageBlotter: messageBlotterReducer,
    settings: settingsReducer,
    // Dynamically generated reducers
    ...dynamicReducers,
  });
};

const hydrate = async (dispatch: Dispatch<any>) => {
  const workspaces: { [id: string]: IWorkspace } = await FXOptionsDB.getWorkspacesList();
  const ids = Object.keys(workspaces);
  const promises = ids.map(async (workspaceID: string) => {
    const workspace: IWorkspace = workspaces[workspaceID];
    const toolbarState: ToolbarState = await FXOptionsDB.getToolbarState(workspaceID);
    injectNamedReducer(workspaceID, createWorkspaceReducer, {
      ...defaultWorkspaceState,
      toolbarState: {
        ...defaultWorkspaceState.toolbarState,
        ...toolbarState,
      },
    });
    dispatch(createAction<any, any>(WorkareaActions.AddWorkspace, workspace));

    const tiles: string[] = await FXOptionsDB.getWindowsList(workspaceID);
    const promises = tiles.map(async (windowID: string) => {
      const window: Window | undefined = await FXOptionsDB.getWindow(windowID);
      if (window !== undefined) {
        injectNamedReducer(windowID, createWindowReducer, {
          rows: [],
          strategy: window.strategy,
          symbol: window.symbol,
        });
        dispatch(createAction<any, any>($$(workspaceID, WorkspaceActions.AddWindow), window));
      }
    });
    return Promise.all(promises);
  });
  return Promise.all(promises);
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

const connectionManager: SignalRManager<AnyAction> = new SignalRManager<AnyAction>();
export const DummyAction: AnyAction = {type: '---not-valid---'};
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
        action.handle($dispatch);
        return DummyAction as T;
      } else if (action instanceof SignalRAction) {
        setTimeout(() => {
          if (connection !== null) {
            if (connection.state === HubConnectionState.Connected) {
              action.handle(connection);
            } else {
              actionQueue.push(action);
            }
          } else {
            actionQueue.push(action);
          }
        }, 0);
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
    const onDisconnected = () => {
      // Update the connection reference
      connection = null;
      // Dispatch an action to notify disconnection
      dispatch(createAction<any, A>(SignalRActions.Disconnected));
    };
    const onUpdateMarketData = (data: W) => {
      dispatch(handlers.W<A>(data));
    };

    const onUpdateDarkPoolPx = (message: DarkPoolMessage) => {
      const rowID = manualToRowID(message.Tenor, message.Symbol, message.Strategy);
      dispatch(createAction<any, A>($$(rowID, RowActions.UpdateDarkPrice), message.DarkPrice));
    };

    const onUpdateMessageBlotter = (data: Message) => {
      switch (data.OrdStatus) {
        case ExecTypes.PendingCancel:
          break;
        case ExecTypes.Filled:
          API.cancelAll(data.Symbol, data.Strategy, SidesMap[data.Side])
            .then(() => {
              const runID = toRunId(data.Symbol, data.Strategy);
              switch (SidesMap[data.Side]) {
                case Sides.Buy:
                  dispatch(createAction<any, A>($$(runID, RunActions.RemoveAllBids)));
                  break;
                case Sides.Sell:
                  dispatch(createAction<any, A>($$(runID, RunActions.RemoveAllOfrs)));
                  break;
              }
            });
        // eslint-disable-next-line no-fallthrough
        case ExecTypes.PartiallyFilled:
          const type: string = $$('__ROW', data.Tenor, data.Symbol, data.Strategy, RowActions.Executed);
          // FIXME: to improve performance we should try to find a way to do this
          //        in a single dispatch
          dispatch(createAction<any, A>(WorkareaActions.SetLastExecution, data));
          dispatch(createAction<any, A>(type));
          dispatch(createAction<any, A>(MessageBlotterActions.Update, data));
          break;
        default:
          dispatch(createAction<any, A>(MessageBlotterActions.Update, data));
          break;
      }
    };
    // Setup the connection manager now
    connectionManager.setOnConnectedListener(onConnected);
    connectionManager.setOnUpdateMarketDataListener(onUpdateMarketData);
    connectionManager.setOnDisconnectedListener(onDisconnected);
    connectionManager.setOnUpdateMessageBlotter(onUpdateMessageBlotter);
    connectionManager.setOnUpdateDarkPoolPxListener(onUpdateDarkPoolPx);
    connectionManager.connect();

    hydrate(dispatch);
    // Build a new store with the modified dispatch
    return {...store, dispatch};
  };
};
// Create the store
export const store: Store = createStore(createReducer(dynamicReducers), {}, enhancer);
