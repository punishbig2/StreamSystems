import {Reducer} from 'react';
import {FXOAction} from 'redux/fxo-action';
import {toNumberOrFallbackIfNaN} from 'columns/podColumns/OrderColumn/helpers/toNumberOrFallbackIfNaN';

export interface State {
  editedSize: number | null;
  submittedSize: number | null;
}

export enum ActionTypes {
  SetEditedSize, SetSubmittedSize, ResetAllSizes, OrderCreated
}

export const reducer: Reducer<State, FXOAction<ActionTypes>> = (state: State, action: FXOAction<ActionTypes>): State => {
  switch (action.type) {
    case ActionTypes.SetEditedSize:
      return {...state, editedSize: toNumberOrFallbackIfNaN(action.data, state.editedSize)};
    case ActionTypes.SetSubmittedSize:
      return {...state, submittedSize: toNumberOrFallbackIfNaN(action.data, state.submittedSize)};
    case ActionTypes.ResetAllSizes:
      return {...state, editedSize: null, submittedSize: null};
    default:
      return state;
  }
};
