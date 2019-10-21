import {Point} from 'components/structures/point';
import {Geometry} from 'components/structures/geometry';
import {ReactElement, ReactNode} from 'react';

export interface TileList {
  geometry: Geometry;
  grabbedAt?: Point;
  isDocked: boolean;
  id: string;
  readyToInsertBefore: boolean;
  title: (props: any) => ReactElement;
  content: ReactNode,
  next: TileList | null;
  prev: TileList | null;
}
