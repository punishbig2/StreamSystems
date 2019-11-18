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
    switch (type) {
      case $$(id, RowActions.Remove):
        if (data === '2') {
          return {...state, row: {...row, offer: {...row.offer, price: null, quantity: null}}};
        } else if (data === '1') {
          return {...state, row: {...row, bid: {...row.bid, price: null, quantity: null}}};
        } else {
          throw new Error('unknown side, cannot process removal!!!');
        }
      case $$(id, RowActions.Update):
        console.log(data);
        return {...state, row: data};
      case $$(id, RowActions.SetOfferPrice):
        return {...state, row: {...row, offer: {...row.offer, price: data}}};
      case $$(id, RowActions.SetOfferQuantity):
        return {...state, row: {...row, offer: {...row.offer, quantity: data}}};
      case $$(id, RowActions.SetBidPrice):
        return {...state, row: {...row, bid: {...row.bid, price: data}}};
      case $$(id, RowActions.SetBidQuantity):
        return {...state, row: {...row, bid: {...row.bid, quantity: data}}};
      default:
        return state;
    }
  };
};
