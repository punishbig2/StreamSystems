import { NumericInput } from 'components/NumericInput';
import { NavigateDirection } from 'components/NumericInput/navigateDirection';
import { Chevron } from 'components/Table/CellRenderers/Price/chevron';
import React, { ReactNode, useEffect, useState } from 'react';
import { OrderTypes } from 'types/mdEntry';
import { sizeFormatter } from 'utils/sizeFormatter';
import { xPoints } from 'utils/timesPolygon';

interface Props {
  readonly type: OrderTypes;
  readonly value: number | null;
  readonly uid: string;
  readonly cancellable?: boolean;
  readonly onCancel?: () => void;
  readonly className?: string;
  readonly hideCancelButton?: boolean;
  readonly chevron?: boolean;
  readonly tabIndex?: number;
  readonly readOnly?: boolean;
  readonly onSubmit: (target: HTMLInputElement, value: number | null) => void;
  readonly onNavigate?: (input: HTMLInputElement, direction: NavigateDirection) => void;
}

const defaultProps: Props = {
  onCancel: () => null,
  onSubmit: () => null,
  uid: '',
  hideCancelButton: false,
  type: OrderTypes.Invalid,
  value: null,
  cancellable: false,
  chevron: false,
};

export const Size: React.FC<Props> = (props: Props = defaultProps) => {
  const { value } = props;
  const [internalValue, setInternalValue] = useState<number | null>(value);
  const classes: string[] = ['times'];

  // If value prop changes, change our internal representation too
  useEffect(() => {
    setInternalValue(value);
  }, [value]);

  const onChange = (value: string | null): void => {
    if (value === null) {
      setInternalValue(value);
    } else {
      const numeric = Number(value);
      if (isNaN(numeric)) {
        setInternalValue(null);
      } else {
        setInternalValue(numeric);
      }
    }
  };

  const onSubmit = (input: HTMLInputElement): void => {
    props.onSubmit(input, internalValue);
  };

  const onBlur = (): void => {
    setInternalValue(value);
  };

  const children: ReactNode[] = [
    <NumericInput
      key={1}
      id={props.uid}
      value={sizeFormatter(internalValue)}
      type="size"
      className={props.className}
      tabIndex={props.tabIndex}
      readOnly={props.readOnly}
      onNavigate={props.onNavigate}
      onBlur={onBlur}
      onChange={onChange}
      onSubmit={onSubmit}
    />,
  ];

  if (props.readOnly) classes.push('readonly');
  if (props.cancellable) classes.push('clickable');
  if (props.value === null || props.hideCancelButton) classes.push('empty');

  const button = (
    <div key={2} className={classes.join(' ')} onClick={props.onCancel}>
      <svg viewBox="0 0 612 792">
        <g>
          <polygon className="st0" points={xPoints} />
        </g>
      </svg>
    </div>
  );

  if (props.type === OrderTypes.Bid) {
    if (props.chevron) children.push(<Chevron side="left" key={3} />);
    children.push(button);
  } else {
    children.unshift(button);
    if (props.chevron) children.push(<Chevron side="right" key={3} />);
  }
  const layoutClasses: string[] = ['size-layout', 'cell'];
  if (props.className) layoutClasses.push(props.className);
  return <div className={layoutClasses.join(' ')}>{children}</div>;
};
