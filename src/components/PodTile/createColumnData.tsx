import {PriceErrors} from 'components/Table/CellRenderers/Price';
import {State} from 'components/PodTile/reducer';
import {OrderTypes} from 'interfaces/mdEntry';
import {Order, OrderStatus, Sides} from 'interfaces/order';
import {InvalidPrice, TOBRow, TOBRowStatus} from 'interfaces/tobRow';
import {TenorType} from 'interfaces/w';
import {Settings} from 'settings';
import {skipTabIndex, skipTabIndexAll} from 'utils/skipTab';
import {NavigateDirection} from 'components/NumericInput/navigateDirection';
import {API} from 'API';

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
  minSize: number,
) => {
  // Dispatch properties
  return {
    onTabbedOut: (input: HTMLInputElement, type: OrderTypes) => {
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
    onResetOrderQuantity: (order: Order) => {
      fns.resetOrderQuantity(order);
    },
    onOrderModified: (order: Order) => {
      setTimeout(() => {
        if (order.price === InvalidPrice) {
          // This is empty for now
        } else if (order.price !== null) {
          if ((order.status & OrderStatus.Owned) !== 0) {
            fns.cancelOrder(order);
          } else if ((order.status & OrderStatus.HaveOrders) !== 0) {
            const {depths} = state;
            // Find my own order and cancel it
            const mine: Order | undefined = Object.values(depths[order.tenor])
              .map((row: TOBRow) =>
                order.type === OrderTypes.Bid ? row.bid : row.ofr,
              )
              .find((item: Order) => item.user === user.email);
            if (mine) {
              fns.cancelOrder(mine);
            }
          }
          fns.createOrder(
            {...order, quantity: defaultSize},
            personality,
            minSize,
          );
          // fns.setRowStatus(order, TOBRowStatus.Normal);
        } else {
          console.log('ignore this action');
        }
      }, 0);
    },
    onCancelOrder: (order: Order, cancelRelated: boolean = true) => {
      if (cancelRelated) {
        const rows: TOBRow[] = Object.values(state.depths[order.tenor]);
        rows.forEach((row: TOBRow) => {
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
    onQuantityChange: async (order: Order, newQuantity: number | null, personality: string, minSize: number, input: HTMLInputElement) => {
      const shouldCancelReplace: boolean = order.price !== null
        && (
          ((order.status & OrderStatus.Cancelled) === 0 && (order.status & OrderStatus.Owned) !== 0)
          || (order.status & OrderStatus.PriceEdited) !== 0
        )
      ;
      if (shouldCancelReplace) {
        const newOrder: Order = {...order, quantity: newQuantity, status: order.status | OrderStatus.QuantityEdited};
        fns.cancelOrder(order);
        await API.createOrder(newOrder, personality, minSize);
        skipTabIndex(input, 1, 0);
      } else {
        fns.updateOrder({...order, quantity: newQuantity, status: order.status | OrderStatus.QuantityEdited});
        skipTabIndex(input, 1, 0);
      }
    },
    onCancelDarkPoolOrder: (order: Order) => {
      fns.cancelDarkPoolOrder(order);
    },
    onDarkPoolDoubleClicked: (
      tenor: string,
      price: number | null,
      currentOrder: Order | null,
    ) => {
      if (price !== null) {
        fns.onDarkPoolDoubleClicked(tenor, price, currentOrder);
      }
    },
    onDarkPoolPriceChanged: (tenor: string, price: number) => {
      fns.publishDarkPoolPrice(symbol, strategy, tenor, price);
    },
    onNavigate: (target: HTMLInputElement, direction: NavigateDirection) => {
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
    },
    aggregatedSz: state.aggregatedSz,
    buttonsEnabled: symbol !== '' && strategy !== '',
    isBroker: user.isbroker,
    strategy: strategy,
    symbol: symbol,
    personality: personality,
    defaultSize: defaultSize,
    minSize: minSize,
  };
};
