import { Dispatch, useEffect } from "react";
import { RunActions } from "components/Run/reducer";
import { createAction, FXOAction } from "utils/actionCreator";
import { API } from "API";
import { OrderMessage, Order, OrderStatus } from "types/order";
import { PodRow } from "types/podRow";
import { $$ } from "utils/stringPaster";
import { PodTable } from "types/podTable";
import { OrderTypes } from "types/mdEntry";
import { createEmptyTable } from "components/Run/helpers/createEmptyTable";
import { User } from "types/user";
import workareaStore from "mobx/stores/workareaStore";

export const useRunInitializer = (
  tenors: string[],
  symbol: string,
  strategy: string,
  depth: { [tenor: string]: Order[] },
  visible: boolean,
  dispatch: Dispatch<FXOAction<RunActions>>
) => {
  useEffect(() => {
    if (!visible) return;
    const user: User = workareaStore.user;
    const { email } = user;
    dispatch(createAction<RunActions>(RunActions.SetLoadingStatus, true));
    API.getRunOrders(email, symbol, strategy).then(
      (messages: OrderMessage[]) => {
        const getMid = (row: PodRow): number | null => {
          const { ofr, bid } = row;
          if (
            ofr.price === null ||
            (ofr.status & OrderStatus.Cancelled) !== 0 ||
            bid.price === null ||
            (bid.status & OrderStatus.Cancelled) !== 0
          ) {
            return null;
          }
          return (ofr.price + bid.price) / 2;
        };
        const getSpread = (row: PodRow): number | null => {
          const { ofr, bid } = row;
          if (
            ofr.price === null ||
            (ofr.status & OrderStatus.Cancelled) !== 0 ||
            bid.price === null ||
            (bid.status & OrderStatus.Cancelled) !== 0
          ) {
            return null;
          }
          return ofr.price - bid.price;
        };
        const orderReducer = (
          map: { [id: string]: Order },
          order: Order
        ): { [id: string]: Order } => {
          const key: string = $$(
            order.symbol,
            order.strategy,
            order.tenor,
            order.type
          );
          // Add it to the map
          map[key] = order;
          // Return the updated map
          return map;
        };
        const currOrders: { [id: string]: Order } = Object.values(depth)
          .reduce((flat: Order[], next: Order[]) => [...flat, ...next], [])
          .filter(
            (order: Order) => order.user === user.email && order.size !== null
          )
          .map((order: Order) => ({
            ...order,
            status: order.status | OrderStatus.Active,
          }))
          .reduce(orderReducer, {});
        const prevOrders: { [id: string]: Order } = messages
          .map((message: OrderMessage) =>
            Order.fromOrderMessage(message, email)
          )
          .map((order: Order) => ({
            ...order,
            status:
              (order.status & ~OrderStatus.Active) | OrderStatus.Cancelled,
          }))
          .reduce(orderReducer, {});
        const orders: Order[] = Object.values({ ...prevOrders, ...currOrders });
        const rows: PodRow[] = Object.values(
          createEmptyTable(symbol, strategy, tenors)
        );
        const table: PodTable = rows
          .map(
            (row: PodRow): PodRow => {
              const bid: Order | undefined = orders.find(
                (order: Order) =>
                  order.type === OrderTypes.Bid && order.tenor === row.tenor
              );
              const ofr: Order | undefined = orders.find(
                (order: Order) =>
                  order.type === OrderTypes.Ofr && order.tenor === row.tenor
              );
              if (bid) row.bid = bid;
              if (ofr) row.ofr = ofr;
              row.spread = getSpread(row);
              row.mid = getMid(row);
              return { ...row };
            }
          )
          .reduce((table: PodTable, row: PodRow): PodTable => {
            table[row.id] = row;
            return table;
          }, {});
        dispatch(createAction<RunActions>(RunActions.SetTable, table));
      }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenors, symbol, strategy, visible, dispatch]);
};
