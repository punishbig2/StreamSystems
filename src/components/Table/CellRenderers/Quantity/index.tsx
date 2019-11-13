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
  color: 'red' | 'blue' | 'green' | 'black' | 'gray'
  hasCancelButton?: boolean;
}

const defaultProps: SizeProps = {
  type: EntryTypes.Invalid,
  value: null,
  onChange: () => null,
  cancelable: false,
  onCancel: () => null,
  color: 'black',
  hasCancelButton: true,
};

export const Quantity: React.FC<SizeProps> = (props: SizeProps = defaultProps) => {
  const {value} = props;
  const classes: string[] = ['times'];
  console.log(props.hasCancelButton);
  const getValue = (): string => {
    if (value === null)
      return '';
    return value.toString();
  };
  const children: ReactNode[] = [
    <TableInput key={1} value={getValue()} color={props.color} tabIndex={-1}
                onChange={(value: string) => props.onChange(Number(value))}/>,
  ];
  if (props.hasCancelButton !== false) {
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
  }
  return (
    <SizeLayout>
      {children}
    </SizeLayout>
  );
};

