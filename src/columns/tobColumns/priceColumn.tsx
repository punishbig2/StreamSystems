import { TOBColumnData } from "components/TOB/data";
import { HeaderAction, DualTableHeader } from "components/dualTableHeader";
import { ColumnSpec } from "components/Table/columnSpecification";
import { Order, OrderStatus } from "interfaces/order";
import { TOBPrice } from "columns/tobPrice";
import React from "react";
import { getChevronStatus, Type, RowType } from "columns/tobColumns/common";
import { STRM } from "redux/stateDefs/workspaceState";

const getPriceIfApplies = (order: Order | undefined): number | undefined => {
  if (order === undefined) return undefined;
  if ((order.status & OrderStatus.SameBank) !== 0) return order.price as number;
  return undefined;
};

const isNonEmpty = (order: Order) =>
  order.price !== null && order.quantity !== null;

export const PriceColumn = (
  data: TOBColumnData,
  label: string,
  type: Type,
  action?: HeaderAction
): ColumnSpec => {
  return {
    name: `${type}-vol`,
    header: () => (
      <DualTableHeader
        label={label}
        action={action}
        disabled={!data.buttonsEnabled}
      />
    ),
    render: (row: RowType) => {
      const { [type]: order, depths } = row;
      const bid: Order | undefined = type === "ofr" ? row.bid : undefined;
      const ofr: Order | undefined = type === "bid" ? row.ofr : undefined;
      const status: OrderStatus =
        getChevronStatus(depths, order.tenor, order.type) | order.status;
      return (
        <TOBPrice
          depths={depths}
          order={{ ...order, status }}
          min={getPriceIfApplies(bid)}
          max={getPriceIfApplies(ofr)}
          readOnly={data.isBroker && data.personality === STRM}
          onChange={data.onOrderModified}
          onTabbedOut={data.onTabbedOut}
          onDoubleClick={isNonEmpty(order) ? data.onDoubleClick : undefined}
          onError={data.onOrderError}
        />
      );
    },
    template: "999999.999",
    weight: 7
  };
};
