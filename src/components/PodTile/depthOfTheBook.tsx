import { useDobRows } from "components/PodTile/hooks/useDobRows";
import { Row } from "components/PodTile/Row";
import { Table } from "components/Table";
import { ExtendedTableColumn, TableColumn } from "components/Table/tableColumn";
import workareaStore from "mobx/stores/workareaStore";
import React, { ReactElement } from "react";
import { DepthData } from "types/depthData";
import { OrderTypes } from "types/mdEntry";
import { Order, OrderStatus } from "types/order";
import { PodRow } from "types/podRow";
import { SortDirection } from "types/sortDirection";
import { Symbol } from "types/symbol";

interface Props {
  readonly currentTenor: string | null;
  readonly symbol: Symbol;
  readonly strategy: string;
  readonly darkOrders: ReadonlyArray<Order>;
  readonly book: DepthData;

  readonly onTenorSelected: (tenor: string | null) => void;
}

export const DepthOfTheBook: React.FC<Props> = (
  props: Props
): React.ReactElement => {
  const { rows, columns } = props.book;
  const { currentTenor, symbol, strategy, darkOrders } = props;
  const { user } = workareaStore;
  const { onTenorSelected } = props;

  const effectiveRows = useDobRows(
    rows,
    currentTenor!,
    symbol.symbolID,
    strategy,
    user
  );

  const renderRow = React.useCallback(
    (rowProps: any, index?: number): ReactElement | null => {
      const { minqty, defaultqty } = symbol;
      const { row } = rowProps;
      if (minqty === undefined || defaultqty === undefined) return null;
      // Get current row
      const matchingRow: PodRow = effectiveRows[row.id];

      const orders: Order[] = [];
      if (matchingRow) {
        if (matchingRow.bid) {
          orders.push(matchingRow.bid);
        }
        if (matchingRow.ofr) {
          orders.push(matchingRow.ofr);
        }
      }

      if (orders.length === 1) {
        if (orders[0].type === OrderTypes.Bid) {
          orders.push({
            ...orders[0],
            type: OrderTypes.Ofr,
            price: null,
            size: null,
            status: OrderStatus.None,
          });
        } else if (orders[0].type === OrderTypes.Ofr) {
          orders.push({
            ...orders[0],
            type: OrderTypes.Bid,
            price: null,
            size: null,
            status: OrderStatus.None,
          });
        }
      }

      return (
        <Row
          {...rowProps}
          user={workareaStore.user}
          orders={orders}
          darkpool={darkOrders}
          defaultSize={defaultqty}
          minimumSize={minqty}
          rowNumber={index}
          onTenorSelected={(): void => onTenorSelected(null)}
        />
      );
    },
    [symbol, effectiveRows, darkOrders, onTenorSelected]
  );

  const _columns = React.useMemo((): ReadonlyArray<ExtendedTableColumn> => {
    return columns.map(
      (column: TableColumn): ExtendedTableColumn => ({
        ...column,
        sortDirection: SortDirection.None,
        filter: "",
      })
    );
  }, [columns]);

  return (
    <div className={"dob"} data-showing-tenor={props.currentTenor !== null}>
      <Table columns={_columns} rows={effectiveRows} renderRow={renderRow} />
    </div>
  );
};
