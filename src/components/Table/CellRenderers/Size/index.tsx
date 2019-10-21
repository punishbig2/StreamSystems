import {SizeLayout} from 'components/Table/CellRenderers/Size/layout';
import {Types} from 'models/mdEntry';
import React, {ReactNode} from 'react';

interface SizeProps {
  type: Types;
  value: number;
  mine: boolean;
}

export const Size: React.FC<SizeProps> = (props: SizeProps) => {
  const {value} = props;
  const classes: string[] = ['times'];
  if (props.mine)
    classes.push('clickable');
  const children: ReactNode[] = [<div key={1}>{value.toFixed(0)}</div>];
  const button = <div key={2} className={classes.join(' ')}/>;
  if (props.type === Types.Bid)
    children.push(button);
  else
    children.unshift(button);
  return (
    <SizeLayout>{children}</SizeLayout>
  );
};
