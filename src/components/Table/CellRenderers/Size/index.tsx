import { NumericInput } from 'components/NumericInput';
import { Chevron } from 'components/Table/CellRenderers/Price/chevron';
import { OrderTypes } from 'interfaces/mdEntry';
import React, { ReactNode } from 'react';
import { sizeFormatter } from 'utils/sizeFormatter';
import { NavigateDirection } from 'components/NumericInput/navigateDirection';
import { xPoints } from 'timesPolygon';

interface OwnProps {
  type: OrderTypes;
  value: number | null;
  onChange: (value: string | null) => void;
  cancellable?: boolean;
  onCancel?: () => void;
  className?: string;
  chevron?: boolean;
  tabIndex?: number;
  readOnly?: boolean;
  onSubmit: (target: HTMLInputElement) => void;
  onNavigate?: (input: HTMLInputElement, direction: NavigateDirection) => void;
  onBlur?: (event: React.FocusEvent<HTMLInputElement>) => void;
}

const defaultProps: OwnProps = {
  onChange: () => null,
  onCancel: () => null,
  onSubmit: () => null,
  type: OrderTypes.Invalid,
  value: null,
  cancellable: false,
  chevron: false,
};

export const Size: React.FC<OwnProps> = (props: OwnProps = defaultProps) => {
  const { value } = props;

  const classes: string[] = ['times'];
  const children: ReactNode[] = [
    <NumericInput
      key={1}
      value={value !== undefined ? sizeFormatter(value) : ''}
      type={'size'}
      className={props.className}
      tabIndex={props.tabIndex}
      readOnly={props.readOnly}
      onBlur={props.onBlur}
      onChange={props.onChange}
      onNavigate={props.onNavigate}
      onSubmit={props.onSubmit}/>,
  ];

  if (props.cancellable)
    classes.push('clickable');
  if (props.value === null)
    classes.push('empty');
  const button = (
    <div key={2} className={classes.join(' ')} onClick={props.onCancel}>
      <svg viewBox={'0 0 612 792'}>
        <g>
          <polygon className={'st0'} points={xPoints}/>
        </g>
      </svg>
    </div>
  );
  if (props.type === OrderTypes.Bid) {
    if (props.chevron)
      children.push(<Chevron side={'left'} key={3}/>);
    children.push(button);
  } else {
    children.unshift(button);
    if (props.chevron)
      children.push(<Chevron side={'right'} key={3}/>);
  }
  const layoutClasses: string[] = ['size-layout', 'cell'];
  if (!!props.className)
    layoutClasses.push(props.className);
  return (
    <div className={layoutClasses.join(' ')}>{children}</div>
  );
};

