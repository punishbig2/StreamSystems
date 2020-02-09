import {User} from 'interfaces/user';
import {SignalRActions} from 'redux/constants/signalRConstants';
import {WorkareaActions} from 'redux/constants/workareaConstants';
import {WorkareaState, WorkareaStatus} from 'redux/stateDefs/workareaState';
import {FXOAction} from 'redux/fxo-action';
import {WorkspaceActions} from 'redux/constants/workspaceConstants';
import {WorkspaceState} from 'redux/stateDefs/workspaceState';
import {workspaceReducer} from 'redux/reducers/workspaceReducer';

const initialState: WorkareaState = {
  workspaces: {},
  activeWorkspace: null,
  symbols: [],
  tenors: [],
  products: [],
  messages: [],
  banks: [],
  status: WorkareaStatus.Starting,
  connected: false,
  lastExecution: null,
};

const removeWorkspace = (state: WorkareaState, id: string): WorkareaState => {
  // This is actually a copy
  const workspaces: { [id: string]: WorkspaceState } = {...state.workspaces};
  // Remove it from the workspaces list
  delete workspaces[id];
  // Get the new active if the old one was the deleted one
  const newActive = (): string | null => {
    const values: WorkspaceState[] = Object.values(workspaces);
    if (values.length === 0)
      return null;
    return id === state.activeWorkspace ? values[0].id : state.activeWorkspace;
  };
  // Return the "new" object
  return {...state, activeWorkspace: newActive(), workspaces};
};

const renameWorkspace = (state: WorkareaState, {name, id}: WorkspaceState): WorkareaState => {
  // All the workspaces
  const workspaces: { [id: string]: WorkspaceState } = state.workspaces;
  // The target workspace
  const workspace: WorkspaceState | undefined = workspaces[id];
  // If we don't find a target workspace, something is really wrong
  if (workspace === undefined)
    throw new Error('cannot rename the workspace, it was not found');
  // Create the new object
  return {
    ...state,
    workspaces: {...workspaces, [id]: {...workspace, name}},
  };
};

const initialize = (state: WorkareaState, data: any): WorkareaState => {
  const {users, ...rest} = data;
  const {location} = window;
  const urlParameters: URLSearchParams = new URLSearchParams(location.search);
  const email: string | null = urlParameters.get('user');
  const user: User | undefined = users.find(
    (user: User): boolean => user.email === email,
  );
  if (!user) return {...state, status: WorkareaStatus.UserNotFound};
  return {
    ...state,
    ...rest,
    user: user,
    originalUser: user,
    status: WorkareaStatus.Ready,
  };
};

type ActionType = WorkareaActions & SignalRActions & WorkspaceActions;

const nextReducer = (state: WorkareaState, action: FXOAction<ActionType>) => {
  const values: string[] = Object.values(WorkspaceActions);
  if (values.includes(action.type)) {
    const workspaces: { [id: string]: WorkspaceState } = state.workspaces;
    const id: string = action.workspaceID;
    return {
      ...state,
      workspaces: {
        ...workspaces,
        [id]: workspaceReducer(workspaces[id], action),
      },
    };
  } else {
    return state;
  }
};

export default (state: WorkareaState = initialState, action: FXOAction<ActionType>): WorkareaState => {
  const {type, data} = action;
  switch (type) {
    case SignalRActions.Connected:
      return {...state, connected: true};
    case SignalRActions.Disconnected:
      return {...state, connected: false};
    case WorkareaActions.AddWorkspace:
      return {
        ...state,
        workspaces: {...state.workspaces, [data.id]: data},
        activeWorkspace: data.id,
      };
    case WorkareaActions.SetWorkspace:
      return {...state, activeWorkspace: data};
    case WorkareaActions.CloseWorkspace:
      return removeWorkspace(state, data);
    case WorkareaActions.RenameWorkspace:
      return renameWorkspace(state, data);
    case WorkareaActions.SetupTOBTile:
      return state;
    case WorkareaActions.Initializing:
      return {...state, status: WorkareaStatus.Initializing};
    case WorkareaActions.Initialized:
      return initialize(state, data);
    case WorkareaActions.LoadingSymbols:
      return {...state, message: 'Loading Symbols'};
    case WorkareaActions.LoadingStrategies:
      return {...state, message: 'Loading Strategies'};
    case WorkareaActions.LoadingTenors:
      return {...state, message: 'Loading Tenors'};
    case WorkareaActions.LoadingMessages:
      return {...state, message: 'Loading Messages'};
    case WorkareaActions.LoadingUsersList:
      return {...state, message: 'Loading User Information'};
    case WorkareaActions.ServerUnavailable:
      return {...state, status: WorkareaStatus.Error};
    case WorkareaActions.SetLastExecution:
      return {...state, lastExecution: data};
    case WorkareaActions.ClearLastExecution:
      return {...state, lastExecution: null};
    default:
      return nextReducer(state, action);
  }
};
