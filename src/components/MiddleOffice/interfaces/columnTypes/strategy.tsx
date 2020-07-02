import React, { ReactElement } from "react";
import { ColumnSpec } from "components/Table/columnSpecification";
import { StrategyCell } from "components/MiddleOffice/interfaces/cells/strategy";
import { CellProps } from "components/MiddleOffice/DealBlotter/props";
import { Deal } from "components/MiddleOffice/interfaces/deal";

export default (sortable: boolean, width: number = 3): ColumnSpec => ({
  name: "Strategy",
  template: "WWWWWW",
  filterable: true,
  sortable: sortable,
  header: () => "Strategy",
  render: (props: CellProps): ReactElement => <StrategyCell {...props} />,
  width: width,
  filterByKeyword: (v1: Deal, keyword: string): boolean => {
    const original: string = v1.strategy;
    const value = original.toLowerCase();
    return value.includes(keyword.toLowerCase());
  },
  difference: (v1: Deal, v2: Deal) => {
    const s1: string = v1.strategy;
    return s1.localeCompare(v2.strategy);
  },
});
