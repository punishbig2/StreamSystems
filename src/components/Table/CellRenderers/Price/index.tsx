import {PriceRendererActions} from 'components/Table/CellRenderers/Price/constants';
import {PriceTypes} from 'components/Table/CellRenderers/Price/priceTypes';
import {TableInput} from 'components/TableInput';
import {EntryTypes} from 'interfaces/mdEntry';
import {TOBEntry} from 'interfaces/tobEntry';
import {createAction} from 'redux/actionCreator';
import {Point} from 'structures/point';
import {PriceLayout} from 'components/Table/CellRenderers/Price/layout';
import {MiniDOB} from 'components/Table/CellRenderers/Price/miniDob';
import {reducer} from 'components/Table/CellRenderers/Price/reducer';
import {State} from 'components/Table/CellRenderers/Price/state';
import {Tooltip} from 'components/Table/CellRenderers/Price/tooltip';
import React, {ReactElement, useEffect, useReducer, useState} from 'react';
import styled from 'styled-components';

enum Arrows {
  None = 'none',
  Up = 'up',
  Down = 'down',
}

interface DirectionProps {
  direction: Arrows;
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
  return (
    <DirectionLayout>
      <i className={`fa fa-long-arrow-alt-${props.direction}`}/>
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
  value: number | null;
  editable: boolean;
  table?: TOBEntry[];
  type?: EntryTypes;
  priceType?: PriceTypes;
  // Events
  onDoubleClick?: () => void;
  onChange: (value: number) => void;
  onSubmit?: (value: number) => void;
  color: 'red' | 'blue' | 'green' | 'black' | 'gray',
  onBlur?: () => void;
  tabIndex?: number;
}

export const Price: React.FC<Props> = (props: Props) => {
  const [arrow, setArrow] = useState<Arrows>(Arrows.None);
  const [lastValue, setLastValue] = useState<number | null>(null);
  const [state, dispatch] = useReducer<typeof reducer>(reducer, initialState);
  const [modified, setModified] = useState<boolean>(false);
  const {value, table} = props;
  useEffect(() => {
    if (state.startedShowingTooltip) {
      const timer = setTimeout(() => dispatch(createAction(PriceRendererActions.ShowTooltip)), 500);
      return () => {
        dispatch(createAction(PriceRendererActions.StopShowingTooltip));
        clearTimeout(timer);
      };
    }
  }, [state.startedShowingTooltip]);
  useEffect(() => {
    if (value === null || modified)
      return;
    if (lastValue === null) {
      setArrow(Arrows.None);
    } else if (value < lastValue) {
      setArrow(Arrows.Down);
    } else if (value > lastValue) {
      setArrow(Arrows.Up);
    }
  }, [lastValue, modified, value]);
  useEffect(() => {
    setLastValue(value);
  }, [value]);
  const showTooltip = () => dispatch(createAction(PriceRendererActions.StartShowingTooltip));
  const hideTooltip = () => dispatch(createAction(PriceRendererActions.HideTooltip));
  const onMouseMove = (event: React.MouseEvent) => dispatch(
    createAction(PriceRendererActions.MoveTooltip, Point.fromEvent(event)),
  );
  const getTooltip = () => {
    if ((state.visible === false) || (table === undefined) || (table.length === 0))
      return null;
    const id: string = `${value}.xxx`;
    return <Tooltip x={state.x} y={state.y} render={() => <MiniDOB {...props} rows={table} id={id}/>}/>;
  };
  // FIXME: debounce this if possible
  const onChange = (value: string) => {
    // Whether the input was edited or not
    setModified(true);
    // Call the onChange proxy function
    props.onChange(Number(value));
  };
  const getValue = (): string => ((value !== undefined && value !== null) && value.toString()) || '';
  const onDoubleClick = (event: React.MouseEvent) => {
    if (props.onDoubleClick) {
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
      props.onSubmit(Number(getValue()));
    }
  };

  return (
    <PriceLayout onMouseEnter={showTooltip} onMouseLeave={hideTooltip} onMouseMove={onMouseMove}>
      <Direction direction={arrow}/>
      <TableInput
        tabIndex={props.tabIndex}
        value={getValue()}
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

