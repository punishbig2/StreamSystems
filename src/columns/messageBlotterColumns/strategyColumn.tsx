import React, { ReactElement } from "react";
import { Message } from "interfaces/message";
import { ColumnSpec } from "components/Table/columnSpecification";
import { StrategyCell } from "./strategyCell";
import { CellProps } from "./cellProps";

export default (sortable: boolean): ColumnSpec => ({
  name: "Strategy",
  template: "WWWWWW",
  filterable: true,
  sortable: sortable,
  header: () => "Strategy",
  render: (props: CellProps): ReactElement => <StrategyCell {...props} />,
  width: 3,
  filterByKeyword: (v1: Message, keyword: string): boolean => {
    const original: string = v1.Strategy;
    const value = original.toLowerCase();
    return value.includes(keyword);
  },
  difference: (v1: Message, v2: Message) => {
    const s1: string = v1.Strategy;
    return s1.localeCompare(v2.Strategy);
  },
});
