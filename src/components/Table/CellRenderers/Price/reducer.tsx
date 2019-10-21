import {
  HIDE_TOOLTIP,
  MOVE_TOOLTIP,
  SHOW_TOOLTIP,
  START_SHOWING_TOOLTIP,
  STOP_SHOWING_TOOLTIP,
} from 'components/Table/CellRenderers/Price/constants';
import {State} from 'components/Table/CellRenderers/Price/state';
import {Action} from 'interfaces/action';

export const reducer = (state: State, {type, payload}: Action) => {
  switch (type) {
    case SHOW_TOOLTIP:
      return {...state, visible: true, startedShowingTooltip: false};
    case HIDE_TOOLTIP:
      return {...state, visible: false, startedShowingTooltip: false};
    case MOVE_TOOLTIP:
      return {...state, ...payload};
    case START_SHOWING_TOOLTIP:
      return {...state, startedShowingTooltip: true};
    case STOP_SHOWING_TOOLTIP:
      return {...state, startedShowingTooltip: false};
    default:
      return state;
  }
};
