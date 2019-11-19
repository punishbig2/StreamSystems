import {PriceActions} from 'components/Table/CellRenderers/Price/constants';
import {Direction} from 'components/Table/CellRenderers/Price/direction';
import {PriceLayout} from 'components/Table/CellRenderers/Price/layout';
import {MiniDOB} from 'components/Table/CellRenderers/Price/miniDob';
import {PriceTypes} from 'components/Table/CellRenderers/Price/priceTypes';
import {reducer} from 'components/Table/CellRenderers/Price/reducer';
import {Tooltip} from 'components/Table/CellRenderers/Price/tooltip';
import {TableInput} from 'components/TableInput';
import {EntryTypes} from 'interfaces/mdEntry';
import {EntryStatus, TOBEntry} from 'interfaces/tobEntry';
import {ArrowDirection} from 'interfaces/w';
import React, {ReactText, useEffect, useReducer} from 'react';
import {createAction} from 'redux/actionCreator';

export interface Props {
  value: number | null;
  editable: boolean;
  depth?: TOBEntry[];
  type?: EntryTypes;
  priceType?: PriceTypes;
  // Events
  onDoubleClick?: () => void;
  onChange: (value: string) => void;
  onSubmit?: (value: number) => void;
  onBlur?: () => void;
  tabIndex?: number;
  arrow: ArrowDirection;
  initialStatus?: EntryStatus;
  className?: string;
}

const valueToString = (value: number | null): string => value === null ? '' : value.toString();
export const Price: React.FC<Props> = (props: Props) => {
  const {initialStatus, depth} = props;
  const [state, dispatch] = useReducer<typeof reducer>(reducer, {
    tooltipX: 0,
    tooltipY: 0,
    startedShowingTooltip: false,
    visible: false,
    status: initialStatus || EntryStatus.None,
    value: valueToString(props.value),
  });

  useEffect(() => {
    dispatch(createAction(PriceActions.SetStatus, initialStatus));
  }, [initialStatus]);

  const showTooltip = () => dispatch(createAction(PriceActions.StartShowingTooltip));
  const toPoint = (event: React.MouseEvent) => ({tooltipX: event.clientX, tooltipY: event.clientY});
  const hideTooltip = () => dispatch(createAction(PriceActions.HideTooltip));
  const onMouseMove = (event: React.MouseEvent) => dispatch(createAction(PriceActions.MoveTooltip, toPoint(event)));
  const setValue = (value: string, status: EntryStatus) => {
    dispatch(createAction(PriceActions.SetValue, {value, status}));
  };

  const getTooltip = () => {
    if (!state.visible || !depth || depth.length === 0)
      return null;
    return <Tooltip x={state.tooltipX} y={state.tooltipY} render={() => <MiniDOB {...props} rows={depth}/>}/>;
  };

  useEffect(() => {
    if (!state.startedShowingTooltip)
      return;
    const timer = setTimeout(() => dispatch(createAction(PriceActions.ShowTooltip)), 500);
    return () => {
      clearTimeout(timer);
    };
  }, [state.startedShowingTooltip]);

  useEffect(() => {
    setValue(valueToString(props.value), EntryStatus.PreFilled & ~EntryStatus.Edited);
  }, [props.value, props.initialStatus, state.status]);

  const onChange = (value: string) => {
    const trimmed: string = value.trim();
    const numeric: number = Number(`${trimmed}0`);
    if (trimmed.length === 0) {
      setValue('', EntryStatus.Edited & ~EntryStatus.PreFilled);
    } else if (!isNaN(numeric)) {
      setValue(trimmed, EntryStatus.Edited & ~EntryStatus.PreFilled);
    }
  };

  const onDoubleClick = (event: React.MouseEvent) => {
    if (props.onDoubleClick && !props.editable) {
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

  const getClass = (status: EntryStatus, className?: string): string => {
    const classes: string[] = className ? [className] : [];
    if (status & EntryStatus.Owned)
      classes.push('owned');
    if (status & EntryStatus.Active)
      classes.push('active');
    if (status & EntryStatus.PreFilled)
      classes.push('pre-filled');
    if (status & EntryStatus.Edited)
      classes.push('edited');
    if (status & EntryStatus.Cancelled)
      classes.push('cancelled');
    return classes.join(' ');
  };

  return (
    <PriceLayout onMouseEnter={showTooltip} onMouseLeave={hideTooltip} onMouseMove={onMouseMove}>
      <Direction direction={props.arrow}/>
      <TableInput
        tabIndex={props.tabIndex}
        value={finalValue}
        onDoubleClick={onDoubleClick}
        onBlur={props.onBlur}
        onSubmit={onSubmit}
        onChange={onChange}
        className={getClass(state.status, props.className)}/>
      {/* The floating object */}
      {getTooltip()}
    </PriceLayout>
  );
};

