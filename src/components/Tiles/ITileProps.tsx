import {TileRenderer} from 'components/Tiles/tileRenderer';
import {ReactElement} from 'react';

export interface ITileProps {
  render: TileRenderer;
  id: string,
  title: (props: any) => ReactElement | null;
}
