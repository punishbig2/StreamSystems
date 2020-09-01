import { FXOAction } from "actionCreator";
import { activateOrder } from "components/Run/reducers/activateOrder";
import { activateRow } from "components/Run/reducers/activateRow";
import { deactivateAll } from "components/Run/reducers/deactivateAll";
import { deactivateOrder } from "components/Run/reducers/deactivateOrder";
import { removeAll } from "components/Run/reducers/removeAll";
import { removeOrder } from "components/Run/reducers/removeOrder";
import { setSpread } from "components/Run/reducers/setSpread";
import { updateOrder } from "components/Run/reducers/updateOrder";
import { updateRowStatus } from "components/Run/reducers/updateRowStatus";
import { updateSize } from "components/Run/reducers/updateSize";
import { valueChange } from "components/Run/reducers/valueChange";
import { RunState } from "stateDefs/runState";

export enum RunActions {
  Mid = "mid",
  Spread = "spread",
  Ofr = "ofr",
  Bid = "bid",
  // Other
  SetTable = "RUN_SET_TABLE",
  SetLoadingStatus = "RUN_SET_LOADING_STATUS",
  OfrSizeChanged = "RUN_OFFER_SIZE_CHANGED",
  BidSizeChanged = "RUN_BID_SIZE_CHANGED",
  UpdateBid = "RUN_UPDATE_BID",
  UpdateDefaultOfrSize = "RUN_UPDATE_DEFAULT_OFFER_SIZE",
  UpdateOfr = "RUN_UPDATE_OFFER",
  DeactivateAllOrders = "RUN_DEACTIVATE_ALL_ORDERS",
  UpdateDefaultBidSize = "RUN_UPDATE_DEFAULT_BID_SIZE",
  RemoveOrder = "RUN_REMOVE_ORDER",
  RemoveAllOfrs = "RUN_REMOVE_ALL_OFFERS",
  RemoveAllBids = "RUN_REMOVE_ALL_BIDS",
  SetDefaultSize = "RUN_SET_DEFAULT_SIZE",
  ActivateRow = "RUN_ACTIVATE_ROW",
  ActivateOrder = "RUN_ACTIVATE_ORDER",
  DeactivateOrder = "RUN_DEACTIVATE_ORDER",
  ResetAll = "RUN_RESET_ALL",
  SetRowStatus = "RUN_SET_ROW_STATUS",
  SetSpread = "RUN_SET_SPREAD",
}

export default (
  state: RunState,
  { type, data }: FXOAction<RunActions>
): RunState => {
  switch (type) {
    case RunActions.SetRowStatus:
      return updateRowStatus(state, data);
    case RunActions.SetLoadingStatus:
      return { ...state, isLoading: true };
    case RunActions.SetDefaultSize:
      return { ...state, defaultOfrSize: data, defaultBidSize: data };
    case RunActions.RemoveOrder:
      return removeOrder(state, data);
    case RunActions.UpdateDefaultBidSize:
      return { ...state, defaultBidSize: data };
    case RunActions.UpdateDefaultOfrSize:
      return { ...state, defaultOfrSize: data };
    case RunActions.UpdateBid:
      return updateOrder(state, data, "bid");
    case RunActions.UpdateOfr:
      return updateOrder(state, data, "ofr");
    case RunActions.SetTable:
      return { ...state, orders: data, original: data, isLoading: false };
    case RunActions.OfrSizeChanged:
      return updateSize(state, data, "ofr");
    case RunActions.BidSizeChanged:
      return updateSize(state, data, "bid");
    case RunActions.RemoveAllBids:
      return removeAll(state, "bid");
    case RunActions.RemoveAllOfrs:
      return removeAll(state, "ofr");
    case RunActions.Bid:
    case RunActions.Ofr:
    case RunActions.Mid:
    case RunActions.Spread:
      return valueChange(state, { type, data });
    case RunActions.ActivateRow:
      return activateRow(state, data);
    case RunActions.DeactivateAllOrders:
      return deactivateAll(state, data);
    case RunActions.ActivateOrder:
      return activateOrder(state, data);
    case RunActions.DeactivateOrder:
      return deactivateOrder(state, data);
    case RunActions.ResetAll:
      return {
        defaultOfrSize: 0,
        defaultBidSize: 0,
        original: {},
        orders: {},
        isLoading: false,
      };
    case RunActions.SetSpread:
      return setSpread(state, data);
    default:
      return state;
  }
};
