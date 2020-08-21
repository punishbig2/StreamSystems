import { FXOAction } from "actionCreator";
import { RunActions } from "components/Run/reducer";
import {
  buildNewOrder,
  computeRow,
  getRowStatus,
} from "components/Run/reducers/computeRow";
import { RunEntry } from "components/Run/runEntry";
import equal from "deep-equal";
import { RunState } from "stateDefs/runState";
import { Order, OrderStatus } from "types/order";
import { PodRow } from "types/podRow";

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

  const coalesce = (v1: number | null, v2: number | null) =>
    v1 === null ? v2 : v1;

  const newOfr: Order = buildNewOrder(
    state,
    ofr,
    computedEntry.ofr,
    startingEntry.ofr
  );
  const newBid: Order = buildNewOrder(
    state,
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
            status: getRowStatus(bid, ofr, computedEntry),
          },
        },
      };
    default:
      return state;
  }
};
