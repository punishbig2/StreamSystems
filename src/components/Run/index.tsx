import { API, Task } from 'API';
import { createColumnsWithStore } from 'components/Run/columnCreator';
import { RunRowProxy } from 'components/Run/helpers/runRowProxy';
import { Row } from 'components/Run/row';
import { Table } from 'components/Table';
import { ExtendedTableColumn, TableColumn } from 'components/Table/tableColumn';
import strings from 'locales';
import { RunWindowStore, RunWindowStoreContext } from 'mobx/stores/runWindowStore';
import { observer } from 'mobx-react';
import React, { ReactElement, useEffect } from 'react';
import { Width } from 'types/brokerageWidths';
import { BrokerageWidthsResponse } from 'types/brokerageWidthsResponse';
import { OrderTypes } from 'types/mdEntry';
import { Order, OrderStatus } from 'types/order';
import { PodRow } from 'types/podRow';
import { SortDirection } from 'types/sortDirection';

interface Props {
  readonly symbol: string;
  readonly strategy: string;
  readonly tenors: readonly string[];
  readonly minimumSize: number;
  readonly defaultSize: number;
  readonly orders: { [tenor: string]: readonly Order[] };
  readonly onClose: () => void;
  readonly onSubmit: (entries: readonly Order[]) => void;
}

const Run: React.FC<Props> = observer((props: Props): React.ReactElement => {
  const { symbol, strategy, tenors, defaultSize, minimumSize, orders } = props;

  const store = React.useContext<RunWindowStore>(RunWindowStoreContext);
  const { rows, selection, brokerageWidths } = store;

  const setSpread = (value: number): void => {
    store.setSpreadAll(value);
  };

  useEffect(() => {
    const task: Task<BrokerageWidthsResponse> = API.getBrokerageWidths(symbol, strategy);
    const promise: Promise<BrokerageWidthsResponse> = task.execute();
    store.setBrokerageWidths([]);
    promise
      .then((response: BrokerageWidthsResponse) => {
        store.setBrokerageWidths([
          {
            type: 'gold',
            value: response[0].gold,
          },
          {
            type: 'silver',
            value: response[0].silver,
          },
          {
            type: 'bronze',
            value: response[0].bronze,
          },
        ]);
      })
      .catch((error: any) => {
        if (error === 'aborted') {
          return;
        }
        console.warn(error);
      });
    return () => task.cancel();
  }, [store, strategy, symbol]);

  useEffect((): VoidFunction | void => {
    const task = store.initialize(symbol, strategy, tenors, orders);
    task.execute().catch(console.warn);
    return (): void => {
      task.cancel();
    };
  }, [symbol, strategy, tenors, store, orders]);

  useEffect((): void => {
    store.setDefaultSize(defaultSize);
  }, [defaultSize, store]);

  const activateCancelledOrders = (): void => {
    if (!rows) {
      return;
    }
    const values: readonly PodRow[] = Object.values(rows);

    values.forEach((row: PodRow): void => {
      const { ofr, bid } = row;
      if ((ofr.status & OrderStatus.Cancelled) === OrderStatus.Cancelled) {
        store.activateOrder(row.id, OrderTypes.Ofr);
      }
      if ((bid.status & OrderStatus.Cancelled) === OrderStatus.Cancelled) {
        store.activateOrder(row.id, OrderTypes.Bid);
      }
    }, []);
  };

  const defaultBidSize = store.defaultBidSize;
  const defaultOfrSize = store.defaultOfrSize;

  useEffect((): void => {
    store.updateSelection();
  }, [rows, defaultBidSize, defaultOfrSize, store]);

  const isSubmitEnabled = (): boolean => {
    return selection.length > 0;
  };

  const onSubmit = (): void => {
    props.onSubmit(selection);
  };

  const renderRow = (props: any, index?: number): ReactElement | null => {
    const { row: originalRow } = props;
    const row = new Proxy(originalRow, RunRowProxy);
    return (
      <Row
        {...props}
        user={props.user}
        row={row}
        defaultBidSize={props.defaultBidSize}
        defaultOfrSize={props.defaultOfrSize}
        rowNumber={index}
      />
    );
  };

  // This builds the set of columns of the run depth with it's callbacks
  const columns = React.useMemo(
    (): readonly ExtendedTableColumn[] =>
      createColumnsWithStore(store, minimumSize, defaultSize, defaultBidSize, defaultOfrSize).map(
        (column: TableColumn): ExtendedTableColumn => ({
          ...column,
          sortDirection: SortDirection.None,
          filter: '',
        })
      ),
    [store, defaultBidSize, defaultOfrSize, minimumSize, defaultSize]
  );

  return (
    <div className="run-modal">
      <div className="modal-title-bar">
        <div className="half">
          <div className="item">{props.symbol}</div>
          <i className="fa fa-grip-vertical" />
          <div className="item">{props.strategy}</div>
        </div>
        <div className="commission-rates">
          {brokerageWidths.map((width: Width<any> | undefined): ReactElement | null => {
            if (width === undefined) return null;
            return (
              <button
                key={width.type}
                className={'rate ' + width.type}
                onClick={() => setSpread(width.value)}
                type="button"
                disabled={store.isLoading}
              >
                {width.value}
              </button>
            );
          })}
        </div>
      </div>
      <Table
        columns={columns}
        rows={rows}
        renderRow={renderRow}
        className={(store.isLoading ? 'loading' : '') + ' run-table'}
      />
      <div className="modal-buttons">
        <button
          className="cancel pull-left"
          onClick={activateCancelledOrders}
          disabled={store.isLoading}
        >
          {strings.ActivateAll}
        </button>
        <div className="pull-right">
          <button className="cancel" onClick={props.onClose}>
            {strings.Close}
          </button>
          <button className="success" onClick={onSubmit} disabled={!isSubmitEnabled()}>
            {strings.Submit}
          </button>
        </div>
      </div>
    </div>
  );
});

export { Run };
