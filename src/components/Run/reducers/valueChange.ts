import { RunState } from "stateDefs/runState";
import { PodRow, PodRowStatus } from "interfaces/podRow";
import { RunEntry } from "components/Run/runEntry";
import { computeRow } from "components/Run/reducers/computeRow";
import { OrderStatus, Order } from "interfaces/order";
import { priceFormatter } from "utils/priceFormatter";
import equal from "deep-equal";
import { RunActions } from "components/Run/reducer";
import { FXOAction } from "actionCreator";
import { OrderTypes } from "interfaces/mdEntry";

export const valueChange = (
  state: RunState,
  { type, data }: FXOAction<RunActions>
): RunState => {
  const { orders } = state;
  // const finder = rowFinder(orders);
  const row: PodRow = orders[data.id];
  // Extract the two sides
  const { bid, ofr } = row;
  // Original values
  const startingEntry: RunEntry = {
    spread: row.spread,
    mid: row.mid,
    ofr: (ofr.status & OrderStatus.Cancelled) === 0 ? ofr.price : null,
    bid: (bid.status & OrderStatus.Cancelled) === 0 ? bid.price : null,
    // Overwrite the one that will be replaced
    [type]: data.value,
  };
  const computedEntry: RunEntry = computeRow(type, startingEntry, data.value);
  if (computedEntry.ofr === null) computedEntry.ofr = startingEntry.ofr;
  if (computedEntry.bid === null) computedEntry.bid = startingEntry.bid;
  const isActive = (order: Order, newPrice: number | null): boolean => {
    if (newPrice !== null) return true;
    return (order.status & OrderStatus.Cancelled) !== 0;
  };
  const getRowStatus = (computed: RunEntry): PodRowStatus => {
    if (
      (bid.status & OrderStatus.Cancelled) !== 0 ||
      (ofr.status & OrderStatus.Cancelled) !== 0
    )
      return PodRowStatus.Normal;
    if (
      !isActive(bid, computed.bid) ||
      !isActive(ofr, computed.ofr) ||
      computed.mid === null ||
      computed.spread === null
    )
      return PodRowStatus.Normal;
    if (computed.bid === null || computed.ofr === null)
      return PodRowStatus.Normal;
    return computed.bid > computed.ofr
      ? PodRowStatus.InvertedMarketsError
      : PodRowStatus.Normal;
  };
  const getOrderStatus = (
    status: OrderStatus,
    oldValue: number | null,
    newValue: number | null
  ) => {
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
  const coalesce = (v1: number | null, v2: number | null) =>
    v1 === null ? v2 : v1;
  const buildNewOrder = (
    original: Order,
    computed: number | null,
    starting: number | null
  ): Order => {
    if (computed === null) return original;
    const defaultSize: number =
      original.type === OrderTypes.Bid
        ? state.defaultBidSize
        : state.defaultOfrSize;
    const price = coalesce(computed, starting);
    const status = getOrderStatus(original.status, original.price, price);
    const size = ((original.status & OrderStatus.Cancelled) !== 0) ? defaultSize : original.size;
    return {
      ...original,
      // Update the price
      price: price,
      size: !size ? defaultSize : size,
      // Update the status and set it as edited/modified
      status: status,
    };
  };
  const newOfr: Order = buildNewOrder(
    ofr,
    computedEntry.ofr,
    startingEntry.ofr
  );
  const newBid: Order = buildNewOrder(
    bid,
    computedEntry.bid,
    startingEntry.bid
  );
  const isQuantityEdited = (order: Order) =>
    (order.status & OrderStatus.SizeEdited) !== 0;
  const quantitiesChanged: boolean =
    isQuantityEdited(bid) || isQuantityEdited(ofr);
  const inactive = (() => {
    if (type === RunActions.Mid && startingEntry.spread !== null) return false;
    if (type === RunActions.Spread && startingEntry.mid !== null) return false;
    if (
      type !== RunActions.Bid &&
      (bid.status & OrderStatus.Cancelled) !== 0 &&
      (bid.status & OrderStatus.PriceEdited) === 0 &&
      (bid.status & OrderStatus.SizeEdited) === 0
    ) {
      return true;
    }
    return !!(
      type !== RunActions.Ofr &&
      (ofr.status & OrderStatus.Cancelled) !== 0 &&
      (ofr.status & OrderStatus.PriceEdited) === 0 &&
      (ofr.status & OrderStatus.SizeEdited) === 0
    );
  })();
  const ordersChanged: boolean = !equal(newOfr, ofr) || !equal(newBid, bid);
  switch (type) {
    case RunActions.Ofr:
    case RunActions.Bid:
      if (!ordersChanged && !quantitiesChanged) return state;
    // eslint-disable-next-line no-fallthrough
    case RunActions.Mid:
    case RunActions.Spread:
      return {
        ...state,
        orders: {
          ...orders,
          [row.id]: {
            ...row,
            spread:
              inactive && type !== RunActions.Spread
                ? null
                : coalesce(computedEntry.spread, startingEntry.spread),
            mid:
              inactive && type !== RunActions.Mid
                ? null
                : coalesce(computedEntry.mid, startingEntry.mid),
            ofr:
              inactive &&
              (ofr.status & OrderStatus.Cancelled) === 0 &&
              type !== RunActions.Ofr
                ? ofr
                : newOfr,
            bid:
              inactive &&
              (bid.status & OrderStatus.Cancelled) === 0 &&
              type !== RunActions.Bid
                ? bid
                : newBid,
            status: getRowStatus(computedEntry),
          },
        },
      };
    default:
      return state;
  }
};
