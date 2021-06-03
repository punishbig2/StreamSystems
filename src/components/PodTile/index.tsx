import { Task } from "API";
import createPODColumns from "columns/podColumns";
import { ModalWindow } from "components/ModalWindow";
import { convertToDepth } from "components/PodTile/helpers";
import { useInitializer } from "components/PodTile/hooks/useInitializer";
import { Run } from "components/Run";
import { observer } from "mobx-react";
import { PodStore } from "mobx/stores/podStore";
import {
  RunWindowStore,
  RunWindowStoreContext,
} from "mobx/stores/runWindowStore";
import workareaStore from "mobx/stores/workareaStore";
import React, { ReactElement, useEffect, useMemo } from "react";
import { InvalidCurrency } from "stateDefs/windowState";
import { Order } from "types/order";
import { PodTable } from "types/podTable";
import { Symbol } from "types/symbol";
import { User } from "types/user";
import { TableColumn } from "components/Table/tableColumn";
import { WindowContent } from "./windowContent";

interface Props {
  readonly id: string;
  readonly tenors: ReadonlyArray<string>;
  readonly store: PodStore;
  readonly currencies: ReadonlyArray<Symbol>;
  readonly minimized?: boolean;
  readonly onClose?: () => void;
}

const getCurrencyFromName = (
  list: ReadonlyArray<Symbol>,
  name: string
): Symbol => {
  const found: Symbol | undefined = list.find(
    (each: Symbol) => each.name === name
  );
  if (found === undefined) return InvalidCurrency;
  return found;
};

export const PodTile: React.FC<Props> = observer(
  (props: Props): ReactElement | null => {
    const { store } = props;
    const { currencies, tenors } = props;
    const { strategy } = store;
    const currency: Symbol | undefined = getCurrencyFromName(
      currencies,
      store.ccyPair
    );
    const user: User = workareaStore.user;

    useEffect((): (() => void) | undefined => {
      if (currency === InvalidCurrency || !strategy) return;
      const initializeTask: Task<void> = store.initialize(
        currency.name,
        strategy
      );
      const cleanUps: Array<() => void> = store.createMarketListeners(
        currency.name,
        strategy
      );
      void initializeTask.execute();
      return () => {
        initializeTask.cancel();
        cleanUps.forEach((clean: () => void): void => clean());
      };
    }, [store, currency, strategy, user]);

    // Initialize tile/window
    useInitializer(tenors, currency.name, strategy, user, store.setRows);
    const bulkCreateOrders = async (orders: ReadonlyArray<Order>) => {
      store.createBulkOrders(orders, currency).catch(console.warn);
    };

    const dobRows: PodTable = useMemo(
      (): PodTable =>
        !!store.currentTenor
          ? convertToDepth(store.orders[store.currentTenor], store.currentTenor)
          : {},
      [store.currentTenor, store.orders]
    );
    const dobColumns = useMemo(
      () => createPODColumns(currency.name, strategy, true),
      [currency, strategy]
    );
    const podColumns: TableColumn[] = useMemo(
      () => createPODColumns(currency.name, strategy, false),
      [currency, strategy]
    );
    // In case we lost the dob please reset this so that double
    // clicking the tenor keeps working
    useEffect(() => {
      if (store.currentTenor === null) {
        return;
      } else {
        const orders: ReadonlyArray<Order> = store.orders[store.currentTenor];
        if (orders.length === 0) {
          // Has the equivalent effect of hiding the orders book
          // but it will actually set the correct state for the
          // tenors to be double-clickable
          store.setCurrentTenor(null);
        }
      }
    }, [store.currentTenor, store.orders, store]);

    return (
      <>
        <WindowContent
          id={props.id}
          store={store}
          columns={podColumns}
          symbol={currency}
          strategy={strategy}
          dob={{
            columns: dobColumns,
            rows: dobRows,
          }}
        />
        <ModalWindow isOpen={store.isRunWindowVisible}>
          <RunWindowStoreContext.Provider value={new RunWindowStore()}>
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
          </RunWindowStoreContext.Provider>
        </ModalWindow>
      </>
    );
  }
);
