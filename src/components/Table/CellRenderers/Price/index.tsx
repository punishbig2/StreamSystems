import {NumericInput} from 'components/NumericInput';
import {NavigateDirection} from 'components/NumericInput/navigateDirection';
import {PriceActions} from 'components/Table/CellRenderers/Price/constants';
import {Direction} from 'components/Table/CellRenderers/Price/direction';
import {useFlasher} from 'components/Table/CellRenderers/Price/hooks/useFlasher';
import {useStatusUpdater} from 'components/Table/CellRenderers/Price/hooks/useStatusUpdater';
import {useTooltip} from 'components/Table/CellRenderers/Price/hooks/useTooltop';
import {useValueComparator} from 'components/Table/CellRenderers/Price/hooks/useValueComparator';
import {useValueListener} from 'components/Table/CellRenderers/Price/hooks/useValueListener';
import {MiniDOB} from 'components/Table/CellRenderers/Price/miniDob';
import {PriceTypes} from 'components/Table/CellRenderers/Price/priceTypes';
import {reducer} from 'components/Table/CellRenderers/Price/reducer';
import {Tooltip} from 'components/Table/CellRenderers/Price/tooltip';
import {getInputClass} from 'components/Table/CellRenderers/Price/utils/getInputClass';
import {getLayoutClass} from 'components/Table/CellRenderers/Price/utils/getLayoutClass';
import {OrderTypes} from 'interfaces/mdEntry';
import {Order, OrderStatus} from 'interfaces/order';
import {InvalidPrice} from 'interfaces/tobRow';
import {ArrowDirection} from 'interfaces/w';
import React, {useCallback, useReducer} from 'react';
import {createAction} from 'redux/actionCreator';
import {priceFormatter} from 'utils/priceFormatter';

export interface Props {
  value: number | null;
  depth?: Order[];
  type?: OrderTypes;
  priceType?: PriceTypes;
  // Events
  onDoubleClick?: () => void;
  onChange: (value: number | null) => void;
  tabIndex?: number;
  arrow: ArrowDirection;
  status: OrderStatus;
  className?: string;
  onTabbedOut?: (input: HTMLInputElement) => void;
  min?: number | null;
  max?: number | null;
  onNavigate?: (target: HTMLInputElement, direction: NavigateDirection) => void;
}

export const Price: React.FC<Props> = (props: Props) => {
  const {depth} = props;
  const [state, dispatch] = useReducer<typeof reducer>(reducer, {
    tooltipX: 0,
    tooltipY: 0,
    startedShowingTooltip: false,
    visible: false,
    flash: false,
    status: props.status || OrderStatus.None,
    value: priceFormatter(props.value),
  });

  const setTooltipVisible = useCallback(() => dispatch(createAction(PriceActions.ShowTooltip)), []);
  const setStatus = useCallback((status: OrderStatus) => dispatch(createAction(PriceActions.SetStatus, status)), []);
  const setValue = useCallback((value: string, status: OrderStatus) => {
    dispatch(createAction(PriceActions.SetValue, {value, status}));
  }, []);

  const showTooltip = () => dispatch(createAction(PriceActions.StartShowingTooltip));
  const toPoint = (event: React.MouseEvent) => ({tooltipX: event.clientX, tooltipY: event.clientY});
  const hideTooltip = () => dispatch(createAction(PriceActions.HideTooltip));
  const onMouseMove = (event: React.MouseEvent) => dispatch(createAction(PriceActions.MoveTooltip, toPoint(event)));
  const startFlashing = () => dispatch(createAction(PriceActions.Flash));
  const stopFlashing = () => dispatch(createAction(PriceActions.Unflash));

  useTooltip(state.startedShowingTooltip, setTooltipVisible);
  useStatusUpdater(props.status, setStatus);
  useFlasher(state.flash, stopFlashing);
  useValueComparator(props.value, state.value, startFlashing);
  useValueListener(props.value, setValue);

  const getTooltip = () => {
    if (!state.visible || !depth || depth.length === 0)
      return null;
    return <Tooltip x={state.tooltipX} y={state.tooltipY} render={() => <MiniDOB {...props} rows={depth}/>}/>;
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
      setValue(priceFormatter(props.value), props.status);
    }
  };

  const isOpenOrderTicketStatus = (status: OrderStatus): boolean => {
    return (status & OrderStatus.Owned) === 0;
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

  const finalValue: string = ((): string => {
    const {value} = state;
    if (value === null)
      return '';
    return value.toString();
  })();

  const onSubmitted = () => {
    const value: string | null = state.value;
    if (value === null || value.trim() === '') {
      props.onChange(null);
    } else {
      const numeric: number = Number(value);
      // If it's non-numeric also ignore this
      if (isNaN(numeric) || numeric === 0) {
        props.onChange(null);
      } else {
        // No change happened
        if (priceFormatter(numeric) === priceFormatter(props.value))
          return;
        // Update the internal value
        setValue(priceFormatter(numeric), state.status);
        // It passed all validations, so emit the event
        if (props.min !== null && props.min !== undefined) {
          if (props.min >= numeric) {
            props.onChange(InvalidPrice);
          } else {
            props.onChange(numeric);
          }
        } else if (props.max !== null && props.max !== undefined) {
          if (props.max < numeric) {
            props.onChange(InvalidPrice);
          } else {
            props.onChange(numeric);
          }
        } else {
          props.onChange(numeric);
        }
      }
    }
  };

  const onTabbedOut = (input: HTMLInputElement) => {
    if (props.onTabbedOut)
      props.onTabbedOut(input);
    onSubmitted();
  };

  const onFocus = ({target}: React.FocusEvent<HTMLInputElement>) => target.select();

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
      <div className={getLayoutClass(state.flash)} onMouseEnter={showTooltip} onMouseLeave={hideTooltip}
           onMouseMove={onMouseMove}>
        <Direction direction={props.value === null ? ArrowDirection.None : props.arrow}/>
        <NumericInput
          tabIndex={props.tabIndex}
          value={finalValue}
          className={getInputClass(state.status, props.className)}
          onDoubleClick={onDoubleClick}
          onChange={onChange}
          onSubmitted={onSubmitted}
          onFocus={onFocus}
          onTabbedOut={onTabbedOut}
          onNavigate={props.onNavigate}/>
        {/* The floating object */}
        {getTooltip()}
      </div>
    );
  }
};

