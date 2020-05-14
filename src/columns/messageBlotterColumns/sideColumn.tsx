import React from "react";
import { Message } from "interfaces/message";
import { ColumnSpec } from "components/Table/columnSpecification";
import { involved } from "columns/messageBlotterColumns/helpers";
import { CellProps } from "./cellProps";

export default (sortable: boolean): ColumnSpec => ({
  name: "Side",
  template: "SELL",
  filterable: true,
  sortable: sortable,
  header: () => "Side",
  render: (props: CellProps) => {
    const { message } = props;
    const { Side } = message;
    if (!involved(message)) return <div />;
    return Side === "1" ? "Buy" : "Sell";
  },
  width: 2,
  filterByKeyword: (v1: Message, keyword: string): boolean => {
    const value: string = v1.Side === "1" ? "buy" : "sell";
    return value.includes(keyword);
  },
  difference: (v1: Message, v2: Message): number => {
    return Number(v1.Side) - Number(v2.Side);
  },
});
