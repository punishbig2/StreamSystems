import {
  combineReducers,
  createStore,
  Dispatch,
  Reducer,
  Store,
  Action,
  StoreEnhancer,
  StoreEnhancerStoreCreator,
  DeepPartial,
} from 'redux';
import {createAction, createWorkspaceAction} from 'redux/actionCreator';
// State shapes
import {ApplicationState} from 'redux/applicationState';
// Special action types
// Action enumerators
import {WorkareaActions} from 'redux/constants/workareaConstants';
// Reducers
import messageBlotterReducer from 'redux/reducers/messageBlotterReducer';
import workareaReducer from 'redux/reducers/workareaReducer';
import executionsReducer from 'redux/reducers/executionsReducer';
// Dynamic reducer creators
// Special object helper for connection management
import {SignalRManager} from 'redux/signalR/signalRManager';
// Websocket action parsers/converters
import {FXOptionsDB} from 'fx-options-db';
import {WorkspaceActions} from 'redux/constants/workspaceConstants';
import userProfileReducer from 'redux/reducers/userProfileReducer';
import {defaultWorkspaceState} from 'redux/stateDefs/workspaceState';
import {WindowState} from 'redux/stateDefs/windowState';
import {MessageBlotterActions} from 'redux/constants/messageBlotterConstants';
import {HubConnection, HubConnectionState} from '@microsoft/signalr';
import {SignalRAction} from 'redux/signalRAction';
import {AsyncAction} from 'redux/asyncAction';
import {getAuthenticatedUser} from 'utils/getCurrentUser';
import {SignalRActions} from 'redux/constants/signalRConstants';
import {Message, ExecTypes} from 'interfaces/message';
import {User} from 'interfaces/user';
import {API} from 'API';
import {$$} from 'utils/stringPaster';
import {RowActions} from 'components/Table/CellRenderers/Price/constants';
import {Sides} from 'interfaces/sides';

// Build the reducer from the fixed and dynamic reducers
export const createReducer = (): Reducer<ApplicationState, Action> => {
  return combineReducers<any, Action<any>>({
    workarea: workareaReducer,
    messageBlotter: messageBlotterReducer,
    userProfile: userProfileReducer,
    executions: executionsReducer,
  });
};

const SidesMap: { [key: string]: Sides } = {'1': Sides.Buy, '2': Sides.Sell};

const isOCOEnabled = (): boolean => {
  const state: ApplicationState = store.getState();
  if (!state)
    return true;
  const {profile} = state.userProfile;
  return profile.oco;
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
          dispatch(createWorkspaceAction(id, WorkspaceActions.AddWindow, window));
        }
      });
      return Promise.all(promises);
    }
  });
  return Promise.all(promises);
};

const connectionManager: SignalRManager<Action> = SignalRManager.getInstance();
export const DummyAction: Action = {type: '---not-valid---'};

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

    const onUpdateMessageBlotter = (data: Message) => {
      const user: User = getAuthenticatedUser();
      switch (data.OrdStatus) {
        case ExecTypes.PendingCancel:
          break;
        case ExecTypes.Filled:
          if (isOCOEnabled() && data.Username === user.email) {
            API.cancelAll(data.Symbol, data.Strategy, SidesMap[data.Side]);
          }
        // eslint-disable-next-line no-fallthrough
        case ExecTypes.PartiallyFilled:
          if (data.Username === user.email) {
            // FIXME: this should not be working right now right?
            const type: string = $$('__ROW', data.Tenor, data.Symbol, data.Strategy, RowActions.Executed);
            // FIXME: to improve performance we should try to find a way to do this
            //        in a single dispatch
            dispatch(createAction<any, A>(WorkareaActions.SetLastExecution, data));
            dispatch(createAction<any, A>(type));
          }
          dispatch(createAction<any, A>(MessageBlotterActions.Update, data));
          break;
        default:
          dispatch(createAction<any, A>(MessageBlotterActions.Update, data));
          break;
      }
    };
    // Setup the connection manager now
    connectionManager.setOnConnectedListener(onConnected);
    // connectionManager.setOnUpdateMarketDataListener(onUpdateMarketData);
    connectionManager.setOnDisconnectedListener(onDisconnected);
    connectionManager.setOnUpdateMessageBlotter(onUpdateMessageBlotter);
    // connectionManager.setOnUpdateDarkPoolPxListener(onUpdateDarkPoolPx);
    connectionManager.connect();

    hydrate(dispatch);
    // Build a new store with the modified dispatch
    return {...store, dispatch};
  };
};
// Create the store
export const store: Store = createStore(
  createReducer(),
  {},
  enhancer,
);

