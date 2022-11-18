import { Task } from 'API';
import createPODColumns from 'columns/podColumns';
import { ModalWindow } from 'components/ModalWindow';
import { convertToDepth } from 'components/PodTile/helpers';
import { WindowContent } from 'components/PodTile/windowContent';
import { Run } from 'components/Run';
import { TableColumn } from 'components/Table/tableColumn';
import { PodStore, PodStoreContext } from 'mobx/stores/podStore';
import { RunWindowStoreContext } from 'mobx/stores/runWindowStore';
import workareaStore from 'mobx/stores/workareaStore';
import { observer } from 'mobx-react';
import React, { ReactElement, useEffect, useMemo } from 'react';
import { InvalidCurrency } from 'stateDefs/windowState';
import { FXSymbol } from 'types/FXSymbol';
import { Order } from 'types/order';
import { PodTable } from 'types/podTable';

interface Props {
  readonly tenors: readonly string[];
  readonly currencies: readonly FXSymbol[];

  readonly visible: boolean;
}

const getCurrencyFromName = (list: readonly FXSymbol[], name: string): FXSymbol => {
  const found: FXSymbol | undefined = list.find((each: FXSymbol) => each.name === name);
  if (found === undefined) return InvalidCurrency;
  return found;
};

export const PodTile: React.FC<Props> = observer((props: Props): ReactElement | null => {
  const store = React.useContext<PodStore>(PodStoreContext);
  const { currencies, tenors, visible } = props;
  const { strategy, creatingBulk } = store;
  const currency: FXSymbol | undefined = getCurrencyFromName(currencies, store.ccyPair);
  const { connected, user } = workareaStore;

  useEffect((): VoidFunction | undefined => {
    if (!connected || currency === InvalidCurrency || !strategy || !visible) return;
    const initializeTask: Task<void> = store.initialize(currency.name, strategy);
    const cleanUps: Array<() => void> = store.listen(currency.name, strategy);

    setTimeout((): void => {
      void initializeTask.execute();
    }, 0);

    return () => {
      initializeTask.cancel();
      cleanUps.forEach((clean: () => void): void => clean());
    };
  }, [store, currency, strategy, user, connected, visible]);

  const bulkCreateOrders = (orders: readonly Order[]): void => {
    store.createBulkOrders(orders, currency).catch(console.warn);
  };

  const dobRows: PodTable = useMemo(
    (): PodTable =>
      store.currentTenor
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
});
