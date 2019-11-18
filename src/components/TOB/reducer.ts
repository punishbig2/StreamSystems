import {TOBEntry} from 'interfaces/tobEntry';
import {TOBTable} from 'interfaces/tobTable';

export interface State {
  depths: { [key: string]: TOBTable };
  tenor: string | null;
  orderTicket: TOBEntry | null;
  runWindowVisible: boolean;
}

export enum ActionTypes {
  InsertDepth,
  SetCurrentTenor,
  ShowRunWindow,
  HideRunWindow,
  SetOrderTicket,
}

export const reducer = (state: State, {type, data}: { type: ActionTypes, data: any }) => {
  switch (type) {
    case ActionTypes.InsertDepth:
      return {...state, depths: {...state.depths, [data.tenor]: data.depth}};
    case ActionTypes.ShowRunWindow:
      return {...state, runWindowVisible: true};
    case ActionTypes.HideRunWindow:
      return {...state, runWindowVisible: false};
    case ActionTypes.SetOrderTicket:
      return {...state, orderTicket: data};
    case ActionTypes.SetCurrentTenor:
      return {...state, tenor: data};
    default:
      return state;
  }
};
