import createTOBColumns from 'columns/podColumns';
import { ModalWindow } from 'components/ModalWindow';
import { Run } from 'components/Run';
import { Table } from 'components/Table';
import { useInitializer } from 'components/PodTile/hooks/useInitializer';
import { Row } from 'components/PodTile/Row';
import { Order, OrderStatus } from 'interfaces/order';
import { PodTable } from 'interfaces/podTable';
import React, { ReactElement, useCallback, useEffect, useMemo, CSSProperties } from 'react';
import { API } from 'API';
import { Currency } from 'interfaces/currency';
import { observer } from 'mobx-react';
import { User } from 'interfaces/user';
import { InvalidCurrency } from 'redux/stateDefs/windowState';
import { PodTileStore } from 'mobx/stores/podTileStore';
import { SignalRManager } from 'redux/signalR/signalRManager';
import { getOptimalWidthFromColumnsSpec } from 'getOptimalWIdthFromColumnsSpec';
import { OrderTypes } from 'interfaces/mdEntry';
import { priceFormatter } from 'utils/priceFormatter';
import { PodRowStatus } from 'interfaces/podRow';

interface OwnProps {
  id: string;
  store: PodTileStore;
  user: User;
  tenors: string[];
  strategies: string[];
  currencies: Currency[];
  connected: boolean;

  personality: string;

  scrollable?: boolean;
  minimized?: boolean;

  onClose?: () => void;
}

const getCurrencyFromName = (list: Currency[], name: string): Currency => {
  const found: Currency | undefined = list.find((each: Currency) => each.name === name);
  if (found === undefined)
    return InvalidCurrency;
  return found;
};

const PodTile: React.FC<OwnProps> = (props: OwnProps): ReactElement | null => {
  const store: PodTileStore = props.store;
  const { currencies, tenors, connected, user, personality } = props;
  const { strategy } = store;
  const { rows } = store;
  const currency: Currency | undefined = getCurrencyFromName(currencies, store.currency);

  useEffect(() => {
    store.setCurrency(currency.name);
    store.setStrategy(strategy);
  }, [store, currency, strategy]);

  useEffect(() => {
    const manager: SignalRManager = SignalRManager.getInstance();
    if (currency === InvalidCurrency || !strategy)
      return;
    manager.loadDepth(currency.name, strategy, user);
    store.initialize(currency.name, strategy, user);
  }, [currency, store, strategy, user]);

  // Create depth for each tenor
  // useDepthEmitter(tenors, currency.name, strategy, insertDepth);
  // Initialize tile/window
  useInitializer(tenors, currency.name, strategy, user, store.setRows);
  // Handler methods
  const bulkCreateOrders = useCallback(
    (entries: Order[]) => {
      // Close the runs window
      // Create the orders
      Promise.all(
        entries.map(async (order: Order) => {
          const depth: Order[] = store.depth[order.tenor];
          const myOrder: Order | undefined = depth ? depth.find((o: Order) => {
            return o.type === order.type && o.user === user.email;
          }) : undefined;
          if (myOrder && myOrder.orderId && ((myOrder.status & OrderStatus.Cancelled) === 0))
            await API.cancelOrder(myOrder, user);
          await API.createOrder(order, personality, user, currency.minqty);
        }))
        .then(() => store.hideRunWindow());
    },
    [personality, currency.minqty, user, store],
  );

  const runWindow = (): ReactElement | null => {
    return (
      <Run
        user={user}
        visible={store.isRunWindowVisible}
        symbol={currency.name}
        strategy={strategy}
        tenors={tenors}
        defaultSize={currency.defaultqty}
        minimumSize={currency.minqty}
        onClose={store.hideRunWindow}
        onSubmit={bulkCreateOrders}/>
    );
  };

  const renderToBRow = (rowProps: any, index?: number): ReactElement => {
    const { row } = rowProps;
    return (
      <Row {...rowProps}
           user={user}
           depth={store.depth[row.tenor]}
           personality={personality}
           defaultSize={currency.defaultqty}
           minimumSize={currency.minqty}
           currency={currency.name}
           strategy={strategy}
           tenor={row.tenor}
           displayOnly={false}
           rowNumber={index}
           connected={connected}
           onTenorSelected={store.setCurrentTenor}/>
    );
  };

  const renderDoBRow = (rowProps: any): ReactElement | null => {
    if (!currency || currency.minqty === undefined || currency.defaultqty === undefined || !strategy)
      return null;
    // static
    return (
      <Row {...rowProps}
           user={user}
           depth={[]}
           connected={connected}
           personality={personality}
           defaultSize={currency.defaultqty}
           minimumSize={currency.minqty}
           onTenorSelected={() => store.setCurrentTenor(null)}/>
    );
  };
  const dobColumns = useMemo(() => createTOBColumns(currency.name, strategy, user, true),
    [strategy, currency.name, user],
  );
  const tobColumns = useMemo(() => createTOBColumns(currency.name, strategy, user, false),
    [strategy, currency.name, user],
  );
  // In case we lost the dob please reset this so that double
  // clicking the tenor keeps working
  useEffect(() => {
    if (store.currentTenor === null) {
      return;
    } else {
      const depth: Order[] = store.depth[store.currentTenor];
      if (depth.length === 0) {
        // Has the equivalent effect of hiding the depth book
        // but it will actually set the correct state for the
        // tenors to be double-clickable
        store.setCurrentTenor(null);
      }
    }
  }, [store.currentTenor, store.depth, store]);

  const getWindowContent = () => {
    if (props.minimized) {
      const style: CSSProperties = {
        width: getOptimalWidthFromColumnsSpec(tobColumns),
        height: 1, // We need a minimal height or else it wont be rendered at all
      };
      return <div style={style}/>;
    }

    const convertToDepth = (orders: Order[]): PodTable => {
      if (orders === undefined || store.currentTenor === null)
        return {};
      const tenor: string = store.currentTenor;
      const orderSorter = (sign: number) =>
        (o1: Order, o2: Order): number => {
          if (o1.price === null || o2.price === null)
            throw new Error('should not be sorting orders with null price');
          if (priceFormatter(o1.price) === priceFormatter(o2.price))
            return sign * (o1.timestamp - o2.timestamp);
          return sign * (o1.price - o2.price);
        };
      const bids: Order[] = orders.filter((order: Order) => order.type === OrderTypes.Bid);
      const ofrs: Order[] = orders.filter((order: Order) => order.type === OrderTypes.Ofr);
      // Sort them
      bids.sort(orderSorter(-1));
      ofrs.sort(orderSorter(1));
      const count: number = bids.length > ofrs.length ? bids.length : ofrs.length;
      const depth: PodTable = {};
      for (let i = 0; i < count; ++i) {
        depth[i] = {
          id: i.toString(),
          bid: bids[i],
          ofr: ofrs[i],
          spread: null,
          mid: null,
          darkPrice: null,
          tenor: tenor,
          status: PodRowStatus.Normal,
        };
      }
      return depth;
    };

    const dobRows = !!store.currentTenor ? convertToDepth(store.depth[store.currentTenor]) : {};
    const loadingClass: string | undefined = store.loading ? 'loading' : undefined;
    return (
      <div className={'pod-tile-content' + (props.scrollable ? ' scrollable' : '')}>
        <div className={'pod'} data-showing-tenor={!!store.currentTenor}>
          <Table className={loadingClass}
                 scrollable={!!props.scrollable}
                 columns={tobColumns}
                 rows={rows}
                 renderRow={renderToBRow}/>
        </div>
        <div className={'dob'} data-showing-tenor={!!store.currentTenor}>
          <Table scrollable={!!props.scrollable} columns={dobColumns} rows={dobRows} renderRow={renderDoBRow}/>
        </div>
      </div>
    );
  };

  return (
    <>
      {getWindowContent()}
      <ModalWindow render={runWindow} visible={store.isRunWindowVisible}/>
    </>
  );
};

const connected = observer(PodTile);

export { connected as PodTile };

