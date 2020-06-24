import React, { ReactElement } from "react";
import { ColumnSpec } from "components/Table/columnSpecification";
import { Deal } from "components/MiddleOffice/DealBlotter/deal";
import { compareCurrencyPairs } from "columns/messageBlotterColumns/utils";

export default (sortable: boolean): ColumnSpec => ({
  name: "Currency",
  template: "  XXXXXX  ",
  filterable: true,
  sortable: sortable,
  header: () => "Currency",
  render: ({ deal }: { deal: Deal }): ReactElement | null => {
    if (deal === null) return null;
    return <span>{deal.currencyPair}</span>;
  },
  width: 3,
  filterByKeyword: (v1: Deal, keyword: string): boolean => {
    const original: string = v1.currencyPair;
    if (!original) return false;
    const value = original.toLowerCase();
    return value.includes(keyword);
  },
  difference: (v1: Deal, v2: Deal): number => {
    return compareCurrencyPairs(v1.currencyPair, v2.currencyPair);
  },
});
