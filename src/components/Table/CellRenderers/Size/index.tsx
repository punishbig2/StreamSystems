import {SizeLayout} from 'components/Table/CellRenderers/Size/layout';
import {TableInput} from 'components/TableInput';
import {EntryTypes} from 'interfaces/mdEntry';
import React, {ReactNode} from 'react';

interface SizeProps {
  type: EntryTypes;
  value: number | null;
  firm?: string;
}

export const Size: React.FC<SizeProps> = (props: SizeProps) => {
  const {value} = props;
  const classes: string[] = ['times'];
  const children: ReactNode[] = [
    <TableInput key={1} defaultValue={(value && value.toString()) || ''} align={'center'}/>,
  ];
  const button = <div key={2} className={classes.join(' ')}/>;
  if (props.type === EntryTypes.Bid) {
    if (props.firm) {
      children.push(<div>{props.firm}</div>);
    }
    children.push(button);
  } else {
    children.unshift(button);
    if (props.firm) {
      children.push(<div>{props.firm}</div>);
    }
  }
  return (
    <SizeLayout>
      {children}
    </SizeLayout>
  );
};
