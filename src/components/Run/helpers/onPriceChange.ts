import { OrderTypes } from 'interfaces/mdEntry';
import { Dispatch } from 'react';
import { createAction } from 'redux/actionCreator';
import { RunActions } from 'components/Run/reducer';
import { PodTable } from 'interfaces/podTable';
import { PodRow, PodRowStatus } from 'interfaces/podRow';
import { Order } from 'interfaces/order';

export const onPriceChange =
  (dispatch: Dispatch<RunActions>) =>
    (orders: PodTable, type: OrderTypes) =>
      (rowID: string, value: number | null): boolean => {
        const row: PodRow | undefined = orders[rowID];
        if (row === undefined)
          throw new Error('a price change event just occurred for an invalid row');
        if (type !== OrderTypes.Bid && type !== OrderTypes.Ofr)
          throw new Error('this only makes sense for real orders');
        const opposingOrder: Order = type === OrderTypes.Bid ? row.ofr : row.bid;
        switch (type) {
          case OrderTypes.Ofr:
            if (opposingOrder.price !== null && value !== null && opposingOrder.price > value) {
              dispatch(createAction<RunActions>(RunActions.SetRowStatus, {
                id: rowID,
                status: PodRowStatus.InvertedMarketsError,
              }));
              return false;
            } else {
              dispatch(createAction<RunActions>(RunActions.Ofr, { id: rowID, value }));
              return true;
            }
          case OrderTypes.Bid:
            if (opposingOrder.price !== null && value !== null && opposingOrder.price < value) {
              dispatch(createAction<RunActions>(RunActions.SetRowStatus, {
                id: rowID,
                status: PodRowStatus.InvertedMarketsError,
              }));
              return false;
            } else {
              dispatch(createAction<RunActions>(RunActions.Bid, { id: rowID, value }));
              return true;
            }
        }
        return false;
      };

