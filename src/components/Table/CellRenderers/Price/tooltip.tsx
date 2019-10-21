import {TooltipContainer} from 'components/Table/CellRenderers/Price/tooltipContainer';
import React, {CSSProperties} from 'react';

interface TooltipProps {
  x: number;
  y: number;
  render: React.FC<any>,
}

export const Tooltip: React.FC<TooltipProps> = (props: TooltipProps) => {
  const style: CSSProperties = {left: props.x + 16, top: props.y + 16};
  return (
    <TooltipContainer style={style}>
      {props.render(0)}
    </TooltipContainer>
  );
};
