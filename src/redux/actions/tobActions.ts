import {API} from 'API';
import {OrderTypes} from 'interfaces/mdEntry';
import {Order, OrderErrors, OrderMessage, Sides} from 'interfaces/order';
import {OrderResponse} from 'interfaces/orderResponse';
import {TOBRowStatus} from 'interfaces/tobRow';
import {User} from 'interfaces/user';
import {W} from 'interfaces/w';
import {AnyAction} from 'redux';
import {Action} from 'redux/action';
import {createAction} from 'redux/actionCreator';
import {AsyncAction} from 'redux/asyncAction';
import {RowActions} from 'redux/constants/rowConstants';
import {SignalRActions} from 'redux/constants/signalRConstants';
import {TOBActions} from 'redux/constants/tobConstants';
import {SignalRAction} from 'redux/signalRAction';
import {getSideFromType, toRowID} from 'utils';
import {getAuthenticatedUser} from 'utils/getCurrentUser';
import {emitUpdateOrderEvent, handlers} from 'utils/messageHandler';
import {$$} from 'utils/stringPaster';

type ActionType = Action<TOBActions>;

export const cancelOrder = (id: string, order: Order): AsyncAction<any, ActionType> => {
  const rowID: string = toRowID(order);
  const initialAction: AnyAction = createAction($$(rowID, RowActions.CancellingOrder), order.type);
  const handler: () => Promise<ActionType> = async (): Promise<ActionType> => {
    const result = await API.cancelOrder(order);
    if (result.Status === 'Success') {
      const type: string = $$(order.uid(), TOBActions.DeleteOrder);
      const event: Event = new CustomEvent(type, {detail: result.OrderID});
      // Emit the event
      document.dispatchEvent(event);
      // Return the action
      // FIXME: we should do this with events too
      return createAction($$(rowID, RowActions.OrderCanceled));
    } else {
      return createAction($$(rowID, RowActions.OrderNotCanceled));
    }
  };
  return new AsyncAction<any, ActionType>(handler, initialAction);
};

export const getRunOrders = (id: string, symbol: string, strategy: string): AsyncAction<any, any> => {
  const user: User = getAuthenticatedUser();
  return new AsyncAction<any, any>(async (): Promise<ActionType> => {
    const entries: OrderMessage[] = await API.getRunOrders(user.email, symbol, strategy);
    entries
      .map((entry: OrderMessage): Order => Order.fromOrderMessage(entry, user.email))
      .forEach(emitUpdateOrderEvent);
    return createAction('');
  }, createAction(''));
};

export const cancelAll = (id: string, symbol: string, strategy: string, side: Sides): AsyncAction<any, ActionType> => {
  return new AsyncAction<any, ActionType>(async (): Promise<ActionType> => {
    const result = await API.cancelAll(symbol, strategy, side);
    // FIXME: parse the result
    console.log(result);
    if (result.Status === 'Success') {
      const type: string = $$(symbol, strategy, side, TOBActions.DeleteOrder);
      const event: Event = new CustomEvent(type);
      // Emit the event
      document.dispatchEvent(event);
      return createAction('___IGNORE');
    } else {
      return createAction('___IGNORE');
    }
  }, createAction(TOBActions.CancelAllOrders, {side, symbol, strategy}));
};

export const updateOrderQuantity = (id: string, order: Order): Action<string> => {
  if (order.type === OrderTypes.Ofr) {
    return createAction($$(toRowID(order), RowActions.UpdateOfr), order);
  } else if (order.type === OrderTypes.Bid) {
    return createAction($$(toRowID(order), RowActions.UpdateBid), order);
  } else {
    throw new Error('what the hell should I do?');
  }
};

export const updateOrder = (id: string, order: Order): AsyncAction<any, ActionType> => {
  return new AsyncAction<any, ActionType>(async (): Promise<ActionType> => {
    const result = await API.updateOrder(order);
    if (result.Status === 'Success') {
      return createAction($$(id, TOBActions.OrderUpdated));
    } else {
      return createAction($$(id, TOBActions.OrderNotUpdated));
    }
  }, createAction($$(id, TOBActions.UpdatingOrder)));
};

export const setRowStatus = (id: string, order: Order, status: TOBRowStatus): Action<string> => {
  return createAction($$(order, RowActions.SetRowStatus), status);
};

export const createOrder = (id: string, order: Order, minQty: number): AsyncAction<any, ActionType> => {
  const rowID: string = toRowID(order);
  const initialAction: AnyAction = createAction($$(rowID, RowActions.CreatingOrder), order.type);
  const handler: () => Promise<ActionType> = async (): Promise<ActionType> => {
    const result: OrderResponse = await API.createOrder(order);
    // FIXME: parse the result
    if (result.Status === 'Success') {
      return createAction($$(rowID, RowActions.OrderCreated), {
        order: {OrderID: result.OrderID},
        key: $$(order.tenor, getSideFromType(order.type)),
      });
    } else {
      if (result.Response === OrderErrors.NegativePrice)
        return createAction($$(rowID, RowActions.OrderNotCreated), {order, reason: OrderErrors.NegativePrice});
      return createAction($$(rowID, RowActions.OrderNotCreated), {order});
    }
  };
  return new AsyncAction<any, ActionType>(handler, initialAction);
};

export const getSnapshot = (id: string, symbol: string, strategy: string, tenor: string): AsyncAction<any, ActionType> => {
  const rowID: string = $$('__ROW', tenor, symbol, strategy);
  return new AsyncAction<any, ActionType>(async () => {
    const tob: W | null = await API.getTOBSnapshot(symbol, strategy, tenor);
    const w: W | null = await API.getSnapshot(symbol, strategy, tenor);
    if (tob !== null && w !== null) {
      // Dispatch the "standardized" action + another action to capture the value and
      // update some internal data
      return [
        handlers.W(tob),
        handlers.W(w),
        createAction($$(rowID, RowActions.SnapshotReceived), tob),
      ];
    } else {
      return createAction($$(rowID, RowActions.ErrorGettingSnapshot));
    }
  }, createAction($$(rowID, RowActions.GettingSnapshot)));
};

export const subscribe = (symbol: string, strategy: string, tenor: string): SignalRAction<SignalRActions> => {
  return new SignalRAction(SignalRActions.SubscribeForMarketData, [symbol, strategy, tenor]);
};

export const unsubscribe = (symbol: string, strategy: string, tenor: string): SignalRAction<SignalRActions> => {
  return new SignalRAction(SignalRActions.UnsubscribeFromMarketData, [symbol, strategy, tenor]);
};

