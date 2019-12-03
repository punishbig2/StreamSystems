import {AnyAction} from 'redux';
import {SignalRActions} from 'redux/constants/signalRConstants';
import {TOBActions} from 'redux/constants/tobConstants';
import {TileStatus, WindowState} from 'redux/stateDefs/windowState';
import {$$} from 'utils/stringPaster';

const genesisState: WindowState = {
  connected: false,
  oco: false,
  symbol: '',
  strategy: '',
  rows: {},
  status: TileStatus.None,
};

export const createWindowReducer = (id: string, initialState: WindowState = genesisState) => {
  return (state: WindowState = initialState, {type, data}: AnyAction) => {
    switch (type) {
      case SignalRActions.Connected:
        return {...state, connected: true};
      case SignalRActions.Disconnected:
        return {...state, connected: false};
      case $$(id, TOBActions.Initialize):
        return {...state, rows: data};
      case $$(id, TOBActions.SetStrategy):
        return {...state, strategy: data};
      case $$(id, TOBActions.SetSymbol):
        return {...state, symbol: data};
      case $$(id, TOBActions.ToggleOCO):
        return {...state, oco: !state.oco};
      case $$(id, TOBActions.CreateOrder):
        return {...state, status: TileStatus.CreatingOrder};
      case $$(id, TOBActions.OrderCreated):
        return {...state, status: TileStatus.OrderCreated};
      case $$(id, TOBActions.OrderNotCreated):
        return {...state, status: TileStatus.OrderNotCreated};
      case $$(id, TOBActions.CancelOrder):
        return {...state, status: TileStatus.CancelingOrder};
      case $$(id, TOBActions.OrderCanceled):
        return {...state, status: TileStatus.OrderCanceled};
      case $$(id, TOBActions.OrderNotCanceled):
        return {...state, status: TileStatus.OrderNotCanceled};
      case $$(id, TOBActions.AllOrdersCanceled):
        return {...state, orders: {}};
      case $$(id, TOBActions.SnapshotReceived):
        return state;
      case $$(id, TOBActions.UpdateDOB):
        return state;
      default:
        return state;
    }
  };
};

