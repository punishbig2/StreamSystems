import {API} from 'API';
import {Message} from 'interfaces/md';
import {EntryTypes, MDEntry} from 'interfaces/mdEntry';
import {TOBEntry} from 'interfaces/tobEntry';
import {TOBRow} from 'interfaces/tobRow';
import {TOBTable} from 'interfaces/tobTable';
import {Action} from 'redux/action';
import {createAction} from 'redux/actionCreator';
import {AsyncAction} from 'redux/asyncAction';
import {RowActions} from 'redux/constants/rowConstants';
import {TileActions} from 'redux/constants/tileConstants';
import {toTOBRow} from 'utils/dataParser';
import {$$} from 'utils/stringPaster';

/*const miniEntry = (data: TOBEntry) => {
  if (data.type === EntryTypes.Ask) {
    return {offer: data};
  } else {
    return {bid: data};
  }
};*/

type ActionType = Action<TileActions>;
export const createOrder = (entry: TOBEntry, quantity: number): AsyncAction<any, ActionType> => {
  return new AsyncAction<any, ActionType>(async (): Promise<ActionType> => {
    const result = await API.createOrder(entry, quantity);
    console.log(result);
    return createAction(TileActions.OrderCreated);
  }, createAction(TileActions.CreateOrder));
};

export const getSnapshot = (symbol: string, strategy: string, tenor: string): AsyncAction<any, ActionType> => {
  return new AsyncAction<any, ActionType>(async (): Promise<ActionType> => {
    const message: Message | null = await API.getSnapshot(symbol, strategy, tenor);
    if (message !== null) {
      const type: string = $$(tenor, symbol, strategy, RowActions.Update);
      // Create the action
      return createAction(type, toTOBRow(message));
    }
    return createAction(TileActions.SnapshotReceived, message);
  }, createAction(TileActions.GettingSnapshot));
};
