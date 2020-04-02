// import {SignalRManager} from 'redux/signalR/signalRManager';
// import {
//   createStore,
//   Dispatch,
//   Reducer,
//   Store,
//   Action,
//   StoreEnhancer,
//   StoreEnhancerStoreCreator,
//   DeepPartial,
// } from 'redux';
// import {createAction} from 'redux/actionCreator';
// // State shapes
// import {ApplicationState} from 'redux/applicationState';
// // Special action types
// // Action enumerators
// // Reducers
// // Dynamic reducer creators
// // Special object helper for connection management
// // Websocket action parsers/converters
// import {HubConnection, HubConnectionState} from '@microsoft/signalr';
// import {SignalRAction} from 'redux/signalRAction';
// import {AsyncAction} from 'redux/asyncAction';
// import {SignalRActions} from 'redux/constants/signalRConstants';
// import {Message} from 'interfaces/message';
// import {OCOModes} from 'interfaces/user';
// import {Sides} from 'interfaces/sides';
//
// import rootReducer from 'redux/rootReducer';
//
// /*const preloadState: ApplicationState = {
//   workarea: defaultWorkareaState,
//   messageBlotter: defaultMessageBlotterState,
//   userProfile: defaultUserProfileState,
//   executions: [],
// };*/
//
// const SidesMap: { [key: string]: Sides } = {'1': Sides.Buy, '2': Sides.Sell};
//
// const getOCOMode = (): OCOModes => {
//   const state: ApplicationState = store.getState();
//   if (!state)
//     return OCOModes.Disabled;
//   const {profile} = state.userProfile;
//   return profile.oco;
// };
//
// /*const hydrate = async (dispatch: Dispatch<any>) => {
//   const email: string | null = getUserFromUrl();
//   const workspaces: string[] = await FXOptionsDB.getWorkspacesList();
//   const promises = workspaces.map(async (id: string) => {
//     if (email !== null)
//       await FXOptionsDB.initialize(email);
//     const name: string = await FXOptionsDB.getWorkspaceName(id);
//     const personality: string = await FXOptionsDB.getPersonality(id);
//
//     dispatch(createAction<any, any>(WorkareaActions.AddWorkspace, {...defaultWorkspaceState, id, name, personality}));
//     const tiles: string[] | undefined = await FXOptionsDB.getWindowsList(id);
//     if (tiles) {
//       const promises = tiles.map(async (windowID: string) => {
//         const window: WindowState | undefined = await FXOptionsDB.getWindow(windowID);
//         if (window !== undefined) {
//           dispatch(createWorkspaceAction(id, WorkspaceActions.AddWindow, window));
//         }
//       });
//       return Promise.all(promises);
//     }
//   });
//   return Promise.all(promises);
// };*/
//
// const connectionManager: SignalRManager<Action> = SignalRManager.getInstance();
// export const DummyAction: Action = {type: '---not-valid---'};
//
// const enhancer: StoreEnhancer = (nextCreator: StoreEnhancerStoreCreator) => {
//   let connection: HubConnection | null = null;
//   // Return a store creator
//   return <S, A extends Action>(reducer: Reducer<S, A>, preloadedState?: DeepPartial<S>) => {
//     const actionQueue: SignalRAction<A>[] = [];
//     // FIXME: we can load the state here actually
//     const store: Store<S, A> = nextCreator(reducer, preloadedState);
//     // We have created the store
//     const $dispatch: Dispatch<A> = store.dispatch;
//     // Extract the "api"
//     // Create a new custom dispatch function
//     const dispatch: Dispatch<A> = <T extends A>(action: A): T => {
//       if (action instanceof AsyncAction) {
//         action.handle($dispatch);
//         return DummyAction as T;
//       } else if (action instanceof SignalRAction) {
//         setTimeout(() => {
//           if (connection !== null) {
//             if (connection.state === HubConnectionState.Connected) {
//               action.handle(connection);
//             } else {
//               actionQueue.push(action);
//             }
//           } else {
//             actionQueue.push(action);
//           }
//         }, 0);
//       } else {
//         return $dispatch(action) as T;
//       }
//       return DummyAction as T;
//     };
//     // Here go all the listeners
//     const onConnected = (newConnection: HubConnection) => {
//       // Update the connection reference
//       connection = newConnection;
//       // Dispatch an action to notify successful connection
//       dispatch(createAction<any, A>(SignalRActions.Connected));
//       // Dispatch all the actions from the queue
//       actionQueue.forEach((action: SignalRAction<A>) => {
//         if (connection !== null) {
//           action.handle(connection);
//         }
//       });
//       actionQueue.splice(0, actionQueue.length);
//     };
//     const onDisconnected = () => {
//       // Update the connection reference
//       connection = null;
//       // Dispatch an action to notify disconnection
//       dispatch(createAction<any, A>(SignalRActions.Disconnected));
//     };
//
//     const onUpdateMessageBlotter = (data: Message) => {
//       /*const ocoMode: OCOModes = getOCOMode();
//       switch (data.OrdStatus) {
//         case ExecTypes.PendingCancel:
//           break;
//         case ExecTypes.Filled:
//           if (ocoMode !== OCOModes.Disabled && data.Username === user.email) {
//             API.cancelAll(data.Symbol, data.Strategy, SidesMap[data.Side]);
//           }
//         // eslint-disable-next-line no-fallthrough
//         case ExecTypes.PartiallyFilled:
//           const type: string = $$(data.ExecID, MessageBlotterActions.Executed);
//           if (ocoMode === OCOModes.PartialEx && data.Username === user.email) {
//             API.cancelAll(data.Symbol, data.Strategy, SidesMap[data.Side]);
//           }
//           if (data.Username === user.email) {
//             // FIXME: this should not be working right now right?
//             // FIXME: to improve performance we should try to find a way to do this
//             //        in a single dispatch
//             dispatch(createAction<any, A>(WorkareaActions.SetLastExecution, data));
//             // dispatch(createAction<any, A>(type));
//           }
//           dispatch(createAction<any, A>(MessageBlotterActions.Update, data));
//           // Execute after the system had time to update the state and hence
//           // create the row in the blotters
//           setTimeout(() => {
//             document.dispatchEvent(new CustomEvent(type));
//           }, 100);
//           break;
//         default:
//           dispatch(createAction<any, A>(MessageBlotterActions.Update, data));
//           break;
//       }*/
//     };
//     // Setup the connection manager now
//     connectionManager.setOnConnectedListener(onConnected);
//     connectionManager.setOnDisconnectedListener(onDisconnected);
//     connectionManager.setOnUpdateMessageBlotter(onUpdateMessageBlotter);
//     connectionManager.connect();
//
//     // hydrate(dispatch);
//     // Build a new store with the modified dispatch
//     return {...store, dispatch};
//   };
// };
//
// // Create the store
// export const store: Store = createStore(
//   rootReducer,
//   {},
//   enhancer,
// );

import { Action } from 'redux';

export const store = null;
export const DummyAction: Action = { type: '---not-valid---' };
