import {API} from 'API';
import {OrderStatus} from 'interfaces/order';
import {W} from 'interfaces/w';
import {createAction, createWindowAction} from 'redux/actionCreator';
import {AsyncAction} from 'redux/asyncAction';
import {SignalRActions} from 'redux/constants/signalRConstants';
import {SignalRAction} from 'redux/signalRAction';
import {handlers} from 'utils/messageHandler';
import {$$} from 'utils/stringPaster';
import {DummyAction} from 'redux/store';
import {FXOptionsDB} from 'fx-options-db';
import {PodTileActions} from 'redux/reducers/podTileReducer';
import {RowActions} from 'redux/reducers/rowReducer';
import {Currency} from 'interfaces/currency';
import {FXOAction} from 'redux/fxo-action';

type FXOActionType = FXOAction<PodTileActions | string>;
/*export const cancelDarkPoolOrder = (id: string, order: Order): AsyncAction<any, FXOActionType> => {
  const rowID: string = toRowID(order);
  const initialAction: AnyAction = createAction(
    $$(rowID, RowActions.CancellingOrder, DarkPool),
    order.type,
  );
  const handler: () => Promise<FXOActionType> = async (): Promise<FXOActionType> => {
    const result = await API.cancelDarkPoolOrder(order);
    if (result.Status === 'Success') {
      const type: string = $$(order.uid(), PodTileActions.DeleteOrder, DarkPool);
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
  return new AsyncAction<any, FXOActionType>(handler, initialAction);
};

export const cancelOrder = (id: string, order: Order): AsyncAction<any, FXOActionType> => {
  const rowID: string = toRowID(order);
  const initialAction: AnyAction = createAction(
    $$(rowID, RowActions.CancellingOrder),
    order.type,
  );
  const handler: () => Promise<FXOActionType> = async (): Promise<FXOActionType> => {
    const result = await API.cancelOrder(order);
    if (result.Status === 'Success') {
      const type: string = $$(order.uid(), PodTileActions.DeleteOrder);
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
  return new AsyncAction<any, FXOActionType>(handler, initialAction);
};

export const getRunOrders = (id: string, symbol: string, strategy: string): AsyncAction<any, any> => {
  const user: User = getAuthenticatedUser();
  return new AsyncAction<any, any>(async (): Promise<FXOActionType> => {
    const entries: OrderMessage[] = await API.getRunOrders(user.email, symbol, strategy);
    entries
      .map((entry: OrderMessage): Order => Order.fromOrderMessage(entry, user.email))
      .forEach(emitUpdateOrderEvent);
    return createAction('');
  }, createAction(''));
};

export const cancelAll = (id: string, symbol: string, strategy: string, side: Sides): AsyncAction<any, FXOActionType> => {
  return new AsyncAction<any, FXOActionType>(async (): Promise<FXOActionType> => {
    const result = await API.cancelAll(symbol, strategy, side);
    // FIXME: if the 'Status' is failure we should show an error
    //        but currently the internalValue is misleading
    if (result.Status === 'Success' || result.Status === 'Failure') {
      const runID: string = toRunId(symbol, strategy);
      // Emit the event
      if (side === Sides.Sell) {
        return createAction($$(runID, RunActions.RemoveAllOfrs));
      } else {
        return createAction($$(runID, RunActions.RemoveAllBids));
      }
    } else {
      return DummyAction;
    }
  }, createAction(PodTileActions.CancelAllOrders, {side, symbol, strategy}));
};

export const publishDarkPoolPrice = (
  id: string,
  symbol: string,
  strategy: string,
  tenor: string,
  price: number,
) => {
  return new AsyncAction<any, FXOActionType>(async (): Promise<FXOActionType> => {
    const user: User = getAuthenticatedUser();
    API.publishDarkPoolPrice(user.email, symbol, strategy, tenor, price);
    return DummyAction;
  }, DummyAction);
};

export const updateOrder = (id: string, order: Order): FXOAction<string> => {
  if (order.type === OrderTypes.Ofr) {
    return createAction($$(toRowID(order), RowActions.UpdateOfr), order);
  } else if (order.type === OrderTypes.Bid) {
    return createAction($$(toRowID(order), RowActions.UpdateBid), order);
  } else {
    throw new Error('what the hell should I do?');
  }
};

export const updateOrder = (id: string, order: Order): AsyncAction<any, FXOActionType> => {
  return new AsyncAction<any, FXOActionType>(async (): Promise<FXOActionType> => {
    const result = await API.updateOrder(order);
    if (result.Status === 'Success') {
      return createAction($$(id, PodTileActions.OrderUpdated));
    } else {
      return createAction($$(id, PodTileActions.OrderNotUpdated));
    }
  }, createAction($$(id, PodTileActions.UpdatingOrder)));
};

export const setRowStatus = (id: string, order: Order, status: TOBRowStatus): FXOAction<string> => {
  return createAction($$(toRowID(order), RowActions.SetRowStatus), status);
};

export const createDarkPoolOrder = (order: DarkPoolOrder, personality: string): AsyncAction<any, FXOActionType> => {
  return new AsyncAction<any, FXOActionType>(async () => {
    const result: any = await API.createDarkPoolOrder({
      ...order,
      MDMkt: personality,
    });
    if (result.Status !== 'Success') {
      console.warn('error creating an order for the dark pool', result);
    }
    return DummyAction;
  }, DummyAction);
};

export const createOrder = (id: string, personality: string, order: Order, minimumSize: number): AsyncAction<any, FXOActionType> => {
  const rowID: string = toRowID(order);
  const initialAction: AnyAction = createAction(
    $$(rowID, RowActions.CreatingOrder),
    order.type,
  );
  const handler: () => Promise<FXOActionType> = async (): Promise<FXOActionType> => {
    const result: MessageResponse = await API.createOrder(order, personality, minimumSize);
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
        return createAction($$(rowID, RowActions.OrderNotCreated), {
          order,
          reason: OrderErrors.NegativePrice,
        });
      return createAction($$(rowID, RowActions.OrderNotCreated), {order});
    }
  };
  return new AsyncAction<any, FXOActionType>(handler, initialAction);
};*/

export const getDarkPoolSnapshot = (id: string, symbol: string, strategy: string, tenor: string): AsyncAction<any, FXOActionType> => {
  const rowID: string = $$('__ROW', tenor, symbol, strategy);
  return new AsyncAction<any, FXOActionType>(async () => {
    const tob: W | null = await API.getDarkPoolTOBSnapshot(
      symbol,
      strategy,
      tenor,
    );
    const w: W | null = await API.getDarkPoolSnapshot(symbol, strategy, tenor);
    if (tob !== null && w !== null) {
      const a1: FXOAction<string> | null = handlers.W<FXOActionType>(tob, true);
      const a2: FXOAction<string> | null = handlers.W<FXOActionType>(w, true);
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

export const getSnapshot = (id: string, symbol: string, strategy: string, tenor: string): AsyncAction<any, FXOActionType> => {
  const rowID: string = $$('__ROW', tenor, symbol, strategy);
  return new AsyncAction<any, FXOActionType>(async () => {
    const tob: W | null = await API.getTOBSnapshot(symbol, strategy, tenor);
    const w: W | null = await API.getSnapshot(symbol, strategy, tenor);
    if (tob !== null) {
      const a1 = handlers.W(tob, false);
      const a2 = w ? handlers.W(w, false) : undefined;
      return [
        ...(a1 ? [a1] : []),
        ...(a2 ? [a2] : []),
        createAction($$(rowID, RowActions.SnapshotReceived), a1),
      ];
    } else {
      return createAction($$(rowID, RowActions.ErrorGettingSnapshot));
    }
  }, createAction($$(rowID, RowActions.GettingSnapshot)));
};

export const subscribeDarkPool = (symbol: string, strategy: string, tenor: string): SignalRAction<SignalRActions> => {
  return new SignalRAction(SignalRActions.SubscribeForDarkPoolPx, [symbol, strategy, tenor]);
};

export const setStrategy = (workspaceID: string, windowID: string, strategy: string) => {
  return new AsyncAction<any, FXOActionType>(async () => {
    FXOptionsDB.setWindowStrategy(windowID, strategy);
    return createWindowAction(workspaceID, windowID, PodTileActions.SetStrategy, strategy);
  }, DummyAction);
};

export const setSymbol = (workspaceID: string, windowID: string, symbol: Currency | undefined) => {
  if (symbol === undefined)
    return DummyAction;
  return new AsyncAction<any, FXOActionType>(async () => {
    FXOptionsDB.setWindowSymbol(windowID, symbol);
    return createWindowAction(workspaceID, windowID, PodTileActions.SetSymbol, symbol);
  }, DummyAction);
};
