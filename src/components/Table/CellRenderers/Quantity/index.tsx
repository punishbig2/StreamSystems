import {SizeLayout} from 'components/Table/CellRenderers/Quantity/layout';
import {TableInput} from 'components/TableInput';
import {EntryTypes} from 'interfaces/mdEntry';
import React, {ReactNode} from 'react';

interface SizeProps {
  type: EntryTypes;
  value: number | null;
  firm?: string;
  onChange: (value: string) => void;
  cancelable?: boolean;
  onCancel?: () => void;
  hasCancelButton?: boolean;
  className?: string;
}

const defaultProps: SizeProps = {
  type: EntryTypes.Invalid,
  value: null,
  onChange: () => null,
  cancelable: false,
  onCancel: () => null,
  hasCancelButton: true,
};

export const Quantity: React.FC<SizeProps> = (props: SizeProps = defaultProps) => {
  const {value} = props;
  const classes: string[] = ['times'];
  const getValue = (): string => {
    if (value === null)
      return '';
    return value.toString();
  };
  const children: ReactNode[] = [
    <TableInput key={1} value={getValue()} tabIndex={-1} className={props.className}
                onChange={(value: string) => props.onChange(value)}/>,
  ];
  if (props.hasCancelButton === false) {
  } else {
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

