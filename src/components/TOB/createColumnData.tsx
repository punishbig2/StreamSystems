import {PriceErrors} from 'components/Table/CellRenderers/Price';
import {State} from 'components/TOB/reducer';
import {OrderTypes} from 'interfaces/mdEntry';
import {Order, OrderStatus, Sides} from 'interfaces/order';
import {InvalidPrice, TOBRow, TOBRowStatus} from 'interfaces/tobRow';
import {TenorType} from 'interfaces/w';
import {Settings} from 'settings';
import {skipTabIndex} from 'utils/skipTab';

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
) => {
  // Dispatch properties
  return {
    onTabbedOut: (input: HTMLInputElement, type: OrderTypes) => {
      console.log(input, type);
      switch (type) {
        case OrderTypes.Bid:
          skipTabIndex(input, 2, 1);
          break;
        case OrderTypes.Ofr:
          skipTabIndex(input, 3, 1);
          break;
        case OrderTypes.DarkPool:
          skipTabIndex(input, 1, 1);
          break;
      }
    },
    onTenorSelected: (tenor: string) => {
      if (state.tenor === null) {
        setCurrentTenor(tenor);
      } else {
        setCurrentTenor(null);
      }
    },
    onDoubleClick: (type: OrderTypes, entry: Order) => {
      setOrderTicket({...entry, type});
    },
    onRefBidsButtonClicked: () => {
      fns.cancelAll(symbol, strategy, Sides.Buy);
    },
    onRefOfrsButtonClicked: () => {
      fns.cancelAll(symbol, strategy, Sides.Sell);
    },
    onOrderError: (order: Order, error: PriceErrors, input: HTMLInputElement) => {
      if (error === PriceErrors.GreaterThanMax || error === PriceErrors.LessThanMin) {
        fns.setRowStatus(order, TOBRowStatus.InvertedMarketsError);
        input.focus();
      }
    },
    onOrderModified: (order: Order) => {
      if (order.price === InvalidPrice) {
        // This is empty for now
      } else if (order.price !== null) {
        if ((order.status & OrderStatus.Owned) !== 0)
          fns.cancelOrder(order);
        if (order.quantity === null) {
          fns.createOrder({...order, quantity: settings.defaultSize}, settings.minSize);
        } else {
          fns.createOrder(order, settings.minSize);
        }
        fns.setRowStatus(order, TOBRowStatus.Normal);
      } else {
        console.log('ignore this action');
      }
    },
    onCancelOrder: (order: Order, cancelRelated: boolean = true) => {
      if (cancelRelated) {
        const rows: TOBRow[] = Object.values(state.depths[order.tenor]);
        rows.forEach((row: TOBRow) => {
          const targetEntry: Order = order.type === OrderTypes.Bid ? row.bid : row.ofr;
          if ((targetEntry.status & OrderStatus.Owned) !== 0) {
            fns.cancelOrder(targetEntry);
          }
        });
      } else {
        fns.cancelOrder(order);
      }
    },
    onQuantityChange: (order: Order, newQuantity: number | null, input: HTMLInputElement) => {
      if ((order.status & OrderStatus.PreFilled) === 0) {
        fns.updateOrderQuantity({...order, quantity: newQuantity});
      } else if ((order.status & OrderStatus.Owned) !== 0 && newQuantity !== null) {
        if (order.quantity === null) {
          // FIXME: perhaps let the user know?
          throw new Error('this is impossible, or a backend error');
        } else if (order.quantity > newQuantity) {
          fns.updateOrder({...order, quantity: newQuantity});
        } else if (order.quantity < newQuantity) {
          fns.cancelOrder(order);
          fns.createOrder({...order, quantity: newQuantity}, settings.minSize);
        }
      } else {
        const {quantity} = order;
        // FIXME: we must reset the order quantity but this seems unsafe
        //        because it's happening outside of react
        input.value = quantity ? quantity.toFixed(0) : '';
        // Artificially emit the change event
        const event = document.createEvent('HTMLEvents');
        event.initEvent('change', false, true);
        // Attempt to pretend we can emit the onChange
        input.dispatchEvent(event);
      }
      skipTabIndex(input, 1, 0);
    },
    onDarkPoolDoubleClicked: () => {
      console.log('dark pool double clicked');
    },
    onDarkPoolPriceChanged: (tenor: string, price: number) => {
      fns.publishDarkPoolPrice(symbol, strategy, tenor, price);
    },
    aggregatedSz: state.aggregatedSz,
    buttonsEnabled: symbol !== '' && strategy !== '',
    isBroker: user.isbroker,
  };
};
