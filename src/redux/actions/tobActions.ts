import {API} from 'API';
import {OrderTypes} from 'interfaces/mdEntry';
import {Order, OrderErrors, OrderMessage, Sides, OrderStatus, DarkPoolOrder} from 'interfaces/order';
import {OrderResponse} from 'interfaces/orderResponse';
import {TOBRowStatus} from 'interfaces/tobRow';
import {User} from 'interfaces/user';
import {W, DarkPool} from 'interfaces/w';
import {AnyAction} from 'redux';
import {Action} from 'redux/action';
import {createAction} from 'redux/actionCreator';
import {AsyncAction} from 'redux/asyncAction';
import {SignalRActions} from 'redux/constants/signalRConstants';
import {SignalRAction} from 'redux/signalRAction';
import {getSideFromType, toRowID, toRunId} from 'utils';
import {getAuthenticatedUser} from 'utils/getCurrentUser';
import {emitUpdateOrderEvent, handlers} from 'utils/messageHandler';
import {$$} from 'utils/stringPaster';
import {DummyAction} from 'redux/store';
import {FXOptionsDB} from 'fx-options-db';
import {TOBActions} from 'redux/reducers/tobReducer';
import {RunActions} from 'redux/reducers/runReducer';
import {RowActions} from 'redux/reducers/rowReducer';

type ActionType = Action<TOBActions | string>;
export const cancelDarkPoolOrder = (id: string, order: Order): AsyncAction<any, ActionType> => {
  const rowID: string = toRowID(order);
  const initialAction: AnyAction = createAction($$(rowID, RowActions.CancellingOrder, DarkPool), order.type);
  const handler: () => Promise<ActionType> = async (): Promise<ActionType> => {
    const result = await API.cancelDarkPoolOrder(order);
    if (result.Status === 'Success') {
      const type: string = $$(order.uid(), TOBActions.DeleteOrder, DarkPool);
      const event: Event = new CustomEvent(type, {detail: result.OrderID});
      // Emit the event
      document.dispatchEvent(event);
      // Return the action
      // FIXME: we should do this with events too
      return createAction($$(rowID, RowActions.OrderCanceled, DarkPool));
    } else {
      return createAction($$(rowID, RowActions.OrderNotCanceled, DarkPool));
    }
  };
  return new AsyncAction<any, ActionType>(handler, initialAction);
};


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
    // FIXME: if the 'Status' is failure we should show an error
    //        but currently the internalValue is misleading
    if (result.Status === 'Success' || result.Status === 'Failure') {
      const runID: string =  toRunId(symbol, strategy);
      // Emit the event
      if (side === Sides.Sell) {
        return createAction($$(runID, RunActions.RemoveAllOfrs));
      } else {
        return createAction($$(runID, RunActions.RemoveAllBids));
      }
    } else {
      return DummyAction;
    }
  }, createAction(TOBActions.CancelAllOrders, {side, symbol, strategy}));
};

export const publishDarkPoolPrice = (id: string, symbol: string, strategy: string, tenor: string, price: number) => {
  return new AsyncAction<any, ActionType>(async (): Promise<ActionType> => {
    const user: User = getAuthenticatedUser();
    API.publishDarkPoolPrice(user.email, symbol, strategy, tenor, price);
    return DummyAction;
  }, DummyAction)
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
  return createAction($$(toRowID(order), RowActions.SetRowStatus), status);
};

export const createDarkPoolOrder = (order: DarkPoolOrder, personality: string): AsyncAction<any, ActionType> => {
  return new AsyncAction<any, ActionType>(async () => {
    const result: any = await API.createDarkPoolOrder({...order, MDMkt: personality});
    if (result.Status !== 'Success') {
      console.warn('error creating an order for the dark pool', result);
    }
    return DummyAction;
  }, DummyAction);
};

export const createOrder = (id: string, personality: string, order: Order, minQty: number): AsyncAction<any, ActionType> => {
  const rowID: string = toRowID(order);
  const initialAction: AnyAction = createAction($$(rowID, RowActions.CreatingOrder), order.type);
  const handler: () => Promise<ActionType> = async (): Promise<ActionType> => {
    const result: OrderResponse = await API.createOrder(order, personality, minQty);
    if (result.Status === 'Success') {
      return createAction($$(rowID, RowActions.OrderCreated), {
        order: {
          ...order,
          orderId: result.OrderID,
          status: OrderStatus.PreFilled | OrderStatus.Owned | OrderStatus.Active,
        },
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

export const getDarkPoolSnapshot = (id: string, symbol: string, strategy: string, tenor: string): AsyncAction<any, ActionType> => {
  const rowID: string = $$('__ROW', tenor, symbol, strategy);
  return new AsyncAction<any, ActionType>(async () => {
    const tob: W | null = await API.getDarkPoolTOBSnapshot(symbol, strategy, tenor);
    const w: W | null = await API.getDarkPoolSnapshot(symbol, strategy, tenor);
    if (tob !== null && w !== null) {
      const a1: Action<string> | null = handlers.W<ActionType>(tob, true);
      const a2: Action<string> | null = handlers.W<ActionType>(w, true);
      if (a1 !== null) {
        const {bid, ofr} = a1.data;
        bid.status = bid.status | OrderStatus.DarkPool;
        ofr.status = ofr.status | OrderStatus.DarkPool;
      }
      // Dispatch the "standardized" action + another action to capture the internalValue and
      // update some internal data
      return [...(a1 ? [a1] : []), ...(a2 ? [a2] : [])];
    } else {
      return createAction($$(rowID, RowActions.ErrorGettingSnapshot));
    }
  }, createAction($$(rowID, RowActions.GettingSnapshot)));
};

export const getSnapshot = (id: string, symbol: string, strategy: string, tenor: string): AsyncAction<any, ActionType> => {
  const rowID: string = $$('__ROW', tenor, symbol, strategy);
  return new AsyncAction<any, ActionType>(async () => {
    const tob: W | null = await API.getTOBSnapshot(symbol, strategy, tenor);
    const w: W | null = await API.getSnapshot(symbol, strategy, tenor);
    if (tob !== null) {
      const a1 = handlers.W(tob, false);
      const a2 = w ? handlers.W(w, false) : undefined;
      return [
        ...(a1 ? [a1] : []),
        ...(a2 ? [a2] : []),
        createAction($$(rowID, RowActions.SnapshotReceived), tob),
      ];
    } else {
      return createAction($$(rowID, RowActions.ErrorGettingSnapshot));
    }
  }, createAction($$(rowID, RowActions.GettingSnapshot)));
};

export const subscribeDarkPool = (symbol: string, strategy: string, tenor: string): SignalRAction<SignalRActions> => {
  return new SignalRAction(SignalRActions.SubscribeForDarkPoolPx, [symbol, strategy, tenor]);
};

export const subscribe = (symbol: string, strategy: string, tenor: string): SignalRAction<SignalRActions> => {
  return new SignalRAction(SignalRActions.SubscribeForMarketData, [symbol, strategy, tenor]);
};

export const unsubscribe = (symbol: string, strategy: string, tenor: string): SignalRAction<SignalRActions> => {
  return new SignalRAction(SignalRActions.UnsubscribeFromMarketData, [symbol, strategy, tenor]);
};

export const setStrategy = (tileID: string, strategy: string) => {
  return new AsyncAction<any, ActionType>(async () => {
    FXOptionsDB.setWindowStrategy(tileID, strategy);
    return createAction($$(tileID, TOBActions.SetStrategy), strategy);
  }, DummyAction);
};

export const setSymbol = (tileID: string, symbol: string) => {
  return new AsyncAction<any, ActionType>(async () => {
    FXOptionsDB.setWindowSymbol(tileID, symbol);
    return createAction($$(tileID, TOBActions.SetSymbol), symbol);
  }, DummyAction);
};

