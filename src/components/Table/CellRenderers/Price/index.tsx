import { NumericInput, TabDirection } from 'components/NumericInput';
import { NavigateDirection } from 'components/NumericInput/navigateDirection';
import { PriceActions } from 'components/Table/CellRenderers/Price/constants';
import { Direction } from 'components/Table/CellRenderers/Price/direction';
import { useFlasher } from 'components/Table/CellRenderers/Price/hooks/useFlasher';
import { useStatusUpdater } from 'components/Table/CellRenderers/Price/hooks/useStatusUpdater';
import { useValueComparator } from 'components/Table/CellRenderers/Price/hooks/useValueComparator';
import { PriceTypes } from 'components/Table/CellRenderers/Price/priceTypes';
import { reducer } from 'components/Table/CellRenderers/Price/reducer';
import { getOrderStatusClass } from 'components/Table/CellRenderers/Price/utils/getOrderStatusClass';
import { OrderTypes } from 'interfaces/mdEntry';
import { ArrowDirection } from 'interfaces/w';
import React, { useCallback, useReducer, ReactElement, useState, useEffect } from 'react';
import { createAction } from 'actionCreator';
import { priceFormatter } from 'utils/priceFormatter';
import { useValueListener } from 'components/Table/CellRenderers/Price/hooks/useValueListener';
import { Tooltip } from 'components/Table/CellRenderers/Price/tooltip';
import { OrderStatus } from 'interfaces/order';
import { CircularSpinner } from 'circularSpinner';

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

export const Price: React.FC<Props> = (props: Props) => {
  const { timestamp, value, tooltip } = props;
  if (value === undefined)
    throw new Error('value is not optional');

  const [target, setTarget] = useState<HTMLDivElement | null>(null);
  const [state, dispatch] = useReducer(reducer, {
    tooltipX: 0,
    tooltipY: 0,
    tooltipVisible: false,
    flash: false,
    internalValue: ((props.status & OrderStatus.Cancelled) === 0) ? priceFormatter(value) : '',
  });
  const { tooltipVisible } = state;

  const setStatus = useCallback((status: OrderStatus) => dispatch(createAction(PriceActions.SetStatus, status)), []);
  const setInternalValue = useCallback((value: string) => {
    dispatch(createAction(PriceActions.SetValue, { value }));
  }, []);

  /*const resetValue = useCallback((value: string, status: OrderStatus) => {
    dispatch(createAction(PriceActions.ResetValue, { value, status }));
  }, []);*/

  const showTooltip = tooltip ? (event: React.MouseEvent<HTMLDivElement>) => {
    dispatch(createAction(PriceActions.ShowTooltip));
  } : undefined;

  const hideTooltip = () => dispatch(createAction(PriceActions.HideTooltip));

  const startFlashing = () => {
    if (!props.animated)
      return;
    dispatch(createAction(PriceActions.Flash));
  };
  const stopFlashing = () => dispatch(createAction(PriceActions.Unflash));

  useEffect(() => {
    if ((props.status & OrderStatus.Cancelled) === 0)
      return;
    setInternalValue('');
  }, [props.status, setInternalValue]);
  useStatusUpdater(props.status, setStatus);
  useFlasher(state.flash, stopFlashing);
  useValueComparator(value, startFlashing, props.status);
  useValueListener(value, timestamp, setInternalValue);
  useEffect(() => {
    if (props.value === null) {
      setInternalValue('');
    } else {
      if ((props.status & OrderStatus.Cancelled) === 0) {
        setInternalValue(priceFormatter(props.value));
      } else {
        setInternalValue('');
      }
    }
  }, [props, setInternalValue]);
  const getTooltip = (): ReactElement | null => {
    if (!tooltip || !tooltipVisible)
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
      const numeric: number = Number(`${trimmed}0`);
      if (trimmed.length === 0) {
        setInternalValue('');
      } else if (!isNaN(numeric)) {
        setInternalValue(trimmed);
      }
    } else {
      // Reset the input item
      setInternalValue(priceFormatter(value));
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
    const { internalValue } = state;
    const trimmedValue: string = internalValue.trim();
    const numeric: number | null = trimmedValue === '' ? null : Number(trimmedValue);
    if (internalValue.trim() === '')
      return false;
    return priceFormatter(numeric) !== priceFormatter(value);
  };

  const onSubmit = (input: HTMLInputElement, tabDirection: TabDirection) => {
    const { internalValue } = state;
    const trimmedValue: string = internalValue.trim();
    const numeric: number | null = trimmedValue === '' ? null : Number(trimmedValue);
    if ((numeric !== null) && isNaN(numeric))
      throw new Error('unexpected problem with non numeric price');
    const changed: boolean = isModified();
    if (numeric === 0 && !props.allowZero) {
      props.onSubmit(input, null, false, tabDirection);
    } else {
      props.onSubmit(input, numeric, changed, tabDirection);
    }
  };

  const onCancelEdit = () => {
    if ((props.status & OrderStatus.Cancelled) === 0) {
      setInternalValue(priceFormatter(props.value));
    } else {
      setInternalValue('');
    }
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
  if (state.flash)
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
          value={state.internalValue}
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
};

Price.defaultProps = {
  animated: true,
  readOnly: false,
};
