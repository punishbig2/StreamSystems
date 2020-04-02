import { Order } from 'interfaces/order';
import { $$ } from 'utils/stringPaster';
import { PodTileActions } from 'redux/reducers/podTileReducer';
import { Sides } from 'interfaces/sides';

export type OrderAction =
  'UPDATE_SIZE'
  | 'CREATE'
  | 'CANCEL'
  | 'CANCEL_ERROR'
  | PodTileActions.UpdateOrder
  | 'CREATED'
  | '';
export const createSymbolStrategyTenorListener =
  (symbol: string, strategy: string, tenor: string, name: OrderAction, fn: (order: Order) => void) => {
    const type: string = $$(symbol, strategy, tenor, name);
    const listener = (event: CustomEvent<Order>) => fn(event.detail);
    document.addEventListener(type, listener as EventListener, true);
    return () => {
      document.removeEventListener(type, listener as EventListener, true);
    };
  };

export const createSymbolStrategySideListener =
  (symbol: string, strategy: string, side: Sides, name: OrderAction, fn: (order: Order) => void) => {
    const type: string = $$(symbol, strategy, side, name);
    const listener = (event: CustomEvent<Order>) => fn(event.detail);
    document.addEventListener(type, listener as EventListener, true);
    return () => {
      document.removeEventListener(type, listener as EventListener, true);
    };
  };

