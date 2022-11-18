import { RunActions } from 'components/Run/reducer';
import { RunEntry } from 'components/Run/runEntry';
import { RunState } from 'stateDefs/runState';
import { OrderTypes } from 'types/mdEntry';
import { Order, OrderStatus } from 'types/order';
import { PodRowStatus } from 'types/podRow';
import { coalesce } from 'utils/commonUtils';
import { priceFormatter } from 'utils/priceFormatter';

export const getOrderStatus = (
  status: OrderStatus,
  oldValue: number | null,
  newValue: number | null
): OrderStatus => {
  if (
    priceFormatter(newValue) === priceFormatter(oldValue) &&
    (status & OrderStatus.Cancelled) === 0
  )
    return status;
  return (
    (status | OrderStatus.PriceEdited) &
    ~OrderStatus.Owned &
    ~OrderStatus.SameBank &
    ~OrderStatus.Cancelled
  );
};

const isActive = (order: Order, newPrice: number | null): boolean => {
  if (newPrice !== null) return true;
  return (order.status & OrderStatus.Cancelled) !== 0;
};

export const getRowStatus = (bid: Order, ofr: Order, computed: RunEntry): PodRowStatus => {
  if ((bid.status & OrderStatus.Cancelled) !== 0 || (ofr.status & OrderStatus.Cancelled) !== 0)
    return PodRowStatus.Normal;
  if (
    !isActive(bid, computed.bid) ||
    !isActive(ofr, computed.ofr) ||
    computed.mid === null ||
    computed.spread === null
  )
    return PodRowStatus.Normal;
  if (computed.bid === null || computed.ofr === null) return PodRowStatus.Normal;
  return computed.bid > computed.ofr ? PodRowStatus.InvertedMarketsError : PodRowStatus.Normal;
};

export const computeRow = (type: string, initial: RunEntry, v1: number): RunEntry => {
  switch (type) {
    case RunActions.Mid:
      if (initial.spread === null) return initial;
      return {
        spread: initial.spread,
        mid: v1,
        bid: (2 * v1 - initial.spread) / 2,
        ofr: (2 * v1 + initial.spread) / 2,
      };
    case RunActions.Spread:
      if (initial.mid === null) return initial;
      return {
        spread: v1,
        mid: initial.mid,
        bid: (2 * initial.mid - v1) / 2,
        ofr: (2 * initial.mid + v1) / 2,
      };
    case RunActions.Ofr:
      if (initial.bid === null) return initial;
      return {
        spread: v1 - initial.bid,
        mid: (v1 + initial.bid) / 2,
        bid: initial.bid,
        ofr: v1,
      };
    case RunActions.Bid:
      if (initial.ofr === null) return initial;
      return {
        spread: initial.ofr - v1,
        mid: (v1 + initial.ofr) / 2,
        bid: v1,
        ofr: initial.ofr,
      };
    default:
      return initial;
  }
};

export const buildNewOrder = (
  state: RunState,
  original: Order,
  computed: number | null,
  starting: number | null
): Order => {
  if (computed === null) return original;
  const defaultSize: number =
    original.type === OrderTypes.Bid ? state.defaultBidSize : state.defaultOfrSize;
  const price = coalesce(computed, starting);
  const status = getOrderStatus(original.status, original.price, price);
  const size = (original.status & OrderStatus.Cancelled) !== 0 ? defaultSize : original.size;
  return {
    ...original,
    // Update the price
    price: price,
    size: !size ? defaultSize : size,
    // Update the status and set it as edited/modified
    status: status,
  };
};
