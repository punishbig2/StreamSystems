import {PriceActions} from 'components/Table/CellRenderers/Price/constants';
import {State} from 'components/Table/CellRenderers/Price/state';
import {Action} from 'redux/action';

export const reducer = (
  state: State,
  {type, data}: Action<PriceActions>,
): State => {
  switch (type) {
    case PriceActions.ShowTooltip:
      return {...state, visible: true, startedShowingTooltip: false};
    case PriceActions.HideTooltip:
      return {...state, visible: false, startedShowingTooltip: false};
    case PriceActions.MoveTooltip:
      return {...state, ...data};
    case PriceActions.StartShowingTooltip:
      return {...state, startedShowingTooltip: true};
    case PriceActions.StopShowingTooltip:
      return {...state, startedShowingTooltip: false};
    case PriceActions.SetStatus:
      return {...state, status: data};
    case PriceActions.SetValue:
      return {
        ...state,
        internalValue: data.value,
        status: state.status | data.status,
      };
    case PriceActions.ResetValue:
      return {...state, internalValue: data.value, status: data.status};
    case PriceActions.Flash:
      return {...state, flash: true};
    case PriceActions.Unflash:
      return {...state, flash: false};
    default:
      return state;
  }
};
