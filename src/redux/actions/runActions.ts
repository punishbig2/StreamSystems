import {RunActions} from 'redux/reducers/runReducer';
import {createAction} from 'redux/actionCreator';
import {TOBTable} from 'interfaces/tobTable';

export const updateOfr = (ofr: any) => createAction(RunActions.UpdateOfr, ofr);
export const updateBid = (ofr: any) => createAction(RunActions.UpdateBid, ofr);
export const removeAllOfrs = () => createAction(RunActions.RemoveAllOfrs);
export const removeAllBids = () => createAction(RunActions.RemoveAllBids);
export const removeOrder = (id: string) => createAction(RunActions.RemoveOrder, id);
export const setTable = (orders: TOBTable) => createAction(RunActions.SetTable, orders);

export const setBidPrice = (id: string, value: number | null) => createAction(RunActions.Bid, {id, value});
export const setOfrPrice = (id: string, value: number | null) => createAction(RunActions.Ofr, {id, value});
export const setMid = (id: string, value: number | null) => createAction(RunActions.Mid, {id, value});
export const setSpread = (id: string, value: number | null) => createAction(RunActions.Spread, {id, value});
export const setOfrQty = (id: string, value: number | null) => createAction(RunActions.OfrQtyChanged, {id, value});
export const setBidQty = (id: string, value: number | null) => createAction(RunActions.BidQtyChanged, {id, value});
export const setBidDefaultQty = (value: number) => createAction(RunActions.UpdateDefaultBidQty, value);
export const setOfrDefaultQty = (value: number) => createAction(RunActions.UpdateDefaultBidQty, value);
