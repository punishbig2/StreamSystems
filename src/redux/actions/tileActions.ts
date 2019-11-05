import {API} from 'API';
import {Message} from 'interfaces/md';
import {TOBEntry} from 'interfaces/tobEntry';
import {Action} from 'redux/action';
import {createAction} from 'redux/actionCreator';
import {AsyncAction} from 'redux/asyncAction';
import {TileActions} from 'redux/constants/tileConstants';
import {$$} from 'utils/stringPaster';
import {wMessageToAction} from 'utils/wMessageToAction';

/*const miniEntry = (data: TOBEntry) => {
  if (data.type === EntryTypes.Ask) {
    return {offer: data};
  } else {
    return {bid: data};
  }
};*/

type ActionType = Action<TileActions>;

export const createOrder = (id: string, entry: TOBEntry, quantity: number): AsyncAction<any, ActionType> => {
  return new AsyncAction<any, ActionType>(async (): Promise<ActionType> => {
    const result = await API.createOrder(entry, quantity);
    console.log(result);
    return createAction($$(id, TileActions.OrderCreated));
  }, createAction($$(id, TileActions.CreateOrder)));
};

export const getSnapshot = (symbol: string, strategy: string, tenor: string): AsyncAction<any, ActionType> => {
  return new AsyncAction<any, ActionType>(async (dispatch: any): Promise<ActionType> => {
    const message: Message | null = await API.getSnapshot(symbol, strategy, tenor);
    if (message !== null) {
      wMessageToAction(message, dispatch);
    }
    return createAction(TileActions.SnapshotReceived, message);
  }, createAction(TileActions.GettingSnapshot));
};
