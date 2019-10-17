import {TileState} from 'components/Tiles/Grid/tileState';
import {Geometry} from 'components/structures/geometry';

export interface State {
  tiles: any;
  boundingBox?: Geometry;
  grabbed?: TileState;
  inserting?: TileState;
}
