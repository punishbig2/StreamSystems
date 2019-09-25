import {TileRenderer} from 'components/Tiles/tileRenderer';
import {ReactElement} from 'react';

export interface TileSiblings {
  next: ReactElement | null;
  prev: ReactElement | null;
}

export interface ITileProps {
  render: TileRenderer;
  title: string | null;
}
