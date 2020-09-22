import { PriceActions } from "components/Table/CellRenderers/Price/constants";
import { State } from "components/Table/CellRenderers/Price/state";
import { FXOAction } from "utils/actionCreator";

export const reducer = (
  state: State,
  action: FXOAction<PriceActions>
): State => {
  const { type, data } = action;
  switch (type) {
    case PriceActions.ShowTooltip:
      return { ...state, tooltipVisible: true };
    case PriceActions.HideTooltip:
      return { ...state, tooltipVisible: false };
    case PriceActions.MoveTooltip:
      return { ...state, ...data };
    case PriceActions.SetValue:
      return { ...state, internalValue: data.value };
    case PriceActions.Flash:
      return { ...state, flash: true };
    case PriceActions.Unflash:
      return { ...state, flash: false };
    default:
      return state;
  }
};
