import { CellProps } from "components/MiddleOffice/DealBlotter/props";
import { TraderCell } from "components/MiddleOffice/traderCell";
import { Deal } from "components/MiddleOffice/types/deal";
import { TableColumn } from "components/Table/tableColumn";
import React from "react";

export default (sortable: boolean): TableColumn => ({
  name: "seller",
  difference: (m1: Deal, m2: Deal) => {
    const s1: string | null = m1.seller;
    const s2: string | null = m2.seller;
    if (s1 === null) return Number.MIN_SAFE_INTEGER;
    if (s2 === null) return Number.MAX_SAFE_INTEGER;
    return s1.localeCompare(s2);
  },
  filterByKeyword: (deal: Deal, keyword: string) => {
    const seller: string | null = deal.seller;
    if (seller === null) return false;
    const lowerCaseSeller: string = seller.toLowerCase();
    return lowerCaseSeller.includes(keyword.toLowerCase());
  },
  header: () => "Seller",
  render: (props: CellProps): React.ReactElement => (
    <TraderCell side={"seller"} {...props} />
  ),
  filterable: true,
  sortable: sortable,
  template: "BUYER",
  width: 2,
});
