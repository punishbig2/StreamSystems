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
    id: '1',
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

/*const setupTOBTile = (state: WorkareaState, data: any): WorkareaState => {
  const {tenors, user} = state;
  // The input data
  const {workspaceId, tileId, ...values} = data;
  // The map of all workspaces
  const workspaces: { [id: string]: IWorkspace } = state.workspaces;
  // The workspace the tile belongs to
  const workspace: IWorkspace = workspaces[data.workspaceId];
  // The internal properties of the tile
  const tiles: { [id: string]: ITile } = workspace.tiles as { [id: string]: ITile };
  // The old value of the tile (which was probably nothing at this point)
  const tile = tiles[data.tileId];
  // Initial data for the tile ... (then a real W message should arrive)
  const genesis: Message[] = tenors.map<Message>((tenor: string): Message => ({
    MsgType: MessageTypes.W,
    TransactTime: Date.now(),
    Symbol: tile.symbol as string,
    Strategy: tile.product as string,
    User: user.id,
    Tenor: tenor,
    NoMDEntries: 0,
    Entries: [],
  }));
  return {
    ...state,
    workspaces: {
      ...workspaces,
      [data.workspaceId]: {
        ...workspace,
        tiles: {
          ...tiles,
          [data.tileId]: {
            ...tile,
            ...values,
            data: genesis,
          },
        },
      },
    },
  };
};

const updateTileIfFound = (state: WorkareaState, data: any): WorkareaState => {
  // NOTE: this would be a very rare situation, but in case it becomes possible to be in
  //       a state where there's no active workspace just do nothing
  if (state.activeWorkspace === null)
    return state;
  // Find the tile now (this is so complex that it's basically wrong for now)
  const workspace: IWorkspace = state.workspaces[state.activeWorkspace];
  // Internal tile properties
  const tiles: { [id: string]: ITile } = workspace.tiles;
  // Find the tile that we want
  const entry: [string, ITile] | undefined = Object.entries(tiles)
    .find((value: [string, ITile]): value is [string, ITile] => data.Symbol === value[1].symbol);
  // If there's no tile of interest, just return the old state value so no updates
  // will occur on the DOM
  if (entry === undefined)
    return state;
  const [id, tile] = entry;
  // Find the target tenor and replace the message
  const messages: Message[] = [...tile.data];
  const index: number | undefined = messages.findIndex((message: Message): message is Message => {
    return message.Tenor === data.Tenor;
  });
  if (index === -1)
    throw new Error('a tenor was sent through the websocket but not in the gettenors response');
  const originalCopy: Message = {...messages[index]};
  // Alter the copy of the data array
  messages.splice(index, 1, {...originalCopy, ...data});
  // Return the new state
  return {
    ...state,
    workspaces: {
      ...state.workspaces,
      [state.activeWorkspace]: {
        ...workspace,
        tiles: {
          ...tiles,
          [id]: {
            ...tile,
            data: messages,
          },
        },
      },
    },
  };
};*/

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
      return state; // setupTOBTile(state, data);
    case WorkareaActions.Initializing:
      return state;
    case WorkareaActions.Initialized:
      return {...state, ...data};
    default:
      return state;
  }
};

