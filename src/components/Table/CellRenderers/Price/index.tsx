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
import React, {useCallback, useEffect, useReducer} from 'react';
import {createAction} from 'redux/actionCreator';

export interface Props {
  value: number | null;
  depth?: TOBEntry[];
  type?: EntryTypes;
  priceType?: PriceTypes;
  // Events
  onDoubleClick?: () => void;
  onChange: (value: number) => void;
  onSubmit?: (value: number) => void;
  onBlur?: () => void;
  tabIndex?: number;
  arrow: ArrowDirection;
  status: EntryStatus;
  className?: string;
}

const valueToString = (value: number | null): string => {
  if (value === null)
    return '';
  if (typeof value.toFixed !== 'function') {
    return '';
  }
  return value.toFixed(3);
};

const useTooltip = (started: boolean, activated: () => void) => {
  useEffect(() => {
    if (!started)
      return;
    const timer = setTimeout(activated, 500);
    return () => {
      clearTimeout(timer);
    };
  }, [activated, started]);
};

const useStatusUpdater = (status: EntryStatus, update: (status: EntryStatus) => void) => {
  useEffect(() => update(status), [status, update]);
};

export const Price: React.FC<Props> = (props: Props) => {
  const {depth} = props;
  const [state, dispatch] = useReducer<typeof reducer>(reducer, {
    tooltipX: 0,
    tooltipY: 0,
    startedShowingTooltip: false,
    visible: false,
    status: props.status || EntryStatus.None,
    value: valueToString(props.value),
  });

  const setTooltipVisible = useCallback(() => dispatch(createAction(PriceActions.ShowTooltip)), []);
  const showTooltip = () => dispatch(createAction(PriceActions.StartShowingTooltip));
  const toPoint = (event: React.MouseEvent) => ({tooltipX: event.clientX, tooltipY: event.clientY});
  const hideTooltip = () => dispatch(createAction(PriceActions.HideTooltip));
  const onMouseMove = (event: React.MouseEvent) => dispatch(createAction(PriceActions.MoveTooltip, toPoint(event)));
  const setStatus = useCallback((status: EntryStatus) => dispatch(createAction(PriceActions.SetStatus, status)), []);
  const setValue = (value: string, status: EntryStatus) => {
    dispatch(createAction(PriceActions.SetValue, {value, status}));
  };

  useTooltip(state.startedShowingTooltip, setTooltipVisible);
  useStatusUpdater(props.status, setStatus);

  const getTooltip = () => {
    if (!state.visible || !depth || depth.length === 0)
      return null;
    return <Tooltip x={state.tooltipX} y={state.tooltipY} render={() => <MiniDOB {...props} rows={depth}/>}/>;
  };

  useEffect(() => {
    setValue(valueToString(props.value), EntryStatus.PreFilled & ~EntryStatus.PriceEdited);
  }, [props.value, props.status]);

  const onChange = (value: string) => {
    const trimmed: string = value.trim();
    const numeric: number = Number(`${trimmed}0`);
    if (trimmed.length === 0) {
      setValue('', EntryStatus.PriceEdited & ~EntryStatus.PreFilled);
    } else if (!isNaN(numeric)) {
      setValue(trimmed, EntryStatus.PriceEdited & ~EntryStatus.PreFilled);
    }
  };

  const onDoubleClick = (event: React.MouseEvent) => {
    if (props.onDoubleClick && ((state.status & EntryStatus.Owned) === 0)) {
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
    if (status & EntryStatus.PriceEdited)
      classes.push('edited');
    if (status & EntryStatus.Cancelled)
      classes.push('cancelled');
    return classes.join(' ');
  };

  const onBlur = () => {
    const value: string | null = state.value;
    if (value === null)
      return;
    if (props.onBlur)
      props.onBlur();
    const numeric: number = Number(value);
    if (isNaN(numeric))
      return;
    props.onChange(numeric);
  };

  return (
    <PriceLayout onMouseEnter={showTooltip} onMouseLeave={hideTooltip} onMouseMove={onMouseMove}>
      <Direction direction={props.arrow}/>
      <TableInput
        tabIndex={props.tabIndex}
        value={finalValue}
        onDoubleClick={onDoubleClick}
        onBlur={onBlur}
        onReturnPressed={onSubmit}
        onChange={onChange}
        className={getClass(state.status, props.className)}/>
      {/* The floating object */}
      {getTooltip()}
    </PriceLayout>
  );
};

