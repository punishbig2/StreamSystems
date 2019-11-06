import {Action} from 'redux/action';
import {RowActions} from 'redux/constants/rowConstants';

type R<S> = (state: S, {type, data}: Action<RowActions>) => S;
export const logReducer = <S>(reduce: R<S>, initialState: any) => {
  return (state: S = initialState, action: Action<RowActions>): S => {
    const newState: S = reduce(state, action);
    console.log(newState);
    return newState;
  };
};
