import {AnyAction} from 'redux';
import {TOBActions} from 'redux/constants/tobConstants';
import {WindowState} from 'redux/stateDefs/windowState';
import {$$} from 'utils/stringPaster';

const genesisState: WindowState = {
  oco: false,
  symbol: '',
  strategy: '',
  rows: {},
};

export const createWindowReducer = (id: string, initialState: WindowState = genesisState) => {
  return (state: WindowState = initialState, {type, data}: AnyAction) => {
    switch (type) {
      case $$(id, TOBActions.Initialize):
        return {...state, rows: data};
      case $$(id, TOBActions.SetStrategy):
        return {...state, strategy: data};
      case $$(id, TOBActions.SetSymbol):
        return {...state, symbol: data};
      case $$(id, TOBActions.ToggleOCO):
        return {...state, oco: !state.oco};
      case $$(id, TOBActions.UpdateDOB):
        return state;
      default:
        return state;
    }
  };
};

