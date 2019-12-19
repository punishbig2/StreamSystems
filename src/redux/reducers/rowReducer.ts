import {OrderTypes} from 'interfaces/mdEntry';
import {Order, OrderErrors, OrderStatus, Sides} from 'interfaces/order';
import {TOBRowStatus} from 'interfaces/tobRow';
import {Action} from 'redux/action';
import {RowActions} from 'redux/constants/rowConstants';
import {TOBActions} from 'redux/constants/tobConstants';
import {RowState} from 'redux/stateDefs/rowState';
import {equal} from 'utils/equal';
import {$$} from 'utils/stringPaster';

const genesisState: RowState = {
  row: {},
};

const isModified = (original: Order, received: Order): boolean => {
  return !equal(original, received);
};

const setBeingCancelled = (order: Order) => ({...order, status: OrderStatus.BeingCancelled | order.status});
const canBeCancelled = (order: Order) => (order.status & OrderStatus.PreFilled) !== 0
  && ((order.status & OrderStatus.Owned) !== 0 || (order.status & OrderStatus.SameBank) !== 0);

const getRowStatusFromOrderError = (reason: OrderErrors) => {
  switch (reason) {
    case OrderErrors.NegativePrice:
      return TOBRowStatus.NegativePrice;
    default:
      return TOBRowStatus.Normal;
  }
};

export const createRowReducer = (id: string, initialState: RowState = genesisState) => {
  return (state: RowState = initialState, {type, data}: Action<RowActions | TOBActions>): RowState => {
    const {row} = state;
    const {ofr, bid} = row;
    switch (type) {
      case $$(id, RowActions.Remove):
        if (data === '2') {
          return {...state, row: {...row, ofr: {...ofr, price: null, quantity: null}}};
        } else if (data === '1') {
          return {...state, row: {...row, bid: {...bid, price: null, quantity: null}}};
        } else {
          throw new Error('unknown side, cannot process removal!!!');
        }
      case $$(id, RowActions.CreatingOrder):
        if (data === OrderTypes.Bid) {
          return {...state, row: {...row, bid: {...bid, status: OrderStatus.BeingCreated | bid.status}}};
        } else if (data === OrderTypes.Ofr) {
          return {...state, row: {...row, ofr: {...ofr, status: OrderStatus.BeingCreated | ofr.status}}};
        } else {
          return state;
        }
      case $$(id, RowActions.CancellingOrder):
        if (data === OrderTypes.Bid) {
          return {...state, row: {...row, bid: {...bid, status: OrderStatus.BeingCancelled | bid.status}}};
        } else if (data === OrderTypes.Ofr) {
          return {...state, row: {...row, ofr: {...ofr, status: OrderStatus.BeingCancelled | ofr.status}}};
        } else {
          return state;
        }
      case $$(id, RowActions.OrderCanceled):
        return state;
      case $$(id, RowActions.OrderNotCanceled):
        return state;
      case $$(id, RowActions.OrderCreated):
        return state;
      case $$(id, RowActions.OrderNotCreated):
        const {order, reason} = data;
        if (order.type === OrderTypes.Bid) {
          return {
            ...state,
            row: {
              ...row,
              bid: {...bid, status: bid.status & ~OrderStatus.BeingCreated, price: null, quantity: null},
              status: getRowStatusFromOrderError(reason),
            },
          };
        } else if (data.type === OrderTypes.Ofr) {
          return {
            ...state,
            row: {
              ...row,
              ofr: {...ofr, status: ofr.status & ~OrderStatus.BeingCreated, price: null, quantity: null},
              status: getRowStatusFromOrderError(reason),
            },
          };
        } else {
          return state;
        }
      case $$(id, RowActions.UpdateOfr):
        if (!isModified(ofr, data))
          return state;
        return {...state, row: {...row, ofr: data}};
      case $$(id, RowActions.UpdateBid):
        if (!isModified(bid, data))
          return state;
        return {...state, row: {...row, bid: data}};
      case $$(id, RowActions.Update):
        return {...state, row: data};
      case $$(id, RowActions.SetOfferPrice):
        if (bid.price > data)
          return state;
        return {...state, row: {...row, ofr: {...ofr, price: data}}};
      case $$(id, RowActions.SetOfferQuantity):
        return {...state, row: {...row, ofr: {...ofr, quantity: data}}};
      case $$(id, RowActions.SetBidPrice):
        if (ofr.price < data)
          return state;
        return {...state, row: {...row, bid: {...bid, price: data}}};
      case $$(id, RowActions.SetBidQuantity):
        return {...state, row: {...row, bid: {...bid, quantity: data}}};
      case $$(id, RowActions.SetRowStatus):
        return {...state, row: {...row, status: data}};
      case TOBActions.CancelAllOrders:
        switch (data.side) {
          case Sides.Buy:
            if (bid.symbol !== data.symbol || bid.strategy !== data.strategy || !canBeCancelled(bid))
              return state;
            return {
              ...state, row: {...row, bid: setBeingCancelled(bid)},
            };
          case Sides.Sell:
            if (ofr.symbol !== data.symbol || ofr.strategy !== data.strategy || !canBeCancelled(ofr))
              return state;
            return {
              ...state, row: {...row, ofr: setBeingCancelled(ofr)},
            };
          default:
            return state;
        }
      case $$(id, RowActions.GettingSnapshot):
        return {
          ...state,
          row: {
            ...row,
            ofr: {...ofr, status: OrderStatus.BeingLoaded | ofr.status},
            bid: {...bid, status: OrderStatus.BeingLoaded | bid.status},
          },
        };
      case $$(id, RowActions.ErrorGettingSnapshot):
      // TODO: show the error somehow?
      // eslint-disable-next-line no-fallthrough
      case $$(id, RowActions.SnapshotReceived):
        return {
          ...state,
          row: {
            ...row,
            ofr: {...ofr, status: ofr.status & ~OrderStatus.BeingLoaded},
            bid: {...bid, status: bid.status & ~OrderStatus.BeingLoaded},
          },
        };
      default:
        return state;
    }
  };
};
