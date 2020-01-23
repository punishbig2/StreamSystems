import React from "react";
import { ColumnSpec } from "components/Table/columnSpecification";
import { Order, OrderStatus } from "interfaces/order";

const getSide = ({ bid }: any): string => {
  if (!bid) return "Sell";
  return bid.price !== null ? "Buy" : "Sell";
};

const columns = (onCancelOrder: (order: Order) => void): ColumnSpec[] => [
  {
    name: "ref",
    header: () => "REF",
    render: ({ bid, ofr }: any) => {
      const order: Order = !bid || bid.price === null ? ofr : bid;
      if ((order.status & OrderStatus.Owned) === 0) return null;
      return (
        <div onClick={() => onCancelOrder(order)} className={"ref"}>
          <i className={"fa fa-times"} />
        </div>
      );
    },
    weight: 1,
    template: "XXXXX"
  },
  {
    name: "side",
    header: () => "Side",
    render: (row: any) => {
      const side: string = getSide(row);
      return <div className={side.toLowerCase()}>{side}</div>;
    },
    weight: 3,
    template: "9999999999.99"
  },
  {
    name: "size",
    header: () => "Qty",
    render: (row: any) => {
      const { bid, ofr } = row;
      const order: Order = !bid || bid.price === null ? ofr : bid;
      const side: string = getSide(row);
      return <div className={side.toLowerCase()}>{order.quantity}</div>;
    },
    weight: 3,
    template: "9999999.99"
  }
];

export default columns;
