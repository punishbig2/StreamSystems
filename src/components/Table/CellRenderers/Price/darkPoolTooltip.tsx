import React, { ReactElement } from "react";
import { Table } from "components/Table/index";
import columns from "columns/darkPoolDepth";
import { Cell } from "components/Table/Cell";
import {
  defaultTableColumnStateMapper,
  TableColumn,
} from "components/Table/tableColumn";
import { Order } from "types/order";
import { getCellWidth } from "components/Table/helpers";

interface OwnProps {
  orders: Order[];
  showInstruction: boolean;
  onCancelOrder: (order: Order) => void;
}

export const DarkPoolTooltip: React.FC<OwnProps> = (props: OwnProps) => {
  const renderRow = (props: any): ReactElement => {
    const { columns, row } = props;
    return (
      <div className={"tr"} key={row.orderId}>
        {columns.map((column: TableColumn) => {
          const name: string = column.name;
          const width: string = getCellWidth(column.width, props.totalWidth);
          return (
            <Cell key={name} render={column.render} width={width} {...row} />
          );
        })}
      </div>
    );
  };
  return (
    <Table
      rows={props.orders}
      columns={columns(props.onCancelOrder, props.showInstruction).map(
        defaultTableColumnStateMapper
      )}
      renderRow={renderRow}
      className={"padded"}
    />
  );
};
