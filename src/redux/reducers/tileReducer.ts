import {AnyAction} from 'redux';
import {SignalRActions} from 'redux/constants/signalRConstants';
import {TileActions} from 'redux/constants/tileConstants';
import {TileState, TileStatus} from 'redux/stateDefs/tileState';
import {$$} from 'utils/stringPaster';

const genesisState: TileState = {
  connected: false,
  oco: false,
  symbol: '',
  product: '',
  rows: {},
  dobs: {},
  status: TileStatus.None,
};

export const createTileReducer = (id: string, initialState: TileState = genesisState) => {
  return (state: TileState = initialState, {type, data}: AnyAction) => {
    switch (type) {
      case $$(id, TileActions.Initialize):
        return {...state, rows: data};
      case $$(id, TileActions.SetProduct):
        return {...state, product: data};
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
      default:
        return state;
    }
  };
};
