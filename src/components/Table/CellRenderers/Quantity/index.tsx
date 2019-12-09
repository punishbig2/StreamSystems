import {NumericInput} from 'components/NumericInput';
import {Chevron} from 'components/Table/CellRenderers/Price/chevron';
import {OrderTypes} from 'interfaces/mdEntry';
import React, {ReactNode} from 'react';

interface OwnProps {
  type: OrderTypes;
  value: number | null;
  firm?: string;
  onChange: (value: string | null) => void;
  cancelable?: boolean;
  onCancel?: () => void;
  onBlur?: () => void;
  className?: string;
  chevron?: boolean;
  onTabbedOut?: (target: HTMLInputElement) => void;
  tabIndex?: number;
}

const defaultProps: OwnProps = {
  onChange: () => null,
  onCancel: () => null,
  type: OrderTypes.Invalid,
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
    <NumericInput key={1}
                  value={getValue()}
                  className={props.className}
                  onTabbedOut={props.onTabbedOut}
                  onChange={(value: string | null) => props.onChange(value)}
                  onBlur={props.onBlur}
                  tabIndex={props.tabIndex}/>,
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
  if (props.type === OrderTypes.Bid) {
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

