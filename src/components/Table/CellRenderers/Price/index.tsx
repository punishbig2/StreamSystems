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
  width: 16px;
  left: 16px;
  top: 0;
  bottom: 0;
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
  black?: boolean;
}

export const Price: React.FC<Props> = (props: Props) => {
  const [arrow, setArrow] = useState<Arrows>(Arrows.None);
  const [lastValue, setLastValue] = useState<number | null>(null);
  const [state, dispatch] = useReducer<typeof reducer>(reducer, initialState);
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
    if (value === null)
      return;
    if (lastValue === null) {
      setArrow(Arrows.None);
    } else if (value < lastValue) {
      setArrow(Arrows.Down);
    } else if (value > lastValue) {
      setArrow(Arrows.Up);
    }
  }, [lastValue, value]);
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
  const onChange = (value: string) => props.onChange(Number(value));
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
        value={getValue()}
        onChange={onChange}
        readOnly={!props.editable}
        className={[props.priceType, props.black ? 'black' : undefined].join(' ')}
        onDoubleClick={onDoubleClick}
        onSubmit={onSubmit}/>
      {/* The floating object */}
      {getTooltip()}
    </PriceLayout>
  );
};

