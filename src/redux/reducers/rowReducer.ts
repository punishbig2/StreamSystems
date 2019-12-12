import equal from 'fast-deep-equal';
import {OrderTypes} from 'interfaces/mdEntry';
import {Order, OrderStatus} from 'interfaces/order';
import {Action} from 'redux/action';
import {RowActions} from 'redux/constants/rowConstants';
import {RowState} from 'redux/stateDefs/rowState';
import {$$} from 'utils/stringPaster';

const genesisState: RowState = {
  row: {},
};

const isModified = (original: Order, received: Order): boolean => {
  return !equal(original, received);
};

export const createRowReducer = (id: string, initialState: RowState = genesisState) => {
  return (state: RowState = initialState, {type, data}: Action<RowActions>): RowState => {
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
        return state;
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
      default:
        return state;
    }
  };
};
