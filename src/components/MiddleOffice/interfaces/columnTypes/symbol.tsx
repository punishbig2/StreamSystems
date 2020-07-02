import React, { ReactElement } from "react";
import { ColumnSpec } from "components/Table/columnSpecification";
import { Deal } from "components/MiddleOffice/interfaces/deal";
import { compareCurrencyPairs } from "columns/messageBlotterColumns/utils";
import { SymbolCell } from "../cells/symbol";
import { CellProps } from "components/MiddleOffice/DealBlotter/props";

export default (sortable: boolean): ColumnSpec => ({
  name: "Currency",
  template: "  XXXXXX  ",
  filterable: true,
  sortable: sortable,
  header: () => "Currency",
  render: (props: CellProps): ReactElement | null => {
    const { deal } = props;
    if (deal === null) {
      return <SymbolCell deal={deal}/>;
    }
    return <span>{deal.currencyPair}</span>;
  },
  width: 3,
  filterByKeyword: (v1: Deal, keyword: string): boolean => {
    const original: string = v1.currencyPair;
    if (!original) return false;
    const value = original.toLowerCase();
    return value.includes(keyword.toLowerCase());
  },
  difference: (v1: Deal, v2: Deal): number => {
    return compareCurrencyPairs(v1.currencyPair, v2.currencyPair);
  },
});
