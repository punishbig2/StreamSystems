import {IWorkspace} from 'interfaces/workspace';
import {Action} from 'redux/action';
import {WorkareaActions} from 'redux/constants/workareaConstants';
import {WorkareaState} from 'redux/stateDefs/workareaState';

const initialState: WorkareaState = {
  workspaces: {},
  activeWorkspace: null,
  symbols: [],
  tenors: [],
  products: [],
  user: {
    email: '1',
    isBroker: true,
  },
};

const removeWorkspace = (state: WorkareaState, id: string): WorkareaState => {
  // This is actually a copy
  const workspaces: { [id: string]: IWorkspace } = {...state.workspaces};
  // Remove it from the workspaces list
  delete workspaces[id];
  // Get the new active if the old one was the deleted one
  const newActive = (): string | null => {
    const values: IWorkspace[] = Object.values(workspaces);
    if (values.length === 0)
      return null;
    return id === state.activeWorkspace ? values[0].id : state.activeWorkspace;
  };
  // Return the "new" object
  return {...state, activeWorkspace: newActive(), workspaces};
};

const renameWorkspace = (state: WorkareaState, {name, id}: IWorkspace): WorkareaState => {
  // All the workspaces
  const workspaces: { [id: string]: IWorkspace } = state.workspaces;
  // The target workspace
  const workspace: IWorkspace | undefined = workspaces[id];
  // If we don't find a target workspace, something is really wrong
  if (workspace === undefined)
    throw new Error('cannot rename the workspace, it was not found');
  // Create the new object
  return {...state, workspaces: {...workspaces, [id]: {...workspace, name}}};
};

export default (state: WorkareaState = initialState, {type, data}: Action<WorkareaActions>): WorkareaState => {
  switch (type) {
    case WorkareaActions.AddWorkspace:
      return {...state, workspaces: {...state.workspaces, [data.id]: data}, activeWorkspace: data.id};
    case WorkareaActions.SetWorkspace:
      return {...state, activeWorkspace: data};
    case WorkareaActions.CloseWorkspace:
      return removeWorkspace(state, data);
    case WorkareaActions.RenameWorkspace:
      return renameWorkspace(state, data);
    case WorkareaActions.SetupTOBTile:
      return state; // setupTOBTile(state, row);
    case WorkareaActions.Initializing:
      return state;
    case WorkareaActions.Initialized:
      return {...state, ...data};
    default:
      return state;
  }
};

