import {PriceRendererActions} from 'components/Table/CellRenderers/Price/constants';
import {State} from 'components/Table/CellRenderers/Price/state';
import {Action} from 'redux/action';

export const reducer = (state: State, {type, data}: Action<PriceRendererActions>) => {
  switch (type) {
    case PriceRendererActions.ShowTooltip:
      return {...state, visible: true, startedShowingTooltip: false};
    case PriceRendererActions.HideTooltip:
      return {...state, visible: false, startedShowingTooltip: false};
    case PriceRendererActions.MoveTooltip:
      return {...state, ...data};
    case PriceRendererActions.StartShowingTooltip:
      return {...state, startedShowingTooltip: true};
    case PriceRendererActions.StopShowingTooltip:
      return {...state, startedShowingTooltip: false};
    default:
      return state;
  }
};
