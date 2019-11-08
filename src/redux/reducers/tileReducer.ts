import {Order} from 'interfaces/order';
import {AnyAction} from 'redux';
import {SignalRActions} from 'redux/constants/signalRConstants';
import {TileActions} from 'redux/constants/tileConstants';
import {WindowState, TileStatus} from 'redux/stateDefs/windowState';
import {$$} from 'utils/stringPaster';

const genesisState: WindowState = {
  connected: false,
  oco: false,
  symbol: '',
  strategy: '',
  rows: {},
  status: TileStatus.None,
  orders: {},
};

const insertOrder = (orders: { [key: string]: Order }, key: string, order: Order) => {
  return {...orders, [key]: order};
};

const removeOrder = (orders: { [key: string]: Order }, order: Order) => {
  const entries = Object.entries(orders);
  const entry = entries.find(([, value]: [string, Order]) => value.OrderID === order.OrderID);
  if (entry) {
    const copy = {...orders};
    delete copy[entry[0]];
    return copy;
  }
  return orders;
};

export const createWindowReducer = (id: string, initialState: WindowState = genesisState) => {
  return (state: WindowState = initialState, {type, data}: AnyAction) => {
    switch (type) {
      case $$(id, TileActions.Initialize):
        return {...state, rows: data};
      case $$(id, TileActions.SetStrategy):
        return {...state, strategy: data};
      case $$(id, TileActions.SetSymbol):
        return {...state, symbol: data};
      case SignalRActions.Connected:
        return {...state, connected: true};
      case SignalRActions.Disconnected:
        return {...state, connected: false};
      case $$(id, TileActions.ToggleOCO):
        return {...state, oco: !state.oco};
      case $$(id, TileActions.CreateOrder):
        return {...state, status: TileStatus.CreatingOrder};
      case $$(id, TileActions.OrderCreated):
        return {...state, status: TileStatus.OrderCreated, orders: insertOrder(state.orders, data.key, data.order)};
      case $$(id, TileActions.OrderNotCreated):
        return {...state, status: TileStatus.OrderNotCreated};
      case $$(id, TileActions.CancelOrder):
        return {...state, status: TileStatus.CancelingOrder};
      case $$(id, TileActions.OrderCanceled):
        return {...state, status: TileStatus.OrderCanceled, orders: removeOrder(state.orders, data.order)};
      case $$(id, TileActions.OrderNotCanceled):
        return {...state, status: TileStatus.OrderNotCanceled};
      case $$(id, TileActions.AllOrdersCanceled):
        return {...state, orders: {}};
      case $$(id, TileActions.SnapshotReceived):
        console.log(data);
        return state;
      default:
        return state;
    }
  };
};
