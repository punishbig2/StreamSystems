import { RunEntry } from "components/Run/runEntry";
import { RunActions } from "components/Run/reducer";

export const computeRow = (
  type: string,
  initial: RunEntry,
  v1: number
): RunEntry => {
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
