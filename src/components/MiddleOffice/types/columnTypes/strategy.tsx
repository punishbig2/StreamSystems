import React, { ReactElement } from "react";
import { TableColumn } from "components/Table/tableColumn";
import { StrategyCell } from "components/MiddleOffice/types/cells/strategy";
import { CellProps } from "components/MiddleOffice/DealBlotter/props";
import { Deal } from "components/MiddleOffice/types/deal";

export default (sortable: boolean, width: number = 3): TableColumn => ({
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
