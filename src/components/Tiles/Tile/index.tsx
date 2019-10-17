import {ITileProps} from 'components/Tiles/ITileProps';
import {ReactElement} from 'react';
import React from 'react';

export const Tile: React.FC<ITileProps> = (props: ITileProps) => {
  return props.render(props) as ReactElement;
};
