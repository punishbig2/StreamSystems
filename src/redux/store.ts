import {HubConnection, HubConnectionState} from '@microsoft/signalr';
import {API} from 'API';
import {ExecTypes, Message, DarkPoolMessage} from 'interfaces/message';
import {Sides} from 'interfaces/order';
import {W} from 'interfaces/w';
import {
  combineReducers,
  createStore,
  DeepPartial,
  Dispatch,
  Reducer,
  Store,
  StoreEnhancer,
  StoreEnhancerStoreCreator,
  Action,
} from 'redux';
import {createAction, createWorkspaceAction} from 'redux/actionCreator';
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
import workareaReducer from 'redux/reducers/workareaReducer';
import executionsReducer from 'redux/reducers/exectutionsReducer';
// Dynamic reducer creators
// Special object helper for connection management
import {SignalRManager} from 'redux/signalR/signalRManager';
import {SignalRAction} from 'redux/signalRAction';
// Websocket action parsers/converters
import {handlers} from 'utils/messageHandler';
import {$$} from 'utils/stringPaster';
import {FXOptionsDB} from 'fx-options-db';
import {WorkspaceActions} from 'redux/constants/workspaceConstants';
import {manualToRowID, toRunId} from 'utils';
import {RunActions} from 'redux/reducers/runReducer';
import {RowActions} from 'redux/reducers/rowReducer';
import userProfileReducer from 'redux/reducers/userProfileReducer';
import {FXOAction} from 'redux/fxo-action';
import {defaultWorkspaceState} from 'redux/stateDefs/workspaceState';
import {WindowState} from 'redux/stateDefs/windowState';

const SidesMap: { [key: string]: Sides } = {'1': Sides.Buy, '2': Sides.Sell};

const dynamicReducers: { [name: string]: Reducer<any, Action> } = {};
// Build the reducer from the fixed and dynamic reducers
export const createReducer = (dynamicReducers: {} = {}): Reducer<ApplicationState, Action> => {
  return combineReducers<any, Action<any>>({
    workarea: workareaReducer,
    messageBlotter: messageBlotterReducer,
    userProfile: userProfileReducer,
    executions: executionsReducer,
    // Dynamically generated reducers
    ...dynamicReducers,
  });
};

const hydrate = async (dispatch: Dispatch<any>) => {
  const workspaces: string[] = await FXOptionsDB.getWorkspacesList();
  const promises = workspaces.map(async (id: string) => {
    const name: string = await FXOptionsDB.getWorkspaceName(id);
    const personality: string = await FXOptionsDB.getPersonality(id);

    dispatch(createAction<any, any>(WorkareaActions.AddWorkspace, {...defaultWorkspaceState, id, name, personality}));
    const tiles: string[] | undefined = await FXOptionsDB.getWindowsList(id);
    if (tiles) {
      const promises = tiles.map(async (windowID: string) => {
        const window: WindowState | undefined = await FXOptionsDB.getWindow(windowID);
        if (window !== undefined) {
          /*injectNamedReducer(windowID, createWindowReducer, {
            rows: [],
            strategy: window.strategy,
            symbol: window.symbol,
          });*/
          dispatch(createWorkspaceAction(id, WorkspaceActions.AddWindow, window));
        }
      });
      return Promise.all(promises);
    }
  });
  return Promise.all(promises);
};

type NamedReducerCreator = (name: string, initialState: any) => Reducer<any, FXOAction>;
export const injectNamedReducer = (name: string, createNamedReducer: NamedReducerCreator, initialState: any = {}) => {
  if (dynamicReducers.hasOwnProperty(name)) {
    console.warn(
      'creating the reducer more than once seems to me like a bug: `' +
      name +
      '\'',
    );
    // Simple don't do it because it already exists
    return;
  }
  dynamicReducers[name] = createNamedReducer(name, initialState);
  const finalReducer: Reducer<ApplicationState, Action> = createReducer(dynamicReducers);
  // Replace the reducer
  store.replaceReducer(finalReducer);
};

export const removeNamedReducer = <T>(name: string) => {
  delete dynamicReducers[name];
  // Replace the reducer
  store.replaceReducer(createReducer(dynamicReducers));
};

const connectionManager: SignalRManager<Action> = SignalRManager.getInstance();
export const DummyAction: Action = {type: '---not-valid---'};

export const isOCOEnabled = (): boolean => {
  const state: ApplicationState = store.getState();
  if (!state)
    return true;
  const {profile} = state.userProfile;
  return profile.oco;
};

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
      const type: string = `${data.Symbol}${data.Strategy}${data.Tenor}`;
      const event: CustomEvent<W> = new CustomEvent<W>(type, {detail: data});
      document.dispatchEvent(event);
      const action: A | null = handlers.W<A>(data);
      if (action !== null && action !== DummyAction) {
        dispatch(action);
      }
    };

    const onUpdateDarkPoolPx = (message: DarkPoolMessage) => {
      const rowID = manualToRowID(message.Tenor, message.Symbol, message.Strategy);
      FXOptionsDB.saveDarkPool(rowID, message.DarkPrice);
      dispatch(
        createAction<any, A>(
          $$(rowID, RowActions.UpdateDarkPrice),
          message.DarkPrice,
        ),
      );
    };

    const onUpdateMessageBlotter = (data: Message) => {
      switch (data.OrdStatus) {
        case ExecTypes.PendingCancel:
          break;
        case ExecTypes.Filled:
          if (isOCOEnabled()) {
            API.cancelAll(data.Symbol, data.Strategy, SidesMap[data.Side])
              .then(() => {
                  const runID = toRunId(data.Symbol, data.Strategy);
                  switch (SidesMap[data.Side]) {
                    case Sides.Buy:
                      dispatch(
                        createAction<any, A>($$(runID, RunActions.RemoveAllBids)),
                      );
                      break;
                    case Sides.Sell:
                      dispatch(
                        createAction<any, A>($$(runID, RunActions.RemoveAllOfrs)),
                      );
                      break;
                  }
                },
              );
          }
        // eslint-disable-next-line no-fallthrough
        case ExecTypes.PartiallyFilled:
          const type: string = $$('__ROW', data.Tenor, data.Symbol, data.Strategy, RowActions.Executed);
          // FIXME: to improve performance we should try to find a way to do this
          //        in a single dispatch
          dispatch(
            createAction<any, A>(WorkareaActions.SetLastExecution, data),
          );
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
export const store: Store = createStore(
  createReducer(dynamicReducers),
  {},
  enhancer,
);

