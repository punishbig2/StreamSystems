import {PriceRendererActions} from 'components/Table/CellRenderers/Price/constants';
import {PriceLayout} from 'components/Table/CellRenderers/Price/layout';
import {MiniDOB} from 'components/Table/CellRenderers/Price/miniDob';
import {PriceTypes} from 'components/Table/CellRenderers/Price/priceTypes';
import {reducer} from 'components/Table/CellRenderers/Price/reducer';
import {State} from 'components/Table/CellRenderers/Price/state';
import {Tooltip} from 'components/Table/CellRenderers/Price/tooltip';
import {TableInput} from 'components/TableInput';
import {EntryTypes} from 'interfaces/mdEntry';
import {TOBEntry} from 'interfaces/tobEntry';
import {ArrowDirection} from 'interfaces/w';
import React, {ReactElement, useEffect, useReducer} from 'react';
import {createAction} from 'redux/actionCreator';
import {Point} from 'structures/point';
import styled from 'styled-components';

interface DirectionProps {
  direction: ArrowDirection;
}

const DirectionLayout = styled.div`
  position: absolute;
  display: none;
  width: 16px;
  left: 4px;
  top: 0;
  bottom: 0;
  pointer-events: none;
  i.fa-long-arrow-alt-up {
    color: seagreen;;
  }
  i.fa-long-arrow-alt-down {
    color: crimson;;
  }
`;

const Direction = (props: DirectionProps): ReactElement => {
  const arrows: { [key: string]: string } = {
    [ArrowDirection.None]: 'none',
    [ArrowDirection.Up]: 'up',
    [ArrowDirection.Down]: 'down',
  };
  if (props.direction !== ArrowDirection.None)
    console.log(`fa-long-arrow-alt-${arrows[props.direction]}`);
  return (
    <DirectionLayout>
      <i className={`fa fa-long-arrow-alt-${arrows[props.direction]}`}/>
    </DirectionLayout>
  );
};

const initialState: State = {
  x: 0,
  y: 0,
  startedShowingTooltip: false,
  visible: false,
};

export interface Props {
  value: string | number | null;
  editable: boolean;
  table?: TOBEntry[];
  type?: EntryTypes;
  priceType?: PriceTypes;
  // Events
  onDoubleClick?: () => void;
  onChange: (value: string) => void;
  onSubmit?: (value: number) => void;
  color: 'red' | 'blue' | 'green' | 'black' | 'gray',
  onBlur?: () => void;
  tabIndex?: number;
  arrow: ArrowDirection;
}

export const Price: React.FC<Props> = (props: Props) => {
  const [state, dispatch] = useReducer<typeof reducer>(reducer, initialState);
  const {value, table} = props;
  const showTooltip = () => dispatch(createAction(PriceRendererActions.StartShowingTooltip));
  const hideTooltip = () => dispatch(createAction(PriceRendererActions.HideTooltip));
  const onMouseMove = (event: React.MouseEvent) => dispatch(
    createAction(PriceRendererActions.MoveTooltip, Point.fromEvent(event)),
  );
  const getTooltip = () => {
    if ((state.visible === false) || (table === undefined) || (table.length === 0))
      return null;
    return <Tooltip x={state.x} y={state.y} render={() => <MiniDOB {...props} rows={table}/>}/>;
  };
  useEffect(() => {
    if (state.startedShowingTooltip) {
      const timer = setTimeout(() => dispatch(createAction(PriceRendererActions.ShowTooltip)), 500);
      return () => {
        dispatch(createAction(PriceRendererActions.StopShowingTooltip));
        clearTimeout(timer);
      };
    }
  }, [state.startedShowingTooltip]);

  const onChange = (value: string) => {
    const trimmed: string = value.trim();
    const numeric: number = Number(`${trimmed}0`);
    if (trimmed.length === 0) {
      props.onChange('');
    } else if (!isNaN(numeric)) {
      props.onChange(trimmed);
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

  const normalizedValue: string = value ? value.toString() : '';
  return (
    <PriceLayout onMouseEnter={showTooltip} onMouseLeave={hideTooltip} onMouseMove={onMouseMove}>
      <Direction direction={props.arrow}/>
      <TableInput
        tabIndex={props.tabIndex}
        value={normalizedValue}
        onDoubleClick={onDoubleClick}
        onBlur={props.onBlur}
        onSubmit={onSubmit}
        onChange={onChange}
        readOnly={!props.editable}
        color={props.color}/>
      {/* The floating object */}
      {getTooltip()}
    </PriceLayout>
  );
};

