import {NumericInput} from 'components/NumericInput';
import {Chevron} from 'components/Table/CellRenderers/Price/chevron';
import {OrderTypes} from 'interfaces/mdEntry';
import React, {ReactNode} from 'react';
import {sizeFormatter} from 'utils/sizeFormatter';

interface OwnProps {
  type: OrderTypes;
  value: number | null;
  onChange: (value: string | null) => void;
  cancellable?: boolean;
  onCancel?: () => void;
  className?: string;
  chevron?: boolean;
  onSubmitted: (target: HTMLInputElement) => void;
  tabIndex?: number;
}

const defaultProps: OwnProps = {
  onChange: () => null,
  onCancel: () => null,
  onSubmitted: () => null,
  type: OrderTypes.Invalid,
  value: null,
  cancellable: false,
  chevron: false,
};

export const Quantity: React.FC<OwnProps> = (props: OwnProps = defaultProps) => {
  const {value} = props;

  const classes: string[] = ['times'];
  const children: ReactNode[] = [
    <NumericInput
      key={1}
      value={value !== undefined ? sizeFormatter(value) : ''}
      type={'size'}
      className={props.className}
      tabIndex={props.tabIndex}
      onChange={props.onChange}
      onSubmitted={props.onSubmitted}/>,
  ];

  if (props.cancellable)
    classes.push('clickable');
  if (props.value === null)
    classes.push('empty');
  const button = (
    <div key={2} className={classes.join(' ')} onClick={props.onCancel}>
      <i/>
    </div>
  );
  if (props.type === OrderTypes.Bid) {
    if (props.chevron) children.push(<Chevron side={'left'} key={3}/>);
    children.push(button);
  } else {
    children.unshift(button);
    if (props.chevron) children.push(<Chevron side={'right'} key={3}/>);
  }
  return (
    <div className={['size-layout', props.className].join(' ')}>{children}</div>
  );
};
