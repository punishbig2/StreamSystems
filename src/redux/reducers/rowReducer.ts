import {Action} from 'redux/action';
import {RowActions} from 'redux/constants/rowConstants';
import {RowState} from 'redux/stateDefs/rowState';
import {$$} from 'utils/stringPaster';

const genesisState: RowState = {
  row: {},
};

export const createRowReducer = (id: string, initialState: RowState = genesisState) => {
  return (state: RowState = initialState, {type, data}: Action<RowActions>) => {
    const {row} = state;
    switch (type) {
      case $$(id, RowActions.Update):
        return {...state, row: data};
      case $$(id, RowActions.SetOfferPrice):
        const finalState = {...state, row: {...row, offer: {...row.offer, price: data}}};
        console.log(finalState);
        return finalState;
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
