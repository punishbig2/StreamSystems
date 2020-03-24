import {NumericInput, TabDirection} from 'components/NumericInput';
import {NavigateDirection} from 'components/NumericInput/navigateDirection';
import {PriceActions} from 'components/Table/CellRenderers/Price/constants';
import {Direction} from 'components/Table/CellRenderers/Price/direction';
import {useFlasher} from 'components/Table/CellRenderers/Price/hooks/useFlasher';
import {useStatusUpdater} from 'components/Table/CellRenderers/Price/hooks/useStatusUpdater';
import {useValueComparator} from 'components/Table/CellRenderers/Price/hooks/useValueComparator';
import {PriceTypes} from 'components/Table/CellRenderers/Price/priceTypes';
import {reducer} from 'components/Table/CellRenderers/Price/reducer';
import {getOrderStatusClass} from 'components/Table/CellRenderers/Price/utils/getOrderStatusClass';
import {OrderTypes} from 'interfaces/mdEntry';
import {ArrowDirection} from 'interfaces/w';
import React, {useCallback, useReducer, ReactElement, useState} from 'react';
import {createAction} from 'redux/actionCreator';
import {priceFormatter} from 'utils/priceFormatter';
import {useValueListener} from 'components/Table/CellRenderers/Price/hooks/useValueListener';
import {getLayoutClass} from 'components/Table/CellRenderers/Price/utils/getLayoutClass';
import {Tooltip} from 'components/Table/CellRenderers/Price/tooltip';
import {OrderStatus} from 'interfaces/order';

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
  onSubmit: (input: HTMLInputElement, value: number | null, changed: boolean, tabDirection: TabDirection) => void;
  tabIndex?: number;
  arrow: ArrowDirection;
  status: OrderStatus;
  title?: string;
  className?: string;
  onTabbedOut?: (input: HTMLInputElement, tabDirection: TabDirection) => void;
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
  const {timestamp, value, tooltip} = props;
  if (value === undefined)
    throw new Error('value is not optional');
  const [target, setTarget] = useState<HTMLDivElement | null>(null);
  const [state, dispatch] = useReducer(reducer, {
    tooltipX: 0,
    tooltipY: 0,
    tooltipVisible: false,
    flash: false,
    initialStatus: props.status,
    status: props.status || OrderStatus.None,
    internalValue: priceFormatter(value),
  });
  const {tooltipVisible} = state;

  const setStatus = useCallback((status: OrderStatus) => dispatch(createAction(PriceActions.SetStatus, status)), []);
  const setInternalValue = useCallback((value: string, status: OrderStatus) => {
    dispatch(createAction(PriceActions.SetValue, {value, status}));
  }, []);

  const resetValue = useCallback((value: string, status: OrderStatus) => {
    dispatch(createAction(PriceActions.ResetValue, {value, status}));
  }, []);

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

  useStatusUpdater(props.status, setStatus);
  useFlasher(state.flash, stopFlashing);
  useValueComparator(value, startFlashing, props.status);
  useValueListener(value, timestamp, setInternalValue);

  const getTooltip = (): ReactElement | null => {
    if (!tooltip || !tooltipVisible)
      return null;
    const content: ReactElement | null = typeof tooltip === 'function' ? tooltip({}) : tooltip;
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
        setInternalValue('', OrderStatus.PriceEdited & ~OrderStatus.PreFilled);
      } else if (!isNaN(numeric)) {
        setInternalValue(trimmed, OrderStatus.PriceEdited & ~OrderStatus.PreFilled);
      }
    } else {
      // Reset the input item
      setInternalValue(priceFormatter(value), props.status);
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
    if (internalValue === null || ((status & OrderStatus.Cancelled) !== 0 && (status & OrderStatus.PriceEdited) === 0))
      return '';
    return internalValue;
  };

  const onSubmit = (input: HTMLInputElement, tabDirection: TabDirection) => {
    if ((state.status & OrderStatus.PriceEdited) === 0) {
      props.onSubmit(input, null, false, tabDirection);
      return;
    }
    // Ignore the submission if the user has not "modified" the value
    const internalValue: string | null = state.internalValue;
    if ((state.status & OrderStatus.Cancelled) !== 0 && (state.status & OrderStatus.PriceEdited) === 0)
      return;
    if (internalValue === null || internalValue.trim() === '') {
      props.onSubmit(input, null, false, tabDirection);
    } else {
      const numeric: number = Number(internalValue);
      // If it's non-numeric also ignore this
      if (isNaN(numeric) || numeric === 0) {
        props.onSubmit(input, null, false, tabDirection);
      } else {
        const changed: boolean = (() => {
          if ((props.status & OrderStatus.Owned) === 0 || (props.status & OrderStatus.Cancelled) !== 0)
            return true;
          return priceFormatter(numeric) !== priceFormatter(value);
        })();
        // Update the internal value
        setInternalValue(priceFormatter(numeric), state.status);
        if (props.min !== null && props.min !== undefined) {
          if (props.min >= numeric && typeof props.onError === 'function') {
            props.onError(PriceErrors.LessThanMin, input);
          } else {
            props.onSubmit(input, numeric, changed, tabDirection);
          }
        } else if (props.max !== null && props.max !== undefined) {
          if (props.max <= numeric && typeof props.onError === 'function') {
            props.onError(PriceErrors.GreaterThanMax, input);
          } else {
            props.onSubmit(input, numeric, changed, tabDirection);
          }
        } else {
          props.onSubmit(input, numeric, changed, tabDirection);
        }
      }
    }
  };

  const onCancelEdit = () => {
    resetValue(priceFormatter(props.value), props.status);
  };

  const getPlaceholder = (status: OrderStatus, value: number | null) => {
    return priceFormatter(value);
  };

  const getSpinner = () => {
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
    } else if ((props.status & OrderStatus.Publishing) !== 0) {
      return (
        <div className={'price-waiting-spinner'}>
          <span>Pub&hellip;</span>
        </div>
      );
    }
  };

  return (
    <>
      <div className={getLayoutClass(state.flash) + ' cell'}
           onMouseLeave={hideTooltip}
           onMouseEnter={showTooltip}
           ref={setTarget}>
        <Direction direction={value === null ? ArrowDirection.None : props.arrow}/>
        <NumericInput
          id={props.uid}
          readOnly={props.readOnly}
          tabIndex={props.tabIndex}
          title={props.title}
          value={finalValue(state.status)}
          className={getOrderStatusClass(state.status, props.className)}
          placeholder={getPlaceholder(state.status, props.value)}
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
