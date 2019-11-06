import {API} from 'API';
import {Message} from 'interfaces/md';
import {Sides} from 'interfaces/order';
import {TOBEntry} from 'interfaces/tobEntry';
import {Action} from 'redux/action';
import {createAction} from 'redux/actionCreator';
import {AsyncAction} from 'redux/asyncAction';
import {TileActions} from 'redux/constants/tileConstants';
import {$$} from 'utils/stringPaster';
import {wMessageToAction} from 'utils/wMessageToAction';

/*const miniEntry = (row: TOBEntry) => {
  if (row.type === EntryTypes.Ask) {
    return {offer: row};
  } else {
    return {bid: row};
  }
};*/

type ActionType = Action<TileActions>;

export const cancelOrder = (id: string, orderId: string): AsyncAction<any, ActionType> => {
  return new AsyncAction<any, ActionType>(async (): Promise<ActionType> => {
    const result = await API.cancelOrder(orderId);
    // FIXME: parse the result
    if (result.Status === 'Success') {
      console.log('order created');
    } else {
      console.log('error');
    }
    return createAction($$(id, TileActions.OrderCreated));
  }, createAction($$(id, TileActions.CreateOrder)));
};

export const createOrder = (id: string, entry: TOBEntry, side: Sides, quantity: number): AsyncAction<any, ActionType> => {
  return new AsyncAction<any, ActionType>(async (): Promise<ActionType> => {
    const result = await API.createOrder(entry, side, quantity);
    // FIXME: parse the result
    if (result.Status === 'Success') {
      console.log('order created');
    } else {
      console.log('error');
    }
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
