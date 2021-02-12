import { API, Task } from "API";
import { RunRowProxy } from "components/Run/helpers/runRowProxy";
import { Row } from "components/Run/row";
import { Table } from "components/Table";
import { Width } from "types/brokerageWidths";
import { BrokerageWidthsResponse } from "types/brokerageWidthsResponse";
import { Order } from "types/order";
import { PodRow } from "types/podRow";
import strings from "locales";
import React, { ReactElement, useEffect, useMemo } from "react";
import { RunWindowStore } from "mobx/stores/runWindowStore";
import { observer } from "mobx-react";
import { createColumnsWithStore } from "./columnCreator";

interface OwnProps {
  readonly store: RunWindowStore;
  readonly visible: boolean;
  readonly symbol: string;
  readonly strategy: string;
  readonly tenors: ReadonlyArray<string>;
  readonly onClose: () => void;
  readonly onSubmit: (entries: ReadonlyArray<Order>) => void;
  readonly minimumSize: number;
  readonly defaultSize: number;
  readonly orders: { [tenor: string]: Order[] };
}

const Run: React.FC<OwnProps> = observer(
  (props: OwnProps): React.ReactElement => {
    const {
      symbol,
      strategy,
      tenors,
      defaultSize,
      minimumSize,
      visible,
      orders,
    } = props;

    const { store } = props;
    const { rows, selection, brokerageWidths } = store;

    const setSpread = (value: number): void => {
      // dispatch(createAction<RunActions>(RunActions.SetSpread, value));
      store.setSpreadAll(value);
    };

    useEffect(() => {
      const task: Task<BrokerageWidthsResponse> = API.getBrokerageWidths(
        symbol,
        strategy
      );
      const promise: Promise<BrokerageWidthsResponse> = task.execute();
      promise
        .then((response: BrokerageWidthsResponse) => {
          store.setBrokerageWidths([
            {
              type: "gold",
              value: response[0].gold,
            },
            {
              type: "silver",
              value: response[0].silver,
            },
            {
              type: "bronze",
              value: response[0].bronze,
            },
          ]);
        })
        .catch((error: any) => {
          if (error === "aborted") {
            return;
          }
          console.warn(error);
        });
      return () => task.cancel();
    }, [store, strategy, symbol]);

    useEffect((): (() => void) | void => {
      if (store.initialized) return;
      const task = store.initialize(symbol, strategy, tenors, orders);
      task.execute().catch(console.warn);
      return (): void => {
        task.cancel();
      };
    }, [symbol, strategy, tenors, visible, store, orders]);

    useEffect((): void => {
      store.setDefaultSize(defaultSize);
    }, [defaultSize, store, visible]);

    const activateOrders = (row: PodRow) => {
      // dispatch(createAction<RunActions>(RunActions.ActivateRow, row.id));
      store.activateRow(row.id);
    };

    const activateCancelledOrders = () => {
      if (!rows) return;
      const values: PodRow[] = Object.values(rows);
      values.forEach(activateOrders);
    };

    const defaultBidSize = store.defaultBidSize;
    const defaultOfrSize = store.defaultOfrSize;

    useEffect((): void => {
      store.updateSelection();
    }, [rows, defaultBidSize, defaultOfrSize, store]);

    const isSubmitEnabled = () => {
      return selection.length > 0;
    };

    const onSubmit = () => {
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
    const columns = useMemo(
      () =>
        createColumnsWithStore(
          store,
          minimumSize,
          defaultSize,
          defaultBidSize,
          defaultOfrSize,
          visible
        ),
      [store, defaultBidSize, defaultOfrSize, minimumSize, defaultSize, visible]
    );

    return (
      <div style={{ minWidth: 500 }}>
        <div className={"modal-title-bar"}>
          <div className={"half"}>
            <div className={"item"}>{props.symbol}</div>
            <div className={"item"}>{props.strategy}</div>
          </div>
          <div className={"commission-rates"}>
            {brokerageWidths.map(
              (width: Width<any> | undefined): ReactElement | null => {
                if (width === undefined) return null;
                return (
                  <button
                    key={width.type}
                    className={"rate " + width.type}
                    onClick={() => setSpread(width.value)}
                    type={"button"}
                    disabled={store.isLoading}
                  >
                    {width.value}
                  </button>
                );
              }
            )}
          </div>
        </div>
        <Table
          id={`${props.symbol}${props.strategy}-run`}
          scrollable={false}
          columns={columns}
          rows={rows}
          renderRow={renderRow}
          className={(store.isLoading ? "loading" : "") + " run-table"}
        />
        <div className={"modal-buttons"}>
          <button
            className={"cancel pull-left"}
            onClick={activateCancelledOrders}
            disabled={store.isLoading}
          >
            {strings.ActivateAll}
          </button>
          <div className={"pull-right"}>
            <button className={"cancel"} onClick={props.onClose}>
              {strings.Close}
            </button>
            <button
              className={"success"}
              onClick={onSubmit}
              disabled={!isSubmitEnabled()}
            >
              {strings.Submit}
            </button>
          </div>
        </div>
      </div>
    );
  }
);

(Run as any).whyDidYouRender = true;

export { Run };
