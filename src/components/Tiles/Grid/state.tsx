import {Geometry} from 'components/Tiles/Tile/geometry';
import {ReactNode} from 'react';

export interface GridState {
  boundingBox: Geometry;
  tiles: ReactNode[];
  currentlyDraggingTileKey: string | null;
  currentlyMakingRoomKey: string | null;
  isDocked: Map<any, boolean>;
}
