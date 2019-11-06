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

/*const setupTOBTile = (state: WorkareaState, row: any): WorkareaState => {
  const {tenors, user} = state;
  // The input row
  const {workspaceId, tileId, ...values} = row;
  // The map of all workspaces
  const workspaces: { [email: string]: IWorkspace } = state.workspaces;
  // The workspace the tile belongs to
  const workspace: IWorkspace = workspaces[row.workspaceId];
  // The internal properties of the tile
  const tiles: { [email: string]: ITile } = workspace.tiles as { [email: string]: ITile };
  // The old value of the tile (which was probably nothing at this point)
  const tile = tiles[row.tileId];
  // Initial row for the tile ... (then a real W message should arrive)
  const genesis: Message[] = tenors.map<Message>((tenor: string): Message => ({
    MsgType: MessageTypes.W,
    TransactTime: Date.now(),
    Symbol: tile.symbol as string,
    Strategy: tile.strategy as string,
    User: user.email,
    Tenor: tenor,
    NoMDEntries: 0,
    Entries: [],
  }));
  return {
    ...state,
    workspaces: {
      ...workspaces,
      [row.workspaceId]: {
        ...workspace,
        tiles: {
          ...tiles,
          [row.tileId]: {
            ...tile,
            ...values,
            row: genesis,
          },
        },
      },
    },
  };
};

const updateTileIfFound = (state: WorkareaState, row: any): WorkareaState => {
  // NOTE: this would be a very rare situation, but in case it becomes possible to be in
  //       a state where there's no active workspace just do nothing
  if (state.activeWorkspace === null)
    return state;
  // Find the tile now (this is so complex that it's basically wrong for now)
  const workspace: IWorkspace = state.workspaces[state.activeWorkspace];
  // Internal tile properties
  const tiles: { [email: string]: ITile } = workspace.tiles;
  // Find the tile that we want
  const entry: [string, ITile] | undefined = Object.entries(tiles)
    .find((value: [string, ITile]): value is [string, ITile] => row.Symbol === value[1].symbol);
  // If there's no tile of interest, just return the old state value so no updates
  // will occur on the DOM
  if (entry === undefined)
    return state;
  const [email, tile] = entry;
  // Find the target tenor and replace the message
  const messages: Message[] = [...tile.row];
  const index: number | undefined = messages.findIndex((message: Message): message is Message => {
    return message.Tenor === row.Tenor;
  });
  if (index === -1)
    throw new Error('a tenor was sent through the websocket but not in the gettenors response');
  const originalCopy: Message = {...messages[index]};
  // Alter the copy of the row array
  messages.splice(index, 1, {...originalCopy, ...row});
  // Return the new state
  return {
    ...state,
    workspaces: {
      ...state.workspaces,
      [state.activeWorkspace]: {
        ...workspace,
        tiles: {
          ...tiles,
          [email]: {
            ...tile,
            row: messages,
          },
        },
      },
    },
  };
};*/

export default (state: WorkareaState = initialState, {type, data}: Action<WorkareaActions>): WorkareaState => {
  switch (type) {
    case WorkareaActions.AddWorkspace:
      return {...state, workspaces: {...state.workspaces, [data.email]: data}, activeWorkspace: data.email};
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

