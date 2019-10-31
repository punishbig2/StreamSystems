import {Action} from 'redux/action';
import {TileActions} from 'redux/constants/tileConstants';
import {TileState} from 'redux/stateDefs/tileState';
import {$$} from 'utils/stringPaster';

const genesisState: TileState = {};

export const createTileReducer = (id: string, initialState: TileState = genesisState) => {
  console.log(`new tile reducer: ${id}`);
  return (state: TileState = initialState, {type, data}: Action<any>) => {
    console.log(type);
    switch (type) {
      case $$(id, TileActions.SetProduct):
        return {...state, product: data};
      case $$(id, TileActions.SetSymbol):
        return {...state, symbol: data};
      default:
        return state;
    }
  };
};
