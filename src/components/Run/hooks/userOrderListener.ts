import {Order} from 'interfaces/order';
import {useEffect} from 'react';
import {$$} from 'utils/stringPaster';
import {TOBActions} from 'redux/reducers/tobReducer';

export interface Functions {
  onDelete: (id: string) => void;
  onUpdate: (entry: Order) => void;
}

export const useOrderListener = (
  tenors: string[],
  symbol: string,
  strategy: string,
  fns: Functions,
) => {
  useEffect(() => {
    const onUpdate = (event: Event) => {
      const customEvent: CustomEvent<Order> = event as CustomEvent<Order>;
      // Do update the order
      fns.onUpdate(customEvent.detail);
    };
    const onDelete = (event: Event) => {
      const customEvent: CustomEvent<string> = event as CustomEvent<string>;
      // Do delete the order
      fns.onDelete(customEvent.detail);
    };
    const cleaners: (() => void)[] = tenors.map(tenor => {
      const uid: string = $$(tenor, symbol, strategy);
      // Install the event listener
      document.addEventListener($$(uid, TOBActions.UpdateOrder), onUpdate);
      document.addEventListener($$(uid, TOBActions.DeleteOrder), onDelete);
      return () => {
        document.removeEventListener($$(uid, TOBActions.UpdateOrder), onUpdate);
        document.removeEventListener($$(uid, TOBActions.DeleteOrder), onDelete);
      };
    });
    return () => cleaners.forEach(fn => fn());
  }, [tenors, symbol, strategy, fns]);
};
