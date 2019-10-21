import {Geometry} from 'components/structures/geometry';
import {Point} from 'components/structures/point';
import React from 'react';

export interface Props {
  id: string;
  children: React.ReactNode;
  grabbedAt?: Point;
  shouldDrawAway: boolean;
  isDocked: boolean;
  onInsertTile: () => void;
  geometry: Geometry;
}
