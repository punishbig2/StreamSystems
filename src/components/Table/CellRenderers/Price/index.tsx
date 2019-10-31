import {PriceRendererActions} from 'components/Table/CellRenderers/Price/constants';
import {PriceTypes} from 'components/Table/CellRenderers/Price/priceTypes';
import {TableInput} from 'components/TableInput';
import {EntryTypes} from 'interfaces/mdEntry';
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
  value?: string;
  mine: boolean;
  dob?: { price: string, size: string }[];
  type?: EntryTypes;
  priceType?: PriceTypes;
  // Events
  onDoubleClick: () => void;
}

export const Price: React.FC<Props> = (props: Props) => {
  const [arrow, setArrow] = useState<Arrows>(Arrows.None);
  const [lastValue, setLastValue] = useState<string | undefined>(undefined);
  const [state, dispatch] = useReducer<typeof reducer>(reducer, initialState);
  const {value, dob} = props;

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
    const difference: number = Number(value) - Number(lastValue);
    if (lastValue === undefined)
      return;
    if (difference > 0) {
      setArrow(Arrows.Down);
    } else if (difference < 0) {
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
    if ((state.visible === false) || (dob === undefined) || (dob.length === 0))
      return null;
    return <Tooltip x={state.x} y={state.y} render={() => <MiniDOB {...props} dob={dob}/>}/>;
  };
  const ignoreOriginalEvent = (callback: () => void) => (event: React.MouseEvent) => {
    const target: HTMLInputElement = event.target as HTMLInputElement;
    // Stop the event
    event.stopPropagation();
    event.preventDefault();
    // Remove focus and selection
    target.setSelectionRange(0, 0);
    target.blur();
    // Call the callback
    return callback();
  };
  return (
    <PriceLayout onMouseEnter={showTooltip} onMouseLeave={hideTooltip} onMouseMove={onMouseMove}>
      <Direction direction={arrow}/>
      <TableInput defaultValue={value || ''} readOnly={!props.mine} className={props.priceType}
                  onDoubleClick={ignoreOriginalEvent(props.onDoubleClick)}/>
      {/* The floating object */}
      {getTooltip()}
    </PriceLayout>
  );
};

