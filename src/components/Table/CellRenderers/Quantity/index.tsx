import {TableInput} from 'components/NumericInput';
import {Chevron} from 'components/Table/CellRenderers/Price/chevron';
import {EntryTypes} from 'interfaces/mdEntry';
import React, {ReactNode} from 'react';

interface OwnProps {
  type: EntryTypes;
  value: number | null;
  firm?: string;
  onChange: (value: string) => void;
  cancelable?: boolean;
  onCancel?: () => void;
  onBlur?: () => void;
  className?: string;
  chevron?: boolean;
}

const defaultProps: OwnProps = {
  onChange: () => null,
  onCancel: () => null,
  type: EntryTypes.Invalid,
  value: null,
  cancelable: false,
  chevron: false,
};

export const Quantity: React.FC<OwnProps> = (props: OwnProps = defaultProps) => {
  const {value} = props;
  const classes: string[] = ['times'];
  const getValue = (): string => {
    if (value === null || value === undefined)
      return '';
    return value.toString();
  };
  const children: ReactNode[] = [
    <TableInput key={1} value={getValue()} tabIndex={-1} className={props.className}
                onChange={(value: string) => props.onChange(value)} onBlur={props.onBlur}/>,
  ];

  if (props.cancelable)
    classes.push('clickable');
  if (props.value === null)
    classes.push('empty');
  const button = (
    <div key={2} className={classes.join(' ')} onClick={props.onCancel}>
      <i/>
    </div>
  );
  if (props.type === EntryTypes.Bid) {
    if (props.firm)
      children.push(<div>{props.firm}</div>);
    if (props.chevron)
      children.push(<Chevron side={'left'} key={3}/>);
    children.push(button);
  } else {
    children.unshift(button);
    if (props.chevron)
      children.push(<Chevron side={'right'} key={3}/>);
    if (props.firm)
      children.push(<div>{props.firm}</div>);
  }
  return (
    <div className={'size-layout'}>
      {children}
    </div>
  );
};

