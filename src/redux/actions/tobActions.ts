import {API} from 'API';
import {EntryTypes} from 'interfaces/mdEntry';
import {Sides} from 'interfaces/order';
import {EntryStatus, Order} from 'interfaces/order';
import {User} from 'interfaces/user';
import {ArrowDirection, W} from 'interfaces/w';
import {Action} from 'redux/action';
import {createAction} from 'redux/actionCreator';
import {AsyncAction} from 'redux/asyncAction';
import {SignalRActions} from 'redux/constants/signalRConstants';
import {TOBActions} from 'redux/constants/tobConstants';
import {SignalRAction} from 'redux/signalRAction';
import {getSideFromType} from 'utils';
import {getAuthenticatedUser} from 'utils/getCurrentUser';
import {emitUpdateOrderEvent, handlers} from 'utils/messageHandler';
import {$$} from 'utils/stringPaster';

type ActionType = Action<TOBActions>;

export const cancelOrder = (id: string, entry: Order): AsyncAction<any, ActionType> => {
  return new AsyncAction<any, ActionType>(async (): Promise<ActionType> => {
    const result = await API.cancelOrder(entry);
    if (result.Status === 'Success') {
      const type: string = $$(entry.tenor, entry.symbol, entry.strategy, TOBActions.DeleteOrder);
      const event: Event = new CustomEvent(type, {detail: result.OrderID});
      // Emit the event
      document.dispatchEvent(event);
      // Return the action
      // FIXME: we should do this with events too
      return createAction($$(id, TOBActions.OrderCanceled, {
        order: {OrderID: result.OrderID},
      }));
    } else {
      return createAction($$(id, TOBActions.OrderNotCanceled));
    }
  }, createAction($$(id, TOBActions.CancelOrder)));
};

interface OrderMessage {
  OrderID: string;
  Price: string;
  Tenor: string;
  Symbol: string;
  Strategy: string;
  Side: '1' | '2';
  OrderQty: string;
}

export const getRunOrders = (id: string, symbol: string, strategy: string): AsyncAction<any, any> => {
  const user: User = getAuthenticatedUser();
  return new AsyncAction<any, any>(async (): Promise<ActionType> => {
    const entries: OrderMessage[] = await API.getRunOrders(user.email, symbol, strategy);
    entries
      .map((entry: OrderMessage): Order => ({
        orderId: entry.OrderID,
        tenor: entry.Tenor,
        strategy: entry.Strategy,
        symbol: entry.Symbol,
        price: Number(entry.Price),
        quantity: Number(entry.OrderQty),
        user: user.email,
        type: entry.Side === '1' ? EntryTypes.Bid : EntryTypes.Ofr,
        arrowDirection: ArrowDirection.None,
        status: EntryStatus.Cancelled,
      }))
      .forEach(emitUpdateOrderEvent);
    return createAction('');
  }, createAction(''));
};

export const cancelAll = (id: string, symbol: string, strategy: string, side: Sides): AsyncAction<any, ActionType> => {
  return new AsyncAction<any, ActionType>(async (): Promise<ActionType> => {
    const result = await API.cancelAll(symbol, strategy, side);
    // FIXME: parse the result
    if (result.Status === 'Success') {
      return createAction($$(id, TOBActions.AllOrdersCanceled));
    } else {
      return createAction($$(id, TOBActions.AllOrdersNotCanceled));
    }
  }, createAction($$(id, TOBActions.CancelAllOrders)));
};

export const updateOrder = (id: string, entry: Order): AsyncAction<any, ActionType> => {
  return new AsyncAction<any, ActionType>(async (): Promise<ActionType> => {
    const result = await API.updateOrder(entry);
    if (result.Status === 'Success') {
      return createAction($$(id, TOBActions.OrderUpdated));
    } else {
      return createAction($$(id, TOBActions.OrderNotUpdated));
    }
  }, createAction($$(id, TOBActions.UpdatingOrder)));
};

export const createOrder = (id: string, entry: Order): AsyncAction<any, ActionType> => {
  return new AsyncAction<any, ActionType>(async (): Promise<ActionType> => {
    const result = await API.createOrder(entry);
    // FIXME: parse the result
    if (result.Status === 'Success') {
      return createAction($$(id, TOBActions.OrderCreated), {
        order: {OrderID: result.OrderID},
        key: $$(entry.tenor, getSideFromType(entry.type)),
      });
    } else {
      return createAction($$(id, TOBActions.OrderNotCreated));
    }
  }, createAction($$(id, TOBActions.CreateOrder)));
};

export const getSnapshot = (id: string, symbol: string, strategy: string, tenor: string): AsyncAction<any, ActionType> => {
  return new AsyncAction<any, ActionType>(async () => {
    const tob: W | null = await API.getTOBSnapshot(symbol, strategy, tenor);
    const w: W | null = await API.getSnapshot(symbol, strategy, tenor);
    if (tob !== null && w !== null) {
      // Dispatch the "standardized" action + another action to capture the value and
      // update some internal data
      return [
        handlers.W(tob),
        handlers.W(w),
        createAction($$(id, TOBActions.SnapshotReceived), tob),
      ];
    } else {
      return createAction($$(id, TOBActions.ErrorGettingSnapshot));
    }
  }, createAction($$(id, TOBActions.GettingSnapshot)));
};

export const subscribe = (symbol: string, strategy: string, tenor: string): SignalRAction<TOBActions> => {
  return new SignalRAction(SignalRActions.SubscribeForMarketData, [symbol, strategy, tenor]);
};

