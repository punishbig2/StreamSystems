import {Button} from 'components/Tiles/Tile/TitleBar/button';
import {Container} from 'components/Tiles/Tile/TitleBar/container';
import {TBProps} from 'components/Tiles/Tile/TitleBar/props';
import {Title} from 'components/Tiles/Tile/TitleBar/title';
import React from 'react';

const getMaximizeIcon = (isDocked: boolean) => {
  if (!isDocked) {
    return 'fa fa-window-restore';
  }
  return 'fa fa-window-maximize';
};

export const TitleBar: React.FC<TBProps> = (props: TBProps) => {
  return (
    <Container onMouseDown={props.onGrab}>
      <Title>{props.title}</Title>
      <Button onClick={props.onMinimize}>
        <i className={'fa fa-window-minimize'}/>
      </Button>
      <Button onClick={props.onToggleDocking}>
        <i className={getMaximizeIcon(props.isDocked)}/>
      </Button>
    </Container>
  );
};
