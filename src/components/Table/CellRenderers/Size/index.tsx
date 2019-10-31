import {SizeLayout} from 'components/Table/CellRenderers/Size/layout';
import {TableInput} from 'components/TableInput';
import {EntryTypes} from 'interfaces/mdEntry';
import React, {ReactNode} from 'react';

interface SizeProps {
  type: EntryTypes;
  value?: string;
  mine: boolean;
}

export const Size: React.FC<SizeProps> = (props: SizeProps) => {
  const {value} = props;
  const classes: string[] = ['times'];
  if (props.mine)
    classes.push('clickable');
  const children: ReactNode[] = [
    <TableInput key={1} defaultValue={value || ''} readOnly={!props.mine}/>,
  ];
  const button = <div key={2} className={classes.join(' ')}/>;
  if (props.type === EntryTypes.Bid)
    children.push(button);
  else
    children.unshift(button);
  return (
    <SizeLayout>
      {children}
    </SizeLayout>
  );
};
