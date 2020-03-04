import {useEffect} from 'react';
import {ActionTypes} from 'components/PodTile/Row/reducer';
import {Order, OrderStatus} from 'interfaces/order';
import {createAction} from 'redux/actionCreator';
import {createSymbolStrategySideListener, createSymbolStrategyTenorListener} from 'orderEvents';
import {Sides} from 'interfaces/sides';
import {FXOAction} from 'redux/fxo-action';
import {useAction} from 'hooks/useAction';

type RowType = { [key: string]: any };
export const useOrderActions = (symbol: string, strategy: string, tenor: string, connected: boolean, row: RowType) => {
  const [action, dispatch] = useAction<FXOAction<ActionTypes>>();
  useEffect(() => {
    if (connected) {
      const onNewOrder = (order: Order) => {
        dispatch(createAction<ActionTypes>(ActionTypes.ReplaceOrder, order));
      };
      const onStatusChange = (status: OrderStatus) =>
        (order: Order) => {
          dispatch(createAction<ActionTypes>(ActionTypes.ReplaceOrder, {
            ...order,
            status: order.status | status,
          }));
        };
      const setCancelStatus = (order: Order) => {
        if (order.price === null || order.isCancelled() || !order.isOwnedByCurrentUser())
          return;
        dispatch(createAction<ActionTypes>(ActionTypes.ReplaceOrder, {
          ...order,
          status: order.status | OrderStatus.BeingCancelled,
        }));
      };
      const onSellCancelAll = () => setCancelStatus(row.ofr);
      const onBuyCancelAll = () => setCancelStatus(row.bid);
      const listeners = [
        createSymbolStrategySideListener(symbol, strategy, Sides.Sell, 'CANCEL', onSellCancelAll),
        createSymbolStrategySideListener(symbol, strategy, Sides.Buy, 'CANCEL', onBuyCancelAll),
        createSymbolStrategyTenorListener(symbol, strategy, tenor, 'UPDATE_SIZE', onNewOrder),
        createSymbolStrategyTenorListener(symbol, strategy, tenor, 'CREATE', onStatusChange(OrderStatus.BeingCreated)),
        createSymbolStrategyTenorListener(symbol, strategy, tenor, 'CANCEL', onStatusChange(OrderStatus.BeingCancelled)),
      ];
      // Return a function that executes all the "unsubscribe/remove listener" functions
      return () => {
        listeners.forEach((cleanup: () => void) => cleanup());
      };
    }
  }, [symbol, strategy, tenor, connected, row, dispatch]);
  return action;
};
