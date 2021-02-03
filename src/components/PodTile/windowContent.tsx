import { observer } from "mobx-react";
import React, { CSSProperties, ReactElement } from "react";
import { getOptimalWidthFromColumnsSpec } from "../../utils/getOptimalWidthFromColumnsSpec";
import { ProgressModalContent } from "../ProgressModalContent";
import { Table } from "../Table";
import { ModalWindow } from "../ModalWindow";
import { PodTileStore } from "../../mobx/stores/podTileStore";
import { ColumnSpec } from "../Table/columnSpecification";
import { Row } from "./Row";
import { Symbol } from "../../types/symbol";
import { PodRow } from "../../types/podRow";
import { Order } from "../../types/order";
import workareaStore from "../../mobx/stores/workareaStore";
import { PodTable } from "../../types/podTable";

interface Props {
  readonly id: string;
  readonly store: PodTileStore;
  readonly columns: ReadonlyArray<ColumnSpec>;
  readonly minimized: boolean;
  readonly scrollable: boolean;
  readonly strategy: string;
  readonly symbol: Symbol;
  readonly dob: {
    readonly rows: PodTable;
    readonly columns: ReadonlyArray<ColumnSpec>;
  };
}

export const WindowContent: React.FC<Props> = observer(
  (props: Props): React.ReactElement => {
    const { store } = props;
    if (props.minimized) {
      const style: CSSProperties = {
        width: getOptimalWidthFromColumnsSpec(props.columns),
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
            scrollable={props.scrollable}
            columns={props.columns}
            rows={store.rows}
            renderRow={(rowProps: any, index?: number): ReactElement => {
              const { name, minqty, defaultqty } = props.symbol;
              const { row } = rowProps;
              const { tenor } = row;
              return (
                <Row
                  {...rowProps}
                  currency={name}
                  strategy={props.strategy}
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
            }}
          />
        </div>
        <div className={"dob"} data-showing-tenor={!!store.currentTenor}>
          <Table
            id={`${props.id}-depth`}
            scrollable={props.scrollable}
            columns={props.dob.columns}
            rows={props.dob.rows}
            renderRow={(rowProps: any): ReactElement | null => {
              const { minqty, defaultqty } = props.symbol;
              const { row } = rowProps;
              if (
                minqty === undefined ||
                defaultqty === undefined ||
                !props.strategy
              )
                return null;
              // Get current row
              const matchingRow: PodRow = props.dob.rows[row.id];
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
                  user={workareaStore.user}
                  orders={orders}
                  darkpool={store.darkpool[row.tenor1]}
                  defaultSize={defaultqty}
                  minimumSize={minqty}
                  onTenorSelected={() => store.setCurrentTenor(null)}
                />
              );
            }}
          />
        </div>
        <ModalWindow
          render={renderProgress}
          isOpen={store.isProgressWindowVisible}
        />
      </div>
    );
  }
);
