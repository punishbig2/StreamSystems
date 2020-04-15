import { PriceActions } from 'components/Table/CellRenderers/Price/constants';
import { State } from 'components/Table/CellRenderers/Price/state';
import { FXOAction } from 'actionCreator';

export const reducer = (state: State, action: FXOAction<PriceActions>): State => {
  const { type, data } = action;
  switch (type) {
    case PriceActions.ShowTooltip:
      return { ...state, tooltipVisible: true };
    case PriceActions.HideTooltip:
      return { ...state, tooltipVisible: false };
    case PriceActions.MoveTooltip:
      return { ...state, ...data };
    case PriceActions.SetStatus:
      return { ...state, status: data };
    case PriceActions.SetValue:
      return {
        ...state,
        internalValue: data.value,
        status: state.status | data.status,
      };
    case PriceActions.ResetValue:
      return { ...state, internalValue: data.value, status: data.status };
    case PriceActions.Flash:
      return { ...state, flash: true };
    case PriceActions.Unflash:
      return { ...state, flash: false };
    default:
      return state;
  }
};
