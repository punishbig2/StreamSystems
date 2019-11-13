import {EntryTypes} from 'interfaces/mdEntry';
import {MessageBlotterEntry} from 'interfaces/messageBlotterEntry';
import {TOBEntry} from 'interfaces/tobEntry';
import {Action} from 'redux/action';
import {RowActions} from 'redux/constants/rowConstants';
import {RunActions} from 'redux/constants/runConstants';
import {RunState} from 'redux/stateDefs/runState';
import {$$} from 'utils/stringPaster';

const genesisState: RunState = {
  orders: [],
};

const orderFromMDEntry = (entry: MessageBlotterEntry): TOBEntry => {
  return {
    orderId: entry.OrderID,
    price: Number(entry.Price),
    quantity: Number(entry.OrderQty),
    type: entry.Side === '1' ? EntryTypes.Bid : EntryTypes.Offer,
    symbol: entry.Symbol,
    strategy: entry.Strategy,
    tenor: entry.Tenor,
    user: entry.Username,
  };
};

export const createRunReducer = (id: string, initialState: RunState = genesisState) => {
  return (state: RunState = initialState, {type, data}: Action<RowActions>): RunState => {
    switch (type) {
      case $$(id, RunActions.UpdateOrders):
        return {...state, orders: [orderFromMDEntry(data), ...state.orders]};
      case $$(id, ''):
        return state;
      default:
        return state;
    }
  };
};
