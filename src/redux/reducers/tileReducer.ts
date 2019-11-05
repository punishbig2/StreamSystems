import {AnyAction} from 'redux';
import {SignalRActions} from 'redux/constants/signalRConstants';
import {TileActions} from 'redux/constants/tileConstants';
import {TileState} from 'redux/stateDefs/tileState';
import {$$} from 'utils/stringPaster';

const genesisState: TileState = {
  connected: false,
  oco: false,
  symbol: '',
  product: '',
  rows: {},
};

/**/

export const createTileReducer = (id: string, initialState: TileState = genesisState) => {
  return (state: TileState = initialState, {type, data}: AnyAction) => {
    // const UpdateRow: string = $$(TileActions.UpdateRow, state.product, state.symbol);
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
      // case $$(id, TileActions.UpdateEntry):
      // FIXME: this should be handled in a row reducer
      // return {...state, rows: {...state.rows, [data.tenor]: {...state.rows[data.tenor], ...miniEntry(data)}}};
      case TileActions.CreateOrder:
        // TODO: show a progress indicator
        return {...state};
      default:
        return state;
    }
  };
};
