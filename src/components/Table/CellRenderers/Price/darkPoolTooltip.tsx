import React, { ReactElement } from "react";
import { Table } from "components/Table/index";
import columns from "columns/darkPoolDepth";
import { Cell } from "components/Table/Cell";
import { ColumnSpec } from "components/Table/columnSpecification";
import { Order } from "interfaces/order";
import { getCellWidth } from "components/Table/helpers";

interface OwnProps {
  orders: Order[];
  onCancelOrder: (order: Order) => void;
}

export const DarkPoolTooltip: React.FC<OwnProps> = (props: OwnProps) => {
  const renderRow = (props: any): ReactElement => {
    const { columns, row } = props;
    return (
      <div className={"tr"} key={row.orderId}>
        {columns.map((column: ColumnSpec) => {
          const name: string = column.name;
          const width: string = getCellWidth(
            column.width,
            props.totalWidth,
            props.containerWidth
          );
          return (
            <Cell key={name} render={column.render} width={width} {...row} />
          );
        })}
      </div>
    );
  };
  return (
    <Table
      id={"darkPool-tooltip"}
      className={"padded"}
      columns={columns(props.onCancelOrder)}
      scrollable={false}
      renderRow={renderRow}
      rows={props.orders}
    />
  );
};
