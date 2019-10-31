import {ITile} from 'interfaces/tile';
import {createBalancedTreeFromLeaves, getLeaves, MosaicNode} from 'react-mosaic-component';
import {Action} from 'redux/action';
import {WorkspaceAction} from 'redux/constants/workspaceConstants';
import {WorkspaceState, Node} from 'redux/stateDefs/workspaceState';
import {$$} from 'utils/stringPaster';

const genesisState: WorkspaceState = {
  tiles: {},
  tree: null,
};

const createTile = (tile: ITile, state: WorkspaceState): WorkspaceState => {
  const originalTree: Node = state.tree;
  const leaves: string[] = getLeaves<string>(originalTree);
  // Create a new tree based on the old one
  const tree: string | MosaicNode<string> | null = createBalancedTreeFromLeaves([...leaves, tile.id]);
  // Create a new tiles object
  const tiles: { [id: string]: ITile } = {...state.tiles, [tile.id]: tile};
  // Return the new state
  return {tree, tiles};
};

export const createWorkspaceReducer = (id: string, initialState: WorkspaceState = genesisState) => {
  return (state: WorkspaceState = initialState, {type, data}: Action<any>): WorkspaceState => {
    switch (type) {
      case $$(id, WorkspaceAction.AddTile):
        return {...state, ...createTile(data, state)};
      case $$(id, WorkspaceAction.UpdateTree):
        return {...state, tree: data};
      default:
        return state;
    }
  };
};

