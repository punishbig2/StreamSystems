import {API} from 'API';
import {Message} from 'interfaces/md';
import {Sides} from 'interfaces/order';
import {TOBEntry} from 'interfaces/tobEntry';
import {Action} from 'redux/action';
import {createAction} from 'redux/actionCreator';
import {AsyncAction} from 'redux/asyncAction';
import {TileActions} from 'redux/constants/tobConstants';
import {getSideFromType} from 'utils';
import {$$} from 'utils/stringPaster';
import {toWMessageAction} from 'utils/toWMessageAction';

type ActionType = Action<TileActions>;

export const cancelOrder = (id: string, entry: TOBEntry): AsyncAction<any, ActionType> => {
  return new AsyncAction<any, ActionType>(async (): Promise<ActionType> => {
    const result = await API.cancelOrder(entry);
    if (result.Status === 'Success') {
      return createAction($$(id, TileActions.OrderCanceled, {
        order: {OrderID: result.OrderID},
      }));
    } else {
      return createAction($$(id, TileActions.OrderNotCanceled));
    }
  }, createAction($$(id, TileActions.CancelOrder)));
};

export const cancelAll = (id: string, symbol: string, strategy: string, side: Sides): AsyncAction<any, ActionType> => {
  return new AsyncAction<any, ActionType>(async (): Promise<ActionType> => {
    const result = await API.cancelAll(symbol, strategy, side);
    // FIXME: parse the result
    if (result.Status === 'Success') {
      return createAction($$(id, TileActions.AllOrdersCanceled));
    } else {
      return createAction($$(id, TileActions.AllOrdersNotCanceled));
    }
  }, createAction($$(id, TileActions.CancelAllOrders)));
};

export const updateOrder = (id: string, entry: TOBEntry): AsyncAction<any, ActionType> => {
  return new AsyncAction<any, ActionType>(async (): Promise<ActionType> => {
    const result = await API.updateOrder(entry);
    if (result.Status === 'Success') {
      return createAction($$(id, TileActions.OrderUpdated));
    } else {
      return createAction($$(id, TileActions.OrderNotUpdated));
    }
  }, createAction($$(id, TileActions.UpdatingOrder)));
};

export const createOrder = (id: string, entry: TOBEntry): AsyncAction<any, ActionType> => {
  return new AsyncAction<any, ActionType>(async (): Promise<ActionType> => {
    const result = await API.createOrder(entry);
    // FIXME: parse the result
    if (result.Status === 'Success') {
      return createAction($$(id, TileActions.OrderCreated), {
        order: {OrderID: result.OrderID},
        key: $$(entry.tenor, getSideFromType(entry.type)),
      });
    } else {
      return createAction($$(id, TileActions.OrderNotCreated));
    }
  }, createAction($$(id, TileActions.CreateOrder)));
};

export const getSnapshot = (id: string, symbol: string, strategy: string, tenor: string): AsyncAction<any, ActionType> => {
  return new AsyncAction<any, ActionType>(async () => {
    const message: Message | null = await API.getTOBSnapshot(symbol, strategy, tenor);
    if (message !== null) {
      // Dispatch the "standardized" action + another action to capture the value and
      // update some internal data
      return [toWMessageAction(message), createAction($$(id, TileActions.SnapshotReceived), message)];
    } else {
      return createAction($$(id, TileActions.ErrorGettingSnapshot));
    }
  }, createAction($$(id, TileActions.GettingSnapshot)));
};

