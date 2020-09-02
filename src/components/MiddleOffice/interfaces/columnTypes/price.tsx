import React, { ReactElement } from "react";
import { priceFormatter } from "utils/priceFormatter";
import { ColumnSpec } from "components/Table/columnSpecification";
import { CellProps } from "components/MiddleOffice/DealBlotter/props";
import { getDealPrice, PriceCell } from "components/MiddleOffice/interfaces/cells/price";
import { Deal } from "components/MiddleOffice/interfaces/deal";

export default (sortable: boolean, width: number = 3): ColumnSpec => ({
  name: "Price",
  template: "999999.99",
  filterable: true,
  sortable: sortable,
  header: () => "Level",
  render: (props: CellProps): ReactElement => <PriceCell {...props} />,
  width: width,
  filterByKeyword: (v1: Deal, keyword: string): boolean => {
    // FIXME: should use the right one
    const value: number | null = getDealPrice(v1);
    if (value === null) return false;
    const numeric: number = Number(keyword);
    if (isNaN(numeric)) return false;
    return priceFormatter(value) === priceFormatter(numeric);
  },
  difference: (v1: Deal, v2: Deal) => {
    const p1: number | null = getDealPrice(v1);
    const p2: number | null = getDealPrice(v2);
    if (p1 === null) return -1;
    if (p2 === null) return 1;
    return p1 - p2;
  },
});
