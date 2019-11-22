import {Order} from 'interfaces/order';
import {useEffect} from 'react';
import {TOBActions} from 'redux/constants/tobConstants';
import {$$} from 'utils/stringPaster';

export const useOrderListener = (tenors: string[], symbol: string, strategy: string, update: (entry: Order) => void) => {
  useEffect(() => {
    const listener = (event: Event) => {
      const customEvent: CustomEvent<Order> = event as CustomEvent<Order>;
      update(customEvent.detail);
    };
    const cleaners: (() => void)[] = tenors.map((tenor) => {
      const name: string = $$(tenor, symbol, strategy, TOBActions.UpdateOrders);
      document.addEventListener(name, listener);
      return () => {
        document.removeEventListener(name, listener);
      };
    });
    return () => cleaners.forEach((fn) => fn());
  }, [tenors, symbol, strategy, update]);
};
