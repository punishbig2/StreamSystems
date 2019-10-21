import {Geometry} from 'components/structures/geometry';
import {Point} from 'components/structures/point';
import {ReactNode} from 'react';

export interface Props {
  geometry: Geometry;
  isDocked: boolean;
  id: string;
  children: ReactNode;
  grabbedAt?: Point;
  shouldMove: boolean;
  onInsertTile: () => void;
}
