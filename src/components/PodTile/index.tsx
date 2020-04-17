import createTOBColumns from 'columns/podColumns';
import { ModalWindow } from 'components/ModalWindow';
import { Run } from 'components/Run';
import { Table } from 'components/Table';
import { useInitializer } from 'components/PodTile/hooks/useInitializer';
import { Row } from 'components/PodTile/Row';
import { Order } from 'interfaces/order';
import React, { ReactElement, useEffect, useMemo, CSSProperties } from 'react';
import { Currency } from 'interfaces/currency';
import { observer } from 'mobx-react';
import { User } from 'interfaces/user';
import { InvalidCurrency } from 'stateDefs/windowState';
import { PodTileStore } from 'mobx/stores/podTileStore';
import { getOptimalWidthFromColumnsSpec } from 'getOptimalWIdthFromColumnsSpec';
import { convertToDepth } from 'components/PodTile/helpers';
import { API } from 'API';
import { PodRow } from 'interfaces/podRow';
import { PodTable } from 'interfaces/podTable';
import { ProgressModalContent } from 'components/ProgressModalContent';

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
    // const manager: SignalRManager = SignalRManager.getInstance();
    if (currency === InvalidCurrency || !strategy)
      return;
    // manager.loadDepth(currency.name, strategy, user);
    store.initialize(currency.name, strategy);
  }, [currency, store, strategy, user]);

  // Initialize tile/window
  useInitializer(tenors, currency.name, strategy, user, store.setRows);
  // Handler methods
  const bulkCreateOrders = async (orders: Order[]) => {
    store.hideRunWindow();
    store.showProgressWindow(-1);
    await API.createOrdersBulk(orders, currency.name, strategy, personality, user, currency.minqty);
    store.hideProgressWindow();
  };

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
        orders={store.orders}
        onClose={store.hideRunWindow}
        onSubmit={bulkCreateOrders}/>
    );
  };

  const renderToBRow = (rowProps: any, index?: number): ReactElement => {
    const { row } = rowProps;
    return (
      <Row {...rowProps}
           user={user}
           orders={store.orders[row.tenor]}
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
  const dobRows: PodTable = !!store.currentTenor
    ? convertToDepth(store.orders[store.currentTenor], store.currentTenor)
    : {};
  const renderDoBRow = (rowProps: any): ReactElement | null => {
    const { row } = rowProps;
    if (!currency || currency.minqty === undefined || currency.defaultqty === undefined || !strategy)
      return null;
    // Get current row
    const matchingRow: PodRow = dobRows[row.id];
    const orders: Order[] = [];
    if (matchingRow) {
      if (matchingRow.bid) {
        orders.push(matchingRow.bid);
      }
      if (matchingRow.ofr) {
        orders.push(matchingRow.ofr);
      }
    }
    return (
      <Row {...rowProps}
           user={user}
           orders={orders}
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
      const orders: Order[] = store.orders[store.currentTenor];
      if (orders.length === 0) {
        // Has the equivalent effect of hiding the orders book
        // but it will actually set the correct state for the
        // tenors to be double-clickable
        store.setCurrentTenor(null);
      }
    }
  }, [store.currentTenor, store.orders, store]);

  const getWindowContent = () => {
    if (props.minimized) {
      const style: CSSProperties = {
        width: getOptimalWidthFromColumnsSpec(tobColumns),
        height: 1, // We need a minimal height or else it wont be rendered at all
      };
      return <div style={style}/>;
    }

    const loadingClass: string | undefined = store.loading ? 'loading' : undefined;
    const renderProgress = (): ReactElement | null => {
      if (store.currentProgress === null)
        return null;
      return <ProgressModalContent startTime={store.operationStartedAt}
                                   maximum={store.progressMax}
                                   progress={store.currentProgress}/>;
    };

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
        <ModalWindow render={renderProgress} visible={store.isProgressWindowVisible}/>
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

