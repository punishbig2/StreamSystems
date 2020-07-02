import React, { ReactElement } from "react";
import { ColumnSpec } from "components/Table/columnSpecification";
import { CellProps } from "components/MiddleOffice/DealBlotter/props";
import { SizeCell } from "components/MiddleOffice/interfaces/cells/size";
import { Deal } from "components/MiddleOffice/interfaces/deal";

export default (sortable: boolean): ColumnSpec => ({
  name: "Size",
  template: "999999",
  filterable: true,
  sortable: sortable,
  header: () => "Size",
  render: (props: CellProps): ReactElement => <SizeCell {...props} />,
  width: 3,
  filterByKeyword: (v1: Deal, keyword: string): boolean => {
    const value: number = v1.lastQuantity;
    const numeric: number = Number(keyword);
    if (isNaN(numeric)) return false;
    return value === numeric;
  },
  difference: (v1: Deal, v2: Deal) => {
    return Number(v1.lastQuantity) - Number(v2.lastQuantity);
  },
});
