import {Point} from 'components/structures/point';
import {Geometry} from 'components/structures/geometry';

export interface TileState {
  geometry: Geometry;
  grabbedAt?: Point;
  isDocked: boolean;
  id: string | number | symbol;
  readyToInsertBefore: boolean;
  next: TileState | null;
  prev: TileState | null;
}
