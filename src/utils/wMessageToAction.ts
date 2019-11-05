import {Message} from 'interfaces/md';
import {Action, Dispatch} from 'redux';
import {createAction} from 'redux/actionCreator';
import {RowActions} from 'redux/constants/rowConstants';
import {toTOBRow} from 'utils/dataParser';
import {$$} from 'utils/stringPaster';

export const wMessageToAction = <A extends Action>(data: Message, dispatch: Dispatch<A>) => {
  dispatch(createAction<string, any>($$(data.Tenor, data.Strategy, data.Symbol, RowActions.Update), toTOBRow(data)));
};
