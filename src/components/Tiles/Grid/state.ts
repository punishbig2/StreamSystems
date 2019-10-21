import {Geometry} from 'components/structures/geometry';

export interface State {
  tiles: any;
  boundingBox?: Geometry;
  grabbedId?: string;
  insertId?: string;
}
