import { Row } from "components/PodTile/Row";
import { Table } from "components/Table";
import { TableColumn } from "components/Table/tableColumn";
import React, { ReactElement } from "react";
import { Order } from "types/order";
import { PodRow } from "types/podRow";
import { Symbol } from "types/symbol";
import { W } from "types/w";

interface Props {
  readonly currentTenor: string | null;
  readonly id: string;
  readonly columns: ReadonlyArray<TableColumn>;
  readonly loading: boolean;
  readonly rows: { [tenor: string]: PodRow };
  readonly symbol: Symbol;
  readonly strategy: string;
  readonly orders: { [tenor: string]: ReadonlyArray<Order> };
  readonly onTenorSelected: (tenor: string | null) => void;
  readonly darkPoolOrders: { [tenor: string]: W };
}

export const TopOfTheBook: React.FC<Props> = (
  props: Props
): React.ReactElement => {
  const { columns } = props;
  return (
    <div className={"pod"} data-showing-tenor={props.currentTenor !== null}>
      <Table
        className={props.loading ? "loading" : undefined}
        columns={columns}
        rows={props.rows}
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
              darkpool={props.darkPoolOrders[tenor]}
              orders={props.orders[tenor]}
              defaultSize={defaultqty}
              minimumSize={minqty}
              displayOnly={false}
              rowNumber={index}
              onTenorSelected={props.onTenorSelected}
            />
          );
        }}
      />
    </div>
  );
};
