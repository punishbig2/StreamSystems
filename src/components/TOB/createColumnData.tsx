import {PriceErrors} from 'components/Table/CellRenderers/Price';
import {Props} from 'components/TOB/props';
import {State} from 'components/TOB/reducer';
import {OrderTypes} from 'interfaces/mdEntry';
import {Order, OrderStatus, Sides} from 'interfaces/order';
import {InvalidPrice, TOBRow, TOBRowStatus} from 'interfaces/tobRow';
import {TenorType} from 'interfaces/w';
import {Settings} from 'settings';
import {skipTabIndex} from 'utils/skipTab';

type Fn1 = (tenor: TenorType | null) => void;
type Fn2 = (order: Order) => void;

export const createColumnData = (state: State, props: Props, setCurrentTenor: Fn1, setOrderTicket: Fn2, settings: Settings) => {
  const {symbol, strategy, user} = props;
  // Dispatch properties
  const {cancelAll, cancelOrder, setRowStatus, createOrder, updateOrder, updateOrderQuantity} = props;
  return {
    onTabbedOut: (input: HTMLInputElement, type: OrderTypes) => {
      switch (type) {
        case OrderTypes.Bid:
          skipTabIndex(input, 1, 1);
          break;
        case OrderTypes.Ofr:
          skipTabIndex(input, 3, 1);
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
      cancelAll(symbol, strategy, Sides.Buy);
    },
    onRefOfrsButtonClicked: () => {
      cancelAll(symbol, strategy, Sides.Sell);
    },
    onOrderError: (order: Order, error: PriceErrors, input: HTMLInputElement) => {
      if (error === PriceErrors.GreaterThanMax || error === PriceErrors.LessThanMin) {
        setRowStatus(order, TOBRowStatus.InvertedMarketsError);
        input.focus();
      }
    },
    onOrderModified: (order: Order) => {
      if (order.price === InvalidPrice) {
        // This is empty for now
      } else if (order.price !== null) {
        if ((order.status & OrderStatus.Owned) !== 0)
          cancelOrder(order);
        if (order.quantity === null) {
          createOrder({...order, quantity: settings.defaultSize}, settings.minSize);
        } else {
          createOrder(order, settings.minSize);
        }
        setRowStatus(order, TOBRowStatus.Normal);
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
            cancelOrder(targetEntry);
          }
        });
      } else {
        cancelOrder(order);
      }
    },
    onQuantityChange: (order: Order, newQuantity: number | null, input: HTMLInputElement) => {
      console.trace();
      if ((order.status & OrderStatus.PreFilled) === 0) {
        updateOrderQuantity({...order, quantity: newQuantity});
      } else if ((order.status & OrderStatus.Owned) !== 0 && newQuantity !== null) {
        if (order.quantity === null) {
          // FIXME: perhaps let the user know?
          throw new Error('this is impossible, or a backend error');
        } else if (order.quantity > newQuantity) {
          updateOrder({...order, quantity: newQuantity});
        } else if (order.quantity < newQuantity) {
          cancelOrder(order);
          createOrder({...order, quantity: newQuantity}, settings.minSize);
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
    onDarkPoolPriceChanged: (price: number) => {
      console.log(`dark pool price set: ${price}`);
    },
    aggregatedSz: state.aggregatedSz,
    buttonsEnabled: symbol !== '' && strategy !== '',
    isBroker: user.isbroker,
  };
};
