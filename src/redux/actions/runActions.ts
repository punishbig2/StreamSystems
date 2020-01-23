import { RunActions } from "redux/reducers/runReducer";
import { createAction } from "redux/actionCreator";
import { TOBTable } from "interfaces/tobTable";
import { $$ } from "utils/stringPaster";

export const updateOfr = (runID: string) => (ofr: any) =>
  createAction($$(runID, RunActions.UpdateOfr), ofr);
export const updateBid = (runID: string) => (ofr: any) =>
  createAction($$(runID, RunActions.UpdateBid), ofr);
export const removeOrder = (runID: string) => (id: string) =>
  createAction($$(runID, RunActions.RemoveOrder), id);
export const setTable = (runID: string) => (orders: TOBTable) =>
  createAction($$(runID, RunActions.SetTable), orders);

export const setBidPrice = (runID: string) => (
  id: string,
  value: number | null
) => createAction($$(runID, RunActions.Bid), { id, value });
export const setOfrPrice = (runID: string) => (
  id: string,
  value: number | null
) => createAction($$(runID, RunActions.Ofr), { id, value });
export const setMid = (runID: string) => (id: string, value: number | null) =>
  createAction($$(runID, RunActions.Mid), { id, value });
export const setSpread = (runID: string) => (
  id: string,
  value: number | null
) => createAction($$(runID, RunActions.Spread), { id, value });
export const setOfrQty = (runID: string) => (
  id: string,
  value: number | null
) => createAction($$(runID, RunActions.OfrQtyChanged), { id, value });
export const setBidQty = (runID: string) => (
  id: string,
  value: number | null
) => createAction($$(runID, RunActions.BidQtyChanged), { id, value });
export const setBidDefaultQty = (runID: string) => (value: number) =>
  createAction($$(runID, RunActions.UpdateDefaultBidQty), value);
export const setOfrDefaultQty = (runID: string) => (value: number) =>
  createAction($$(runID, RunActions.UpdateDefaultOfrQty), value);

export const setDefaultSize = (runID: string) => (value: number) =>
  createAction($$(runID, RunActions.SetDefaultSize), value);
