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

export const cancelOrder = (id: string, orderId: string, tenor: string, symbol: string, strategy: string): AsyncAction<any, ActionType> => {
  return new AsyncAction<any, ActionType>(async (): Promise<ActionType> => {
    const result = await API.cancelOrder(orderId, tenor, symbol, strategy);
    if (result.Status === 'Success') {
      return createAction($$(id, TileActions.OrderCanceled, {
        order: {OrderID: result.OrderID},
      }));
    } else {
      return createAction($$(id, TileActions.OrderNotCanceled));
    }
  }, createAction($$(id, TileActions.CancelOrder)));
};

export const createOrder = (id: string, entry: TOBEntry, side: Sides, quantity: number): AsyncAction<any, ActionType> => {
  return new AsyncAction<any, ActionType>(async (): Promise<ActionType> => {
    const result = await API.createOrder(entry, side, quantity);
    // FIXME: parse the result
    if (result.Status === 'Success') {
      return createAction($$(id, TileActions.OrderCreated), {
        order: {OrderID: result.OrderID},
        key: $$(entry.tenor, side),
      });
    } else {
      return createAction($$(id, TileActions.OrderNotCreated));
    }
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
