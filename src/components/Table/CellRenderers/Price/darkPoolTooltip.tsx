import createColumns from "columns/darkPoolDepth";
import { Cell } from "components/Table/Cell";
import { getCellWidth } from "components/Table/helpers";
import { Table } from "components/Table/index";
import { ExtendedTableColumn, TableColumn } from "components/Table/tableColumn";
import React, { ReactElement } from "react";
import { Order } from "types/order";
import { SortDirection } from "types/sortDirection";

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

  const _columns = React.useMemo(
    (): ReadonlyArray<ExtendedTableColumn> =>
      createColumns(props.onCancelOrder, props.showInstruction).map(
        (column: TableColumn): ExtendedTableColumn => ({
          ...column,
          sortDirection: SortDirection.None,
          filter: "",
        })
      ),
    [props.onCancelOrder, props.showInstruction]
  );

  return (
    <Table
      rows={props.orders}
      columns={_columns}
      renderRow={renderRow}
      className={"padded"}
    />
  );
};
