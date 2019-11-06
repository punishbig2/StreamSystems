import {SizeLayout} from 'components/Table/CellRenderers/Quantity/layout';
import {TableInput} from 'components/TableInput';
import {EntryTypes} from 'interfaces/mdEntry';
import React, {ReactNode} from 'react';

interface SizeProps {
  type: EntryTypes;
  value: number | null;
  firm?: string;
  onChange: (value: number) => void;
  cancelable?: boolean;
  onCancel?: () => void;
}

export const Quantity: React.FC<SizeProps> = (props: SizeProps) => {
  const {value} = props;
  const classes: string[] = ['times'];
  const getValue = (): string => {
    if (value === null)
      return '';
    return value.toString();
  };
  const children: ReactNode[] = [
    <TableInput key={1} value={getValue()} aligned={'center'}
                onChange={(value: string) => props.onChange(Number(value))}/>,
  ];
  if (props.cancelable)
    classes.push('clickable');
  const button = <div key={2} className={classes.join(' ')} onClick={props.onCancel}/>;
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
