import {Message} from 'interfaces/md';
import {Action} from 'redux';
import {createAction} from 'redux/actionCreator';
import {RowActions} from 'redux/constants/rowConstants';
import {toRowId} from 'utils';
import {toTOBRow} from 'utils/dataParser';
import {$$} from 'utils/stringPaster';

export const toWMessageAction = <A extends Action>(data: Message): A => {
  const type: string = $$(toRowId(data.Tenor, data.Symbol, data.Strategy), RowActions.Update);
  // Dispatch the action now
  return createAction<string, any>(type, toTOBRow(data));
};
