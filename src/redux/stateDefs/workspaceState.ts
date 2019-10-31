import {ITile} from 'interfaces/tile';
import {MosaicNode} from 'react-mosaic-component';

export type Node = MosaicNode<string> | string | null;
export interface WorkspaceState {
  tiles: {[id: string]: ITile};
  tree: Node,
}
