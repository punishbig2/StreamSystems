import {Dispatch, useEffect} from 'react';
import {FXOAction} from 'redux/fxo-action';
import {RunActions} from 'components/Run/reducer';
import {getAuthenticatedUser} from 'utils/getCurrentUser';
import {createAction} from 'redux/actionCreator';
import {API} from 'API';
import {OrderMessage, Order} from 'interfaces/order';
import {PodRow} from 'interfaces/podRow';
import {$$} from 'utils/stringPaster';
import {SignalRManager} from 'redux/signalR/signalRManager';
import {PodTable} from 'interfaces/podTable';
import {OrderTypes} from 'interfaces/mdEntry';
import {createEmptyTable} from 'components/Run/helpers/createEmptyTablei';

export const useRunInitializer = (tenors: string[], symbol: string, strategy: string, visible: boolean, dispatch: Dispatch<FXOAction<RunActions>>) => {
  useEffect(() => {
    if (!visible)
      return;
    const {email} = getAuthenticatedUser();
    dispatch(createAction<RunActions>(RunActions.SetLoadingStatus, true));
    API.getRunOrders(email, symbol, strategy)
      .then((messages: OrderMessage[]) => {
        const getMid = (row: PodRow): number | null => {
          const {ofr, bid} = row;
          if (ofr.price === null || bid.price === null)
            return null;
          return (ofr.price + bid.price) / 2;
        };
        const getSpread = (row: PodRow): number | null => {
          const {ofr, bid} = row;
          if (ofr.price === null || bid.price === null)
            return null;
          return ofr.price - bid.price;
        };
        const orderReducer = (map: { [id: string]: Order }, order: Order): { [id: string]: Order } => {
          const key: string = $$(order.symbol, order.strategy, order.tenor, order.type);
          // Add it to the map
          map[key] = order;
          // Return the updated map
          return map;
        };
        const currOrders: { [id: string]: Order } = SignalRManager.getOrdersForUser(email)
          .filter((order: Order) => order.symbol === symbol && order.strategy === strategy)
          .reduce(orderReducer, {});
        const prevOrders: { [id: string]: Order } = messages
          .map((message: OrderMessage) => Order.fromOrderMessage(message, email))
          .reduce(orderReducer, {});
        const newOrders: Order[] = Object.values({...prevOrders, ...currOrders});
        const rows: PodRow[] = Object.values(createEmptyTable(symbol, strategy, tenors));
        const table: PodTable = rows
          .map((row: PodRow): PodRow => {
            const newBid: Order | undefined = newOrders.find((order: Order) => order.type === OrderTypes.Bid && order.tenor === row.tenor);
            const newOfr: Order | undefined = newOrders.find((order: Order) => order.type === OrderTypes.Ofr && order.tenor === row.tenor);
            if (newBid)
              row.bid = newBid;
            if (newOfr)
              row.ofr = newOfr;
            row.spread = getSpread(row);
            row.mid = getMid(row);
            return {...row};
          })
          .reduce((table: PodTable, row: PodRow): PodTable => {
            table[row.id] = row;
            return table;
          }, {});
        dispatch(createAction<RunActions>(RunActions.SetTable, table));
      });
  }, [tenors, symbol, strategy, visible, dispatch]);
};
