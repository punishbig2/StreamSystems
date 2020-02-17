import {RunActions} from 'redux/reducers/runReducer';
import {createAction} from 'redux/actionCreator';
import {PodTable} from 'interfaces/podTable';
import {$$} from 'utils/stringPaster';
import {OrderTypes} from 'interfaces/mdEntry';

export const deactivateAllOrders = (runID: string) => () =>
  createAction($$(runID, RunActions.DeactivateAllOrders));

export const updateOfr = (runID: string) => (ofr: any) =>
  createAction($$(runID, RunActions.UpdateOfr), ofr);

export const updateBid = (runID: string) => (ofr: any) =>
  createAction($$(runID, RunActions.UpdateBid), ofr);

export const removeOrder = (runID: string) => (id: string) =>
  createAction($$(runID, RunActions.RemoveOrder), id);

export const setTable = (runID: string) => (orders: PodTable) =>
  createAction($$(runID, RunActions.SetTable), orders);

export const setBidPrice = (runID: string) => (id: string, value: number | null) =>
  createAction($$(runID, RunActions.Bid), {id, value});

export const setOfrPrice = (runID: string) => (id: string, value: number | null) =>
  createAction($$(runID, RunActions.Ofr), {id, value});

export const setMid = (runID: string) => (id: string, value: number | null) =>
  createAction($$(runID, RunActions.Mid), {id, value});

export const setSpread = (runID: string) => (id: string, value: number | null) =>
  createAction($$(runID, RunActions.Spread), {id, value});

export const setOfrQty = (runID: string) => (id: string, value: number | null) =>
  createAction($$(runID, RunActions.OfrQtyChanged), {id, value});

export const setBidQty = (runID: string) => (id: string, value: number | null) =>
  createAction($$(runID, RunActions.BidQtyChanged), {id, value});

export const setBidDefaultQty = (runID: string) => (value: number) =>
  createAction($$(runID, RunActions.UpdateDefaultBidQty), value);

export const setOfrDefaultQty = (runID: string) => (value: number) =>
  createAction($$(runID, RunActions.UpdateDefaultOfrQty), value);

export const setDefaultSize = (runID: string) => (value: number) =>
  createAction($$(runID, RunActions.SetDefaultSize), value);

export const activateRow = (runID: string) => (rowID: string) =>
  createAction($$(runID, RunActions.ActivateRow), rowID);

export const onActivateOrder = (runID: string) => (rowID: string, type: OrderTypes) =>
  createAction($$(runID, RunActions.ActivateOrder), {rowID, type});

export const resetOrder = (runID: string) => (rowID: string, type: OrderTypes) =>
  createAction($$(runID, RunActions.ResetOrder), {rowID, type});
