import {Point} from 'components/structures/point';
import {PriceLayout} from 'components/Table/CellRenderers/Price/layout';
import {Size} from 'components/Table/CellRenderers/Size';
import {Action} from 'interfaces/action';
import React, {CSSProperties, useReducer} from 'react';
import styled from 'styled-components';

export enum PriceTypes {
  DarkPool = 'dark-pool',
}

interface PriceProps {
  value: number;
  editable: boolean;
  type?: PriceTypes;
  dob?: { price: number, size: number }[];
}

interface TooltipProps {
  x: number;
  y: number;
  render: React.FC<any>,
}

const TooltipContainer = styled.div`
  position: fixed;
  z-index: 9;
  background-color: white;
  padding: 8px;
  box-shadow: 0 2px 8px 0px rgba(0, 0, 0, 0.5);
  border-radius: 3px;
  font-size: ${({theme}) => theme.tableFontSize}px;
  font-weight: ${({theme}) => theme.tableFontWeight};
  font-family: ${({theme}) => theme.tableFontFamily};
`;
const Tooltip: React.FC<TooltipProps> = (props: TooltipProps) => {
  const style: CSSProperties = {left: props.x + 16, top: props.y + 16};
  return (
    <TooltipContainer style={style}>
      {props.render(0)}
    </TooltipContainer>
  );
};

const SHOW_TOOLTIP = 'SHOW_TOOLTIP';
const HIDE_TOOLTIP = 'HIDE_TOOLTIP';
const MOVE_TOOLTIP = 'MOVE_TOOLTIP';

interface State {
  x: number;
  y: number;
  visible: boolean;
}

const initialState: State = {
  x: 0,
  y: 0,
  visible: false,
};

const reducer = (state: State, {type, payload}: Action) => {
  switch (type) {
    case SHOW_TOOLTIP:
      return {...state, visible: true};
    case HIDE_TOOLTIP:
      return {...state, visible: false};
    case MOVE_TOOLTIP:
      return {...state, ...payload};
    default:
      return state;
  }
};

const MiniPrice = styled.div`
    padding: 0 4px;
`;

const MiniDOBRow = styled.div`
  display: flex;
  align-items: center;
`;

export const Price: React.FC<PriceProps> = (props: PriceProps) => {
  const [state, dispatch] = useReducer<typeof reducer>(reducer, initialState);
  const {value, dob} = props;
  const DOB: React.FC<void> = () => {
    if (!dob)
      return null;
    const children = dob.map(({price, size}: { price: number, size: number }) => (
      <MiniDOBRow key={price}>
        <MiniPrice>{price.toFixed(2)}</MiniPrice>
        <Size value={size || 0} type={'rtl'}/>
      </MiniDOBRow>
    ));
    return (
      <React.Fragment>
        {children}
      </React.Fragment>
    );
  };
  const showTooltip = () => dispatch(new Action(SHOW_TOOLTIP));
  const hideTooltip = () => dispatch(new Action(HIDE_TOOLTIP));
  const onMouseMove = (event: React.MouseEvent) => dispatch(new Action(MOVE_TOOLTIP, Point.fromEvent(event)));
  return (
    <PriceLayout onMouseEnter={showTooltip} onMouseLeave={hideTooltip} onMouseMove={onMouseMove}>
      <input defaultValue={value.toFixed(2)} readOnly={!props.editable} className={props.type}/>
      {/* The floating object */}
      {state.visible && <Tooltip x={state.x} y={state.y} render={DOB}/>}
    </PriceLayout>
  );
};
