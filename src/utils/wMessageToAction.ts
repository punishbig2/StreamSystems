import {Message} from 'interfaces/md';
import {Action, Dispatch} from 'redux';
import {createAction} from 'redux/actionCreator';
import {RowActions} from 'redux/constants/rowConstants';
import {toTOBRow} from 'utils/dataParser';
import {$$} from 'utils/stringPaster';

export const wMessageToAction = <A extends Action>(data: Message, dispatch: Dispatch<A>) => {
  const type: string = $$('__ROW', data.Tenor, data.Symbol, data.Strategy, RowActions.Update);
  // Dispatch the action now
  dispatch(createAction<string, any>(type, toTOBRow(data)));
};
