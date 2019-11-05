import {Action} from 'redux/action';
import {RowActions} from 'redux/constants/rowConstants';
import {TOBRowState} from 'redux/stateDefs/rowState';
import {$$} from 'utils/stringPaster';

const genesisState: TOBRowState = {
  data: {},
};

export const createRowReducer = (id: string, initialState: TOBRowState = genesisState) => {
  return (state: TOBRowState = initialState, {type, data}: Action<RowActions>) => {
    const OnRowChanged: string = $$(id, RowActions.Update);
    switch (type) {
      case OnRowChanged:
        return {...state, data};
      default:
        return state;
    }
  };
};
