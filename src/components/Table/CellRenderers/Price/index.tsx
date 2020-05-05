import { NumericInput, TabDirection } from 'components/NumericInput';
import { NavigateDirection } from 'components/NumericInput/navigateDirection';
import { Direction } from 'components/Table/CellRenderers/Price/direction';
import { PriceTypes } from 'components/Table/CellRenderers/Price/priceTypes';
import { getOrderStatusClass } from 'components/Table/CellRenderers/Price/utils/getOrderStatusClass';
import { OrderTypes } from 'interfaces/mdEntry';
import { ArrowDirection } from 'interfaces/w';
import React, { ReactElement, useState, useEffect } from 'react';
import { priceFormatter } from 'utils/priceFormatter';
import { Tooltip } from 'components/Table/CellRenderers/Price/tooltip';
import { OrderStatus } from 'interfaces/order';
import { CircularSpinner } from 'circularSpinner';
import { observer } from 'mobx-react';
import { PriceStore } from 'mobx/stores/priceStore';

export enum PriceErrors {
  GreaterThanMax,
  LessThanMin
}

export interface Props {
  value: number | null;
  type?: OrderTypes;
  priceType?: PriceTypes;
  // Events
  tabIndex?: number;
  arrow: ArrowDirection;
  status: OrderStatus;
  title?: string;
  className?: string;
  min?: number | null;
  max?: number | null;
  allowZero?: boolean;
  animated?: boolean;
  readOnly?: boolean;
  uid?: string;
  timestamp?: string;
  tooltip?: React.FC<any> | string;
  onTabbedOut?: (input: HTMLInputElement, tabDirection: TabDirection) => void;
  onNavigate?: (target: HTMLInputElement, direction: NavigateDirection) => void;
  onError?: (error: PriceErrors, input: HTMLInputElement) => void;
  onDoubleClick?: () => void;
  onSubmit: (input: HTMLInputElement, value: number | null, changed: boolean, tabDirection: TabDirection) => void;
}

export const Price: React.FC<Props> = observer((props: Props) => {
  const [store] = useState<PriceStore>(new PriceStore());
  const { value, status, tooltip } = props;
  if (value === undefined)
    throw new Error('value is not optional');

  useEffect(() => {
    store.setBaseValue(value);
  }, [store, value]);

  useEffect(() => {
    store.setStatus(status);
  }, [store, status]);

  const [target, setTarget] = useState<HTMLDivElement | null>(null);

  const showTooltip = tooltip ? (event: React.MouseEvent<HTMLDivElement>) => {
    store.showTooltip();
  } : undefined;

  const hideTooltip = () => store.hideTooltip();

  /*const startFlashing = () => {
    if (!props.animated)
      return;
    store.setFlashing(true);
  };
  const stopFlashing = () => store.setFlashing(false);*/

  const getTooltip = (): ReactElement | null => {
    if (!tooltip || !store.tooltipVisible)
      return null;
    const content: ReactElement | string | null = typeof tooltip === 'function' ? tooltip({}) : tooltip;
    if (!content)
      return null;
    return (
      <Tooltip target={target} onClose={hideTooltip}>
        {content}
      </Tooltip>
    );
  };

  const onChange = (value: string | null) => {
    if (value !== null) {
      const trimmed: string = value.trim();
      const numeric: number = Number(`0${trimmed}`);
      if (!isNaN(numeric)) {
        store.setInternalValue(trimmed);
      }
    } else {
      store.setInternalValue(value);
    }
  };

  const isOpenOrderTicketStatus = (status: OrderStatus): boolean => {
    if ((status & OrderStatus.DarkPool) !== 0)
      return true;
    return ((status & OrderStatus.Owned) === 0 && (status & OrderStatus.SameBank) === 0);
  };

  const onDoubleClick = (event: React.MouseEvent<HTMLInputElement>) => {
    // Stop the event
    event.stopPropagation();
    event.preventDefault();
    if (props.onDoubleClick && isOpenOrderTicketStatus(props.status)) {
      const target: HTMLInputElement = event.currentTarget;
      // Remove focus and selection
      target.setSelectionRange(0, 0);
      target.blur();
      // Call the callback
      return props.onDoubleClick();
    }
  };

  const isModified = (): boolean => {
    return store.internalValue !== null;
  };

  const onSubmit = (input: HTMLInputElement, tabDirection: TabDirection) => {
    const { numericValue } = store;
    const changed: boolean = isModified();
    if (numericValue === 0 && !props.allowZero) {
      props.onSubmit(input, null, false, tabDirection);
    } else {
      props.onSubmit(input, numericValue, changed, tabDirection);
    }
    store.setInternalValue(null);
  };

  const onCancelEdit = () => {
    store.setInternalValue(null);
  };

  const getPlaceholder = (value: number | null) => {
    return priceFormatter(value);
  };

  const getSpinner = () => {
    if ((props.status & OrderStatus.BeingCreated) !== 0) {
      return (
        <div className={'spinner'}>
          <CircularSpinner/><span>Creating&hellip;</span>
        </div>
      );
    } else if ((props.status & OrderStatus.BeingCancelled) !== 0) {
      return (
        <div className={'spinner'}>
          <CircularSpinner/><span>Cancelling&hellip;</span>
        </div>
      );
    } else if ((props.status & OrderStatus.BeingLoaded) !== 0) {
      return (
        <div className={'spinner'}>
          <CircularSpinner/><span>Loading&hellip;</span>
        </div>
      );
    } else if ((props.status & OrderStatus.Publishing) !== 0) {
      return (
        <div className={'spinner'}>
          <CircularSpinner/><span>Pub&hellip;</span>
        </div>
      );
    }
  };
  const classes = ['price-layout', 'cell'];
  if (props.className)
    classes.push(props.className);
  if (store.flashing)
    classes.push('flash');
  classes.push(getOrderStatusClass(props.status));
  return (
    <>
      <div className={classes.join(' ')} onMouseLeave={hideTooltip} onMouseEnter={showTooltip} ref={setTarget}>
        {value !== null && props.arrow !== ArrowDirection.None && <Direction direction={props.arrow}/>}
        <NumericInput
          id={props.uid}
          readOnly={props.readOnly}
          tabIndex={props.tabIndex}
          title={props.title}
          value={store.value}
          className={isModified() ? 'modified' : 'initial'}
          placeholder={getPlaceholder(props.value)}
          type={'price'}
          onCancelEdit={onCancelEdit}
          onBlur={onCancelEdit}
          onDoubleClick={onDoubleClick}
          onChange={onChange}
          onSubmit={onSubmit}
          onTabbedOut={props.onTabbedOut}
          onNavigate={props.onNavigate}/>
        {/* The floating object */}
        {getTooltip()}
        {getSpinner()}
      </div>
    </>
  );
});

Price.defaultProps = {
  animated: true,
  readOnly: false,
};
