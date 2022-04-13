import { Task } from "API";
import createPODColumns from "columns/podColumns";
import { ModalWindow } from "components/ModalWindow";
import { convertToDepth } from "components/PodTile/helpers";
import { Run } from "components/Run";
import { TableColumn } from "components/Table/tableColumn";
import { observer } from "mobx-react";
import { PodStore, PodStoreContext } from "mobx/stores/podStore";
import { RunWindowStoreContext } from "mobx/stores/runWindowStore";
import workareaStore from "mobx/stores/workareaStore";
import React, { ReactElement, useEffect, useMemo } from "react";
import { InvalidCurrency } from "stateDefs/windowState";
import { Order } from "types/order";
import { PodTable } from "types/podTable";
import { Symbol } from "types/symbol";
import { WindowContent } from "components/PodTile/windowContent";

interface Props {
  readonly tenors: ReadonlyArray<string>;
  readonly currencies: ReadonlyArray<Symbol>;

  readonly visible: boolean;
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
    const store = React.useContext<PodStore>(PodStoreContext);
    const { currencies, tenors, visible } = props;
    const { strategy, creatingBulk } = store;
    const currency: Symbol | undefined = getCurrencyFromName(
      currencies,
      store.ccyPair
    );
    const { connected, user } = workareaStore;

    useEffect((): (() => void) | undefined => {
      if (!connected || currency === InvalidCurrency || !strategy || !visible)
        return;
      const initializeTask: Task<void> = store.initialize(
        currency.name,
        strategy
      );
      const cleanUps: Array<() => void> = store.listen(currency.name, strategy);

      setTimeout((): void => {
        void initializeTask.execute();
      }, 0);

      return () => {
        initializeTask.cancel();
        cleanUps.forEach((clean: () => void): void => clean());
      };
    }, [store, currency, strategy, user, connected, visible]);

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

    return (
      <>
        <WindowContent
          columns={podColumns}
          symbol={currency}
          strategy={strategy}
          dob={{
            columns: dobColumns,
            rows: dobRows,
          }}
          loading={creatingBulk}
        />
        <ModalWindow isOpen={store.isRunWindowVisible}>
          <RunWindowStoreContext.Provider value={store.runWindowStore}>
            <Run
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
