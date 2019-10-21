import {Point} from 'components/structures/point';
import {
  HIDE_TOOLTIP,
  MOVE_TOOLTIP,
  SHOW_TOOLTIP,
  START_SHOWING_TOOLTIP,
  STOP_SHOWING_TOOLTIP,
} from 'components/Table/CellRenderers/Price/constants';
import {PriceLayout} from 'components/Table/CellRenderers/Price/layout';
import {MiniDOB} from 'components/Table/CellRenderers/Price/miniDob';
import {PriceProps} from 'components/Table/CellRenderers/Price/props';
import {reducer} from 'components/Table/CellRenderers/Price/reducer';
import {State} from 'components/Table/CellRenderers/Price/state';
import {Tooltip} from 'components/Table/CellRenderers/Price/tooltip';
import {Action} from 'interfaces/action';
import React, {useEffect, useReducer} from 'react';

const initialState: State = {
  x: 0,
  y: 0,
  startedShowingTooltip: false,
  visible: false,
};

export const Price: React.FC<PriceProps> = (props: PriceProps) => {
  const [state, dispatch] = useReducer<typeof reducer>(reducer, initialState);
  const {value, dob} = props;

  useEffect(() => {
    if (state.startedShowingTooltip) {
      const timer = setTimeout(() => dispatch(new Action(SHOW_TOOLTIP)), 300);
      return () => {
        dispatch(new Action(STOP_SHOWING_TOOLTIP));
        clearTimeout(timer);
      };
    }
  }, [state.startedShowingTooltip]);

  const showTooltip = () => dispatch(new Action(START_SHOWING_TOOLTIP));
  const hideTooltip = () => dispatch(new Action(HIDE_TOOLTIP));
  const onMouseMove = (event: React.MouseEvent) => dispatch(new Action(MOVE_TOOLTIP, Point.fromEvent(event)));
  const getTooltip = () => {
    if ((state.visible === false) || (dob === undefined) || (dob.length === 0))
      return null;
    return <Tooltip x={state.x} y={state.y} render={() => <MiniDOB {...props}/>}/>;
  };
  return (
    <PriceLayout onMouseEnter={showTooltip} onMouseLeave={hideTooltip} onMouseMove={onMouseMove}>
      <input defaultValue={value.toFixed(2)} readOnly={!props.mine} className={props.priceType}/>
      {/* The floating object */}
      {getTooltip()}
    </PriceLayout>
  );
};
