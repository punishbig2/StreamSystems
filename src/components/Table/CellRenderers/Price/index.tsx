import {Chevron} from 'components/Table/CellRenderers/Price/chevron';
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
import {TableInput} from 'components/TableInput';
import {EntryTypes} from 'interfaces/mdEntry';
import {OrderStatus, Order} from 'interfaces/order';
import {ArrowDirection} from 'interfaces/w';
import React, {useCallback, useReducer} from 'react';
import {createAction} from 'redux/actionCreator';
import {priceFormatter} from 'utils/priceFormatter';

export interface Props {
  value: number | null;
  depth?: Order[];
  type?: EntryTypes;
  priceType?: PriceTypes;
  // Events
  onDoubleClick?: () => void;
  onChange: (value: number) => void;
  onSubmit?: (value: number) => void;
  onBlur?: (value: number) => void;
  tabIndex?: number;
  arrow: ArrowDirection;
  status: OrderStatus;
  className?: string;
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

  const onChange = (value: string) => {
    const trimmed: string = value.trim();
    const numeric: number = Number(`${trimmed}0`);
    if (trimmed.length === 0) {
      setValue('', OrderStatus.PriceEdited & ~OrderStatus.PreFilled);
    } else if (!isNaN(numeric)) {
      setValue(trimmed, OrderStatus.PriceEdited & ~OrderStatus.PreFilled);
    }
  };

  const onDoubleClick = (event: React.MouseEvent) => {
    if (props.onDoubleClick && ((state.status & OrderStatus.Owned) === 0)) {
      const target: HTMLInputElement = event.target as HTMLInputElement;
      // Stop the event
      event.stopPropagation();
      event.preventDefault();
      // Remove focus and selection
      target.setSelectionRange(0, 0);
      target.blur();
      // Call the callback
      return props.onDoubleClick();
    }
  };

  const onSubmit = () => {
    if (props.onSubmit) {
      const numeric: number = Number(state.value);
      if (isNaN(numeric))
        return;
      props.onSubmit(numeric);
    }
  };

  const finalValue: string = ((): string => {
    const {value} = state;
    if (value === null)
      return '';
    return value.toString();
  })();

  const onBlur = () => {
    if (state.value === '')
      return;
    const value: string | null = state.value;
    if (value === null)
      return;
    const numeric: number = Number(value);
    // If it's non-numeric also ignore this
    if (isNaN(numeric))
      return;
    if (numeric === props.value)
      return;
    // Update the internal value
    setValue(priceFormatter(numeric), state.status);
    // It passed all validations, so emit the event
    props.onChange(numeric);
  };

  const showChevron =
    (state.status & OrderStatus.HaveOtherOrders) !== 0 &&
    (state.status & OrderStatus.Owned) === 0 &&
    (state.value !== '');
  return (
    <div className={getLayoutClass(state.flash)} onMouseEnter={showTooltip} onMouseLeave={hideTooltip}
         onMouseMove={onMouseMove}>
      {showChevron ? <Chevron/> : null}
      <Direction direction={props.arrow}/>
      <TableInput
        tabIndex={props.tabIndex}
        value={finalValue}
        onDoubleClick={onDoubleClick}
        onBlur={onBlur}
        onReturnPressed={onSubmit}
        onChange={onChange}
        className={getInputClass(state.status, props.className)}/>
      {/* The floating object */}
      {getTooltip()}
    </div>
  );
};

