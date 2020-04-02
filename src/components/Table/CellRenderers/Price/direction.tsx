import { ArrowDirection } from 'interfaces/w';
import React, { ReactElement } from 'react';

interface DirectionProps {
  direction: ArrowDirection;
}

export const Direction = (props: DirectionProps): ReactElement => {
  const arrows: { [key: string]: string } = {
    [ArrowDirection.None]: 'none',
    [ArrowDirection.Up]: 'up',
    [ArrowDirection.Down]: 'down',
  };
  const icon = props.direction
    ? `fa fa-long-arrow-alt-${arrows[props.direction]}`
    : undefined;
  return (
    <div className={'price-direction-layout'}>
      <i className={icon}/>
    </div>
  );
};
