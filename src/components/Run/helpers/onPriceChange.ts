import { OrderTypes } from "types/mdEntry";
import { Dispatch } from "react";
import { createAction } from "actionCreator";
import { RunActions } from "components/Run/reducer";
import { PodTable } from "types/podTable";
import { PodRow, PodRowStatus } from "types/podRow";
import { Order, OrderStatus } from "types/order";

const isInvertedMarket = (
  smaller: number | null,
  value: number | null,
  status: OrderStatus
): boolean => {
  if ((status & OrderStatus.Cancelled) !== 0) return false;
  return smaller !== null && value !== null && smaller < value;
};

export const onPriceChange = (dispatch: Dispatch<RunActions>) => (
  orders: PodTable,
  type: OrderTypes
) => (rowID: string, value: number | null): boolean => {
  const row: PodRow | undefined = orders[rowID];
  if (row === undefined)
    throw new Error("a price change event just occurred for an invalid row");
  if (type !== OrderTypes.Bid && type !== OrderTypes.Ofr)
    throw new Error("this only makes sense for real orders");
  const opposingOrder: Order = type === OrderTypes.Bid ? row.ofr : row.bid;
  switch (type) {
    case OrderTypes.Ofr:
      if (isInvertedMarket(value, opposingOrder.price, opposingOrder.status)) {
        dispatch(
          createAction<RunActions>(RunActions.SetRowStatus, {
            id: rowID,
            status: PodRowStatus.InvertedMarketsError,
          })
        );
        return false;
      } else {
        dispatch(
          createAction<RunActions>(RunActions.Ofr, { id: rowID, value })
        );
        return true;
      }
    case OrderTypes.Bid:
      if (isInvertedMarket(opposingOrder.price, value, opposingOrder.status)) {
        dispatch(
          createAction<RunActions>(RunActions.SetRowStatus, {
            id: rowID,
            status: PodRowStatus.InvertedMarketsError,
          })
        );
        return false;
      } else {
        dispatch(
          createAction<RunActions>(RunActions.Bid, { id: rowID, value })
        );
        return true;
      }
  }
  return false;
};
