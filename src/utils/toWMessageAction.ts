import {Message} from 'interfaces/md';
import {Action} from 'redux';
import {createAction} from 'redux/actionCreator';
import {RowActions} from 'redux/constants/rowConstants';
import {toRowId} from 'utils';
import {toTOBRow} from 'utils/dataParser';
import {$$} from 'utils/stringPaster';

export const toWMessageAction = <A extends Action>(data: Message): A => {
  const {Symbol, Strategy} = data;
  // Build a per-row action to update a single individual and specific row
  // in a specific table
  const type: string = $$(toRowId(data.Tenor, Symbol, Strategy), RowActions.Update);
  // Dispatch the action now
  return createAction<string, any>(type, toTOBRow(data));
};
