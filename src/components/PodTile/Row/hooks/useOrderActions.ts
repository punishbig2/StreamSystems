/*import { useEffect } from 'react';
import { Order, OrderStatus } from 'interfaces/order';
import { Sides } from 'interfaces/sides';
import { User } from 'interfaces/user';
import { PodRowStore } from 'mobx/stores/podRowStore';

type RowType = { [key: string]: any };
export const useOrderActions = (symbol: string, strategy: string, tenor: string, user: User, connected: boolean, row: RowType, store: PodRowStore) => {
  useEffect(() => {
    if (connected) {
      const onNewOrder = (order: Order) => {
        store.replaceOrder(order);
      };
      const onStatusChange = (status: OrderStatus) =>
        (order: Order) => {
          store.replaceOrder({
            ...order,
            status: order.status | status,
          });
        };
      const setCancelStatus = (order: Order) => {
        if (order.price === null || order.isCancelled() || !order.isOwnedByCurrentUser(user))
          return;
        store.replaceOrder({
          ...order,
          status: order.status | OrderStatus.BeingCancelled,
        });
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
  }, [symbol, strategy, tenor, connected, row, user, store]);
};*/
export const dumb = 0;
