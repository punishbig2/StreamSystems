import React, {CSSProperties} from 'react';
import ReactDOM from 'react-dom';

interface TooltipProps {
  x: number;
  y: number;
  render: React.FC<any>;
}

export const Tooltip: React.FC<TooltipProps> = (props: TooltipProps) => {
  const style: CSSProperties = {left: props.x + 16, top: props.y + 16};
  const child = (
    <div className={'tooltip'} style={style}>
      {props.render(0)}
    </div>
  );
  return ReactDOM.createPortal(child, document.body);
};
