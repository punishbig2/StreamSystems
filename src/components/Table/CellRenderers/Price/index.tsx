import {NumericInput} from 'components/NumericInput';
import {NavigateDirection} from 'components/NumericInput/navigateDirection';
import {PriceActions} from 'components/Table/CellRenderers/Price/constants';
import {Direction} from 'components/Table/CellRenderers/Price/direction';
import {useFlasher} from 'components/Table/CellRenderers/Price/hooks/useFlasher';
import {useStatusUpdater} from 'components/Table/CellRenderers/Price/hooks/useStatusUpdater';
import {useTooltip} from 'components/Table/CellRenderers/Price/hooks/useTooltop';
import {useValueComparator} from 'components/Table/CellRenderers/Price/hooks/useValueComparator';
import {PriceTypes} from 'components/Table/CellRenderers/Price/priceTypes';
import {reducer} from 'components/Table/CellRenderers/Price/reducer';
import {Tooltip} from 'components/Table/CellRenderers/Price/tooltip';
import {getOrderStatusClass} from 'components/Table/CellRenderers/Price/utils/getOrderStatusClass';
import {getLayoutClass} from 'components/Table/CellRenderers/Price/utils/getLayoutClass';
import {OrderTypes} from 'interfaces/mdEntry';
import {OrderStatus} from 'interfaces/order';
import {ArrowDirection} from 'interfaces/w';
import React, {useCallback, useEffect, useReducer, useState} from 'react';
import {createAction} from 'redux/actionCreator';
import {priceFormatter} from 'utils/priceFormatter';
import {useValueListener} from 'components/Table/CellRenderers/Price/hooks/useValueListener';

export enum PriceErrors {
  GreaterThanMax,
  LessThanMin
}

export interface Props {
  value: number | null;
  type?: OrderTypes;
  priceType?: PriceTypes;
  // Events
  onDoubleClick?: () => void;
  onChange: (value: number | null, changed: boolean) => void;
  tabIndex?: number;
  arrow: ArrowDirection;
  status: OrderStatus;
  className?: string;
  onTabbedOut?: (input: HTMLInputElement) => void;
  min?: number | null;
  max?: number | null;
  onNavigate?: (target: HTMLInputElement, direction: NavigateDirection) => void;
  onError?: (error: PriceErrors, input: HTMLInputElement) => void;
  animated?: boolean;
  readOnly?: boolean;
  uid?: string;
  timestamp?: string;
  tooltip?: React.FC<any>;
}

export const Price: React.FC<Props> = (props: Props) => {
  const {timestamp, value} = props;
  if (value === undefined)
    throw new Error('value is not optional');
  const [state, dispatch] = useReducer<typeof reducer>(reducer, {
    tooltipX: 0,
    tooltipY: 0,
    startedShowingTooltip: false,
    visible: false,
    flash: false,
    initialStatus: props.status,
    status: props.status || OrderStatus.None,
    internalValue: priceFormatter(value),
  });

  const [ref, setRef] = useState<HTMLDivElement | null>(null);
  const setTooltipVisible = useCallback(
    () => dispatch(createAction(PriceActions.ShowTooltip)),
    [],
  );
  const setStatus = useCallback(
    (status: OrderStatus) =>
      dispatch(createAction(PriceActions.SetStatus, status)),
    [],
  );
  const setValue = useCallback((value: string, status: OrderStatus) => {
    dispatch(createAction(PriceActions.SetValue, {value, status}));
  }, []);
  const resetValue = useCallback((value: string, status: OrderStatus) => {
    dispatch(createAction(PriceActions.ResetValue, {value, status}));
  }, []);

  const showTooltip = (event: React.MouseEvent<HTMLDivElement>) => {
    dispatch(createAction(PriceActions.StartShowingTooltip));
    dispatch(
      createAction(PriceActions.MoveTooltip, toPoint(event.nativeEvent)),
    );
  };
  const toPoint = useCallback(
    (event: MouseEvent) => ({
      tooltipX: event.clientX,
      tooltipY: event.clientY,
    }),
    [],
  );
  const hideTooltip = () => dispatch(createAction(PriceActions.HideTooltip));
  const onMouseMove = useCallback(
    (event: MouseEvent) => {
      dispatch(createAction(PriceActions.MoveTooltip, toPoint(event)));
    },
    [dispatch, toPoint],
  );
  const startFlashing = () => {
    if (!props.animated) return;
    dispatch(createAction(PriceActions.Flash));
  };
  const stopFlashing = () => dispatch(createAction(PriceActions.Unflash));

  useTooltip(state.startedShowingTooltip, setTooltipVisible);
  useStatusUpdater(props.status, setStatus);
  useFlasher(state.flash, stopFlashing);
  useValueComparator(value, state.internalValue, startFlashing);
  useValueListener(value, timestamp, setValue);
  // Avoid having more than a single move event listener because
  // that would of course be expensive
  useEffect(() => {
    if (!state.visible || ref === null) return;
    ref.addEventListener('mousemove', onMouseMove);
    return () => {
      ref.removeEventListener('mousemove', onMouseMove);
    };
  }, [state.visible, ref, onMouseMove]);

  const getTooltip = () => {
    if (!state.visible || !props.tooltip) return null;
    return (
      <Tooltip x={state.tooltipX} y={state.tooltipY} render={props.tooltip}/>
    );
  };

  const onChange = (value: string | null) => {
    if (value !== null) {
      const trimmed: string = value.trim();
      const numeric: number = Number(`${trimmed}0`);
      if (trimmed.length === 0) {
        setValue('', OrderStatus.PriceEdited & ~OrderStatus.PreFilled);
      } else if (!isNaN(numeric)) {
        setValue(trimmed, OrderStatus.PriceEdited & ~OrderStatus.PreFilled);
      }
    } else {
      // Reset the input item
      setValue(priceFormatter(value), props.status);
    }
  };

  const isOpenOrderTicketStatus = (status: OrderStatus): boolean => {
    if ((status & OrderStatus.DarkPool) !== 0) return true;
    return (
      (status & OrderStatus.Owned) === 0 &&
      (status & OrderStatus.SameBank) === 0
    );
  };

  const onDoubleClick = (event: React.MouseEvent<HTMLInputElement>) => {
    // Stop the event
    event.stopPropagation();
    event.preventDefault();
    if (props.onDoubleClick && isOpenOrderTicketStatus(state.status)) {
      const target: HTMLInputElement = event.currentTarget;
      // Remove focus and selection
      target.setSelectionRange(0, 0);
      target.blur();
      // Call the callback
      return props.onDoubleClick();
    }
  };

  const finalValue = (status: OrderStatus): string => {
    const {internalValue} = state;
    if (internalValue === null)
      return '';
    if ((status & OrderStatus.Cancelled) !== 0
      && (status & OrderStatus.PriceEdited) === 0
      && (status & OrderStatus.QuantityEdited) === 0)
      return '';
    return internalValue;
  };

  const onSubmitted = (input: HTMLInputElement) => {
    const internalValue: string | null = state.internalValue;
    if ((state.status & OrderStatus.Cancelled) !== 0 && (state.status & OrderStatus.PriceEdited) === 0)
      return;
    if (internalValue === null || internalValue.trim() === '') {
      props.onChange(null, false);
    } else {
      const numeric: number = Number(internalValue);
      // If it's non-numeric also ignore this
      if (isNaN(numeric) || numeric === 0) {
        props.onChange(null, false);
      } else {
        const changed: boolean = (() => {
          if ((props.status & OrderStatus.Owned) === 0) return true;
          return priceFormatter(numeric) !== priceFormatter(value);
        })();
        // Update the internal value
        setValue(priceFormatter(numeric), state.status);
        if (props.min !== null && props.min !== undefined) {
          if (props.min >= numeric && typeof props.onError === 'function') {
            props.onError(PriceErrors.LessThanMin, input);
          } else {
            props.onChange(numeric, changed);
          }
        } else if (props.max !== null && props.max !== undefined) {
          if (props.max <= numeric && typeof props.onError === 'function') {
            props.onError(PriceErrors.GreaterThanMax, input);
          } else {
            props.onChange(numeric, changed);
          }
        } else {
          props.onChange(numeric, changed);
        }
      }
    }
  };

  const onTabbedOut = (input: HTMLInputElement) => {
    if (props.onTabbedOut) {
      props.onTabbedOut(input);
    }
  };

  const onFocus = ({target}: React.FocusEvent<HTMLInputElement>) => target.select();
  const onCancelEdit = () => {
    resetValue(
      priceFormatter(props.value),
      props.status & ~OrderStatus.PriceEdited,
    );
  };

  const getPlaceholder = (status: OrderStatus, value: number | null) => {
    return priceFormatter(value);
  };

  if ((props.status & OrderStatus.BeingCreated) !== 0) {
    return (
      <div className={'price-waiting-spinner'}>
        <span>Creating&hellip;</span>
      </div>
    );
  } else if ((props.status & OrderStatus.BeingCancelled) !== 0) {
    return (
      <div className={'price-waiting-spinner'}>
        <span>Cancelling&hellip;</span>
      </div>
    );
  } else if ((props.status & OrderStatus.BeingLoaded) !== 0) {
    return (
      <div className={'price-waiting-spinner'}>
        <span>Loading&hellip;</span>
      </div>
    );
  } else {
    return (
      <div
        className={getLayoutClass(state.flash)}
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        ref={setRef}>
        <Direction direction={value === null ? ArrowDirection.None : props.arrow}/>
        <NumericInput
          readOnly={props.readOnly}
          tabIndex={props.tabIndex}
          value={finalValue(state.status)}
          className={getOrderStatusClass(state.status, props.className)}
          placeholder={getPlaceholder(state.status, props.value)}
          onCancelEdit={onCancelEdit}
          onBlur={onCancelEdit}
          onDoubleClick={onDoubleClick}
          onChange={onChange}
          onSubmitted={onSubmitted}
          onFocus={onFocus}
          onTabbedOut={onTabbedOut}
          onNavigate={props.onNavigate}
          type={'price'}/>
        {/* The floating object */}
        {getTooltip()}
      </div>
    );
  }
};

Price.defaultProps = {
  animated: true,
  readOnly: false,
};
