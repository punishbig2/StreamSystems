import {Point} from 'components/structures/point';
import {
  ENTERING,
  GRABBED, HOVER_MOVE,
  LEAVING,
  DRAW_AWAY_FOR_INSERTION,
  MOVE,
  RESIZE,
  UPDATE_INTRINSIC_GEOMETRY,
} from 'components/Tiles/TileController/constants';
import {State} from 'components/Tiles/TileController/state';
import {Action} from 'interfaces/action';

const move = (state: State, to: Point, offset: Point | undefined): State => {
  const {geometry} = state;
  if (offset === undefined)
    return state;
  return {...state, geometry: geometry.moveTo(to.x - offset.x, to.y - offset.y), grabbedAt: to};
};

export const reducer = (state: State, {type, payload}: Action) => {
  const {geometry} = state;
  switch (type) {
    case MOVE:
      return move(state, payload, state.grabbedAt);
    case UPDATE_INTRINSIC_GEOMETRY:
      return {...state, geometry: payload};
    case GRABBED:
      return {...state, grabbedAt: payload};
    case RESIZE:
      return {...state, geometry: geometry.resize(payload.x, payload.y)};
    case ENTERING:
      return {...state, hovering: true, hoveringAt: undefined};
    case LEAVING:
      return {...state, hovering: false, hoveringAt: undefined};
    case DRAW_AWAY_FOR_INSERTION:
      return {...state, drawingAway: payload};
    case HOVER_MOVE:
      return {...state, hoveringAt: payload};
    default:
      return state;
  }
};