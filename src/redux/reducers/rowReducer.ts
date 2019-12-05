import {Action} from 'redux/action';
import {RowActions} from 'redux/constants/rowConstants';
import {RowState} from 'redux/stateDefs/rowState';
import {$$} from 'utils/stringPaster';

const genesisState: RowState = {
  row: {},
};

export const createRowReducer = (id: string, initialState: RowState = genesisState) => {
  return (state: RowState = initialState, {type, data}: Action<RowActions>): RowState => {
    const {row} = state;
    const {ofr, bid} = row;
    switch (type) {
      case $$(id, RowActions.Remove):
        if (data === '2') {
          return {...state, row: {...row, ofr: {...row.ofr, price: null, quantity: null}}};
        } else if (data === '1') {
          return {...state, row: {...row, bid: {...row.bid, price: null, quantity: null}}};
        } else {
          throw new Error('unknown side, cannot process removal!!!');
        }
      case $$(id, RowActions.UpdateOfr):
        return {...state, row: {...row, ofr: data}};
      case $$(id, RowActions.UpdateBid):
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
