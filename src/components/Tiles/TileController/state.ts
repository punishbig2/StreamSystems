import {Geometry} from 'components/structures/geometry';
import {Point} from 'components/structures/point';

export interface State {
  geometry: Geometry;
  grabbedAt?: Point;
  drawingAway: boolean;
  hoveringAt?: Point;
  hovering: boolean;
}
