import { OrderTypes } from "interfaces/mdEntry";
import { Order, OrderErrors, OrderStatus, Sides } from "interfaces/order";
import { TOBRowStatus, TOBRow } from "interfaces/tobRow";
import { Action } from "redux/action";
import { RowState } from "redux/stateDefs/rowState";
import { equal } from "utils/equal";
import { $$ } from "utils/stringPaster";
import { TOBActions } from "redux/reducers/tobReducer";

const genesisState: RowState = {
  row: {}
};

const isModified = (original: Order, received: Order): boolean => {
  return !equal(original, received);
};

const setBeingCancelled = (order: Order) => ({
  ...order,
  status: OrderStatus.BeingCancelled | order.status
});
const canBeCancelled = (order: Order) =>
  (order.status & OrderStatus.PreFilled) !== 0 &&
  ((order.status & OrderStatus.Owned) !== 0 ||
    (order.status & OrderStatus.SameBank) !== 0);

const getRowStatusFromOrderError = (
  reason: OrderErrors,
  status: TOBRowStatus
) => {
  if (reason === OrderErrors.NegativePrice) {
    return TOBRowStatus.NegativePrice;
  } else {
    return status;
  }
};

export enum RowActions {
  Update = "RowActions.Update",
  UpdateDP = "RowActions.Update.DP",
  Remove = "RowActions.Remove",
  SetOfferPrice = "RowActions.SetOfferPrice",
  SetBidPrice = "RowActions.SetBidPrice",
  SetRowStatus = "RowActions.SetRowStatus",
  UpdateOfr = "RowActions.UpdateOfr",
  UpdateBid = "RowActions.UpdateBid",
  CreatingOrder = "RowActions.CreatingOrder",
  CancellingOrder = "RowActions.CancellingOrder",
  SnapshotReceived = "RowActions.SnapshotReceived",
  GettingSnapshot = "RowActions.GettingSnapshot",
  ErrorGettingSnapshot = "RowActions.ErrorGettingSnapshot",
  Executed = "RowActions.Executed",
  ResetStatus = "RowActions.ResetStatus",
  UpdateDarkPrice = "RowActions.UpdateDarkPrice",
  OrderNotCreated = "RowActions.OrderNotCreated",
  // These actions are not being used currently
  OrderCreated = "RowActions.OrderCreated",
  OrderCanceled = "RowActions.OrderCanceled",
  OrderNotCanceled = "RowActions.OrderNotCanceled"
}

const getStatus = (o1: Order, o2: Order): OrderStatus => {
  return (
    o1.status |
    (o2.quantity !== o1.quantity ? OrderStatus.QuantityEdited : 0) |
    (o2.price !== o1.price ? OrderStatus.PriceEdited : 0)
  );
};

const handleDarkPoolUpdate = (state: RowState, dpRow: TOBRow): RowState => {
  const { bid, ofr } = dpRow;
  const { row } = state;
  return {
    ...state,
    row: {
      ...row,
      darkPool: {
        ...dpRow,
        ofr: { ...ofr, status: ofr.status | OrderStatus.DarkPool },
        bid: { ...bid, status: bid.status | OrderStatus.DarkPool }
      }
    }
  };
};

export const createRowReducer = (
  id: string,
  initialState: RowState = genesisState
) => {
  return (
    state: RowState = initialState,
    { type, data }: Action<RowActions | TOBActions>
  ): RowState => {
    const { row } = state;
    const { ofr, bid } = row;
    switch (type) {
      case $$(id, RowActions.UpdateDarkPrice):
        return { ...state, row: { ...row, darkPrice: data } };
      case $$(id, RowActions.Remove):
        if (data === "2") {
          return {
            ...state,
            row: { ...row, ofr: { ...ofr, price: null, quantity: null } }
          };
        } else if (data === "1") {
          return {
            ...state,
            row: { ...row, bid: { ...bid, price: null, quantity: null } }
          };
        } else {
          throw new Error("unknown side, cannot process removal!!!");
        }
      case $$(id, RowActions.CreatingOrder):
        if (data === OrderTypes.Bid) {
          return {
            ...state,
            row: {
              ...row,
              bid: { ...bid, status: OrderStatus.BeingCreated | bid.status }
            }
          };
        } else if (data === OrderTypes.Ofr) {
          return {
            ...state,
            row: {
              ...row,
              ofr: { ...ofr, status: OrderStatus.BeingCreated | ofr.status }
            }
          };
        } else {
          return state;
        }
      case $$(id, RowActions.CancellingOrder):
        if (data === OrderTypes.Bid) {
          return {
            ...state,
            row: {
              ...row,
              bid: { ...bid, status: OrderStatus.BeingCancelled | bid.status }
            }
          };
        } else if (data === OrderTypes.Ofr) {
          return {
            ...state,
            row: {
              ...row,
              ofr: { ...ofr, status: OrderStatus.BeingCancelled | ofr.status }
            }
          };
        } else {
          return state;
        }
      case $$(id, RowActions.OrderNotCreated):
        const { order, reason } = data;
        if (order.type === OrderTypes.Bid) {
          return {
            ...state,
            row: {
              ...row,
              bid: {
                ...bid,
                status: bid.status & ~OrderStatus.BeingCreated,
                price: null,
                quantity: null
              },
              status: getRowStatusFromOrderError(reason, row.status)
            }
          };
        } else if (data.type === OrderTypes.Ofr) {
          return {
            ...state,
            row: {
              ...row,
              ofr: {
                ...ofr,
                status: ofr.status & ~OrderStatus.BeingCreated,
                price: null,
                quantity: null
              },
              status: getRowStatusFromOrderError(reason, row.status)
            }
          };
        } else {
          return state;
        }
      case $$(id, RowActions.UpdateOfr):
        if (!isModified(ofr, data)) return state;
        return {
          ...state,
          row: { ...row, ofr: { ...data, status: getStatus(ofr, data) } }
        };
      case $$(id, RowActions.UpdateBid):
        if (!isModified(bid, data)) return state;
        return {
          ...state,
          row: { ...row, bid: { ...data, status: getStatus(bid, data) } }
        };
      case $$(id, RowActions.UpdateDP):
        return handleDarkPoolUpdate(state, data);
      case $$(id, RowActions.Update):
        // WARNING: preserving status across updates can be a problem but it seems
        //          that after it's set the first time it should remain as is unless
        //          explicitly changed
        return { ...state, row: { ...row, ...data } };
      case $$(id, RowActions.SetOfferPrice):
        if (bid.price > data) return state;
        return { ...state, row: { ...row, ofr: { ...ofr, price: data } } };
      case $$(id, RowActions.SetBidPrice):
        if (ofr.price < data) return state;
        return { ...state, row: { ...row, bid: { ...bid, price: data } } };
      case $$(id, RowActions.SetRowStatus):
        return { ...state, row: { ...row, status: data } };
      case TOBActions.CancelAllOrders:
        switch (data.side) {
          case Sides.Buy:
            if (
              bid.symbol !== data.symbol ||
              bid.strategy !== data.strategy ||
              !canBeCancelled(bid)
            )
              return state;
            return {
              ...state,
              row: { ...row, bid: setBeingCancelled(bid) }
            };
          case Sides.Sell:
            if (
              ofr.symbol !== data.symbol ||
              ofr.strategy !== data.strategy ||
              !canBeCancelled(ofr)
            )
              return state;
            return {
              ...state,
              row: { ...row, ofr: setBeingCancelled(ofr) }
            };
          default:
            return state;
        }
      case $$(id, RowActions.GettingSnapshot):
        return {
          ...state,
          row: {
            ...row,
            ofr: { ...ofr, status: OrderStatus.BeingLoaded | ofr.status },
            bid: { ...bid, status: OrderStatus.BeingLoaded | bid.status }
          }
        };
      case $$(id, RowActions.Executed):
        return { ...state, row: { ...row, status: TOBRowStatus.Executed } };
      case $$(id, RowActions.ResetStatus):
        return { ...state, row: { ...row, status: TOBRowStatus.Normal } };
      case $$(id, RowActions.ErrorGettingSnapshot):
      // TODO: show the error somehow?
      // eslint-disable-next-line no-fallthrough
      case $$(id, RowActions.SnapshotReceived):
        return {
          ...state,
          row: {
            ...row,
            ofr: { ...ofr, status: ofr.status & ~OrderStatus.BeingLoaded },
            bid: { ...bid, status: bid.status & ~OrderStatus.BeingLoaded }
          }
        };
      default:
        return state;
    }
  };
};
