import {PriceErrors} from 'components/Table/CellRenderers/Price';
import {State} from 'components/PodTile/reducer';
import {Order} from 'interfaces/order';
import {TOBRowStatus} from 'interfaces/podRow';
import {TenorType} from 'interfaces/w';
import {Settings} from 'settings';
import {TOBColumnData} from 'components/PodTile/data';

type Fn1 = (tenor: TenorType | null) => void;
type Fn2 = (order: Order) => void;

export const createColumnData = (
  fns: any,
  state: State,
  symbol: string,
  strategy: string,
  user: any,
  setCurrentTenor: Fn1,
  setOrderTicket: Fn2,
  settings: Settings,
  personality: string,
  defaultSize: number,
  minimumSize: number,
): TOBColumnData => {
  // Dispatch properties
  return {
    /*onTabbedOut: (input: HTMLInputElement, type: OrderTypes) => {
      console.log('onTabbedOut');
      switch (type) {
        case OrderTypes.Bid:
          skipTabIndex(input, 1, 1);
          break;
        case OrderTypes.Ofr:
          skipTabIndex(input, 1, 1);
          break;
        case OrderTypes.DarkPool:
          skipTabIndex(input, 1, 1);
          break;
      }
    },*/
    onTenorSelected: (tenor: string) => {
      if (state.tenor === null) {
        setCurrentTenor(tenor);
      } else {
        setCurrentTenor(null);
      }
    },
    onOrderError: (order: Order, error: PriceErrors, input: HTMLInputElement) => {
      if (error === PriceErrors.GreaterThanMax || error === PriceErrors.LessThanMin) {
        fns.setRowStatus(order, TOBRowStatus.InvertedMarketsError);
        input.focus();
      }
    },
    /*onCancelOrder: (order: Order, cancelRelated: boolean = true) => {
      if (cancelRelated) {
        const rows: PodRow[] = Object.values(state.depths[order.tenor]);
        rows.forEach((row: PodRow) => {
          const targetEntry: Order =
            order.type === OrderTypes.Bid ? row.bid : row.ofr;
          if ((targetEntry.status & OrderStatus.Owned) !== 0) {
            fns.cancelOrder(targetEntry);
          }
        });
      } else {
        fns.cancelOrder(order);
      }
    },
    onQuantityChange: async (order: Order, newQuantity: number | null, personality: string, minimumSize: number, input: HTMLInputElement) => {
      const shouldCancelReplace: boolean = order.price !== null
        && (
          ((order.status & OrderStatus.Cancelled) === 0 && (order.status & OrderStatus.Owned) !== 0)
          || (order.status & OrderStatus.PriceEdited) !== 0
        )
      ;
      if (shouldCancelReplace) {
        const newOrder: Order = {...order, size: newQuantity, status: order.status | OrderStatus.QuantityEdited};
        fns.cancelOrder(order);
        await API.createOrder(newOrder, personality, minimumSize);
        skipTabIndex(input, 1, 0);
      } else {
        const type: string = $$(order.symbol, order.strategy, order.tenor, 'UPDATE_SIZE');
        const detail: Order = {...order, size: newQuantity};
        const event: CustomEvent<Order> = new CustomEvent<Order>(type, {detail});
        // Dispatch the event now
        document.dispatchEvent(event);
        // fns.updateOrder({...order, size: newQuantity, status: order.status | OrderStatus.QuantityEdited});
        skipTabIndex(input, 1, 0);
      }
    },*/
    /*onNavigate: (target: HTMLInputElement, direction: NavigateDirection) => {
      switch (direction) {
        case NavigateDirection.Up:
          skipTabIndexAll(target, -5, 'last-row');
          break;
        case NavigateDirection.Left:
          skipTabIndexAll(target, -1);
          break;
        case NavigateDirection.Down:
          skipTabIndexAll(target, 5, 'first-row');
          break;
        case NavigateDirection.Right:
          skipTabIndexAll(target, 1);
          break;
      }
    },*/
    aggregatedSize: state.aggregatedSize,
    buttonsEnabled: symbol !== '' && strategy !== '',
    isBroker: user.isbroker,
    strategy: strategy,
    symbol: symbol,
    personality: personality,
    defaultSize: defaultSize,
    minimumSize: minimumSize,
    depths: state.depths,
  };
};
