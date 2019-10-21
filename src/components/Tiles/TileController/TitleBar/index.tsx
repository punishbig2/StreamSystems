import {swallowEvent} from 'components/Tiles/Grid/helpers';
import {Button} from 'components/Tiles/TileController/TitleBar/button';
import {Container} from 'components/Tiles/TileController/TitleBar/container';
import {TBProps} from 'components/Tiles/TileController/TitleBar/props';
import {Title} from 'components/Tiles/TileController/TitleBar/title';
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
      <Title>{props.title(props)}</Title>
      <Button onMouseDownCapture={swallowEvent(() => null)} onClickCapture={swallowEvent(props.onMinimize)}>
        <i className={'fa fa-window-minimize'}/>
      </Button>
      <Button onMouseDownCapture={swallowEvent(() => null)} onClickCapture={swallowEvent(props.onToggleDocking)}>
        <i className={getMaximizeIcon(props.isDocked)}/>
      </Button>
    </Container>
  );
};
