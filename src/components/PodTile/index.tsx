import createPODColumns from "columns/podColumns";
import { ModalWindow } from "components/ModalWindow";
import { convertToDepth } from "components/PodTile/helpers";
import { useInitializer } from "components/PodTile/hooks/useInitializer";
import { Row } from "components/PodTile/Row";
import { ProgressModalContent } from "components/ProgressModalContent";
import { Run } from "components/Run";
import { Table } from "components/Table";
import { observer } from "mobx-react";
import { PodTileStore } from "mobx/stores/podTileStore";
import workareaStore from "mobx/stores/workareaStore";
import React, {
  CSSProperties,
  ReactElement,
  useCallback,
  useEffect,
  useMemo,
} from "react";
import { InvalidCurrency } from "stateDefs/windowState";
import { Order } from "types/order";
import { PodRow } from "types/podRow";
import { PodTable } from "types/podTable";
import { Symbol } from "types/symbol";
import { User } from "types/user";
import { getOptimalWidthFromColumnsSpec } from "utils/getOptimalWidthFromColumnsSpec";

interface OwnProps {
  readonly id: string;
  readonly tenors: string[];
  readonly store: PodTileStore;
  readonly strategies: string[];
  readonly currencies: Symbol[];
  readonly connected: boolean;
  readonly scrollable?: boolean;
  readonly minimized?: boolean;
  readonly onClose?: () => void;
}

const getCurrencyFromName = (list: Symbol[], name: string): Symbol => {
  const found: Symbol | undefined = list.find(
    (each: Symbol) => each.name === name
  );
  if (found === undefined) return InvalidCurrency;
  return found;
};

const PodTile: React.FC<OwnProps> = (props: OwnProps): ReactElement | null => {
  const { store } = props;
  const { currencies, tenors } = props;
  const { strategy } = store;
  const { rows } = store;
  const currency: Symbol | undefined = getCurrencyFromName(
    currencies,
    store.currency
  );
  const user: User = workareaStore.user;

  useEffect((): (() => void) | undefined => {
    if (currency === InvalidCurrency || !strategy) return;
    store.initialize(currency.name, strategy);
    return () => {
      store.cleanup();
    };
  }, [store, currency, strategy, user]);

  // Initialize tile/window
  useInitializer(tenors, currency.name, strategy, user, store.setRows);
  const bulkCreateOrders = async (orders: Order[]) => {
    store.createBulkOrders(orders, currency);
  };

  const runWindow = (): ReactElement | null => {
    return (
      <Run
        visible={store.isRunWindowVisible}
        symbol={currency.name}
        strategy={strategy}
        tenors={tenors}
        defaultSize={currency.defaultqty}
        minimumSize={currency.minqty}
        orders={store.orders}
        onClose={store.hideRunWindow}
        onSubmit={bulkCreateOrders}
      />
    );
  };
  const dobRows: PodTable = !!store.currentTenor
    ? convertToDepth(store.orders[store.currentTenor], store.currentTenor)
    : {};
  const renderDoBRow = useCallback(
    (rowProps: any): ReactElement | null => {
      const { minqty, defaultqty } = currency;
      const { row } = rowProps;
      if (minqty === undefined || defaultqty === undefined || !strategy)
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
        <Row
          {...rowProps}
          user={user}
          orders={orders}
          darkpool={store.darkpool[row.tenor1]}
          defaultSize={defaultqty}
          minimumSize={minqty}
          onTenorSelected={() => store.setCurrentTenor(null)}
        />
      );
    },
    [currency, dobRows, store, strategy, user]
  );
  const renderPodRow = useCallback(
    (rowProps: any, index?: number): ReactElement => {
      const { name, minqty, defaultqty } = currency;
      const { row } = rowProps;
      const { tenor } = row;
      return (
        <Row
          {...rowProps}
          currency={name}
          strategy={strategy}
          tenor={tenor}
          darkpool={store.darkpool[tenor]}
          orders={store.orders[tenor]}
          defaultSize={defaultqty}
          minimumSize={minqty}
          displayOnly={false}
          rowNumber={index}
          onTenorSelected={store.setCurrentTenor}
        />
      );
    },
    [currency, strategy, store.darkpool, store.orders, store.setCurrentTenor]
  );

  const dobColumns = useMemo(
    () => createPODColumns(currency.name, strategy, true),
    [currency, strategy]
  );
  const podColumns = useMemo(
    () => createPODColumns(currency.name, strategy, false),
    [currency, strategy]
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
        width: getOptimalWidthFromColumnsSpec(podColumns),
        height: 1, // We need a minimal height or else it wont be rendered at all
      };
      return <div style={style} />;
    }

    const loadingClass: string | undefined = store.loading
      ? "loading"
      : undefined;
    const renderProgress = (): ReactElement | null => {
      if (store.currentProgress === null) return null;
      return (
        <ProgressModalContent
          startTime={store.operationStartedAt}
          message={"Creating Orders"}
          maximum={store.progressMax}
          progress={store.currentProgress}
        />
      );
    };

    return (
      <div
        className={"pod-tile-content" + (props.scrollable ? " scrollable" : "")}
      >
        <div className={"pod"} data-showing-tenor={!!store.currentTenor}>
          <Table
            id={`${props.id}-top`}
            className={loadingClass}
            scrollable={!!props.scrollable}
            columns={podColumns}
            rows={rows}
            renderRow={renderPodRow}
          />
        </div>
        <div className={"dob"} data-showing-tenor={!!store.currentTenor}>
          <Table
            id={`${props.id}-depth`}
            scrollable={!!props.scrollable}
            columns={dobColumns}
            rows={dobRows}
            renderRow={renderDoBRow}
          />
        </div>
        <ModalWindow
          render={renderProgress}
          isOpen={store.isProgressWindowVisible}
        />
      </div>
    );
  };

  return (
    <>
      {getWindowContent()}
      <ModalWindow render={runWindow} isOpen={store.isRunWindowVisible} />
    </>
  );
};

const connected = observer(PodTile);

export { connected as PodTile };
