import { Row } from "components/PodTile/Row";
import { Table } from "components/Table";
import workareaStore from "mobx/stores/workareaStore";
import React, { ReactElement } from "react";
import { DepthData } from "types/depthData";
import { Order } from "types/order";
import { PodRow } from "types/podRow";
import { Symbol } from "types/symbol";
import { W } from "types/w";

interface Props {
  readonly currentTenor: string | null;
  readonly symbol: Symbol;
  readonly strategy?: string;
  readonly darkPoolOrders: { [key: string]: W };
  readonly book: DepthData;

  readonly onTenorSelected: (tenor: string | null) => void;
}

export const DepthOfTheBook: React.FC<Props> = (
  props: Props
): React.ReactElement => {
  const { rows, columns } = props.book;
  const renderRow = React.useCallback(
    (rowProps: any): ReactElement | null => {
      const { minqty, defaultqty } = props.symbol;
      const { row } = rowProps;
      if (minqty === undefined || defaultqty === undefined) return null;
      // Get current row
      const matchingRow: PodRow = rows[row.id];
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
          darkpool={props.darkPoolOrders[row.tenor1]}
          defaultSize={defaultqty}
          minimumSize={minqty}
          onTenorSelected={(): void => props.onTenorSelected(null)}
        />
      );
    },
    [props, rows]
  );
  return (
    <div className={"dob"} data-showing-tenor={props.currentTenor !== null}>
      <Table columns={columns} rows={rows} renderRow={renderRow} />
    </div>
  );
};
