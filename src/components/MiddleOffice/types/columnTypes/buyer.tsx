import { CellProps } from "components/MiddleOffice/DealBlotter/props";
import { TraderCell } from "components/MiddleOffice/traderCell";
import { Deal } from "components/MiddleOffice/types/deal";
import { TableColumn } from "components/Table/tableColumn";
import React from "react";

export default (sortable: boolean): TableColumn => ({
  name: "buyer",
  difference: (m1: Deal, m2: Deal) => {
    const s1: string | null = m1.buyer;
    const s2: string | null = m2.buyer;
    if (s1 === null) return Number.MIN_SAFE_INTEGER;
    if (s2 === null) return Number.MAX_SAFE_INTEGER;
    return s1.localeCompare(s2);
  },
  filterByKeyword: (deal: Deal, keyword: string) => {
    const buyer: string | null = deal.buyer;
    if (buyer === null) return false;
    const lowerCaseBuyer: string = buyer.toLowerCase();
    return lowerCaseBuyer.includes(keyword.toLowerCase());
  },
  header: () => "Buyer",
  render: (props: CellProps): React.ReactElement => (
    <TraderCell side="buyer" {...props} />
  ),
  filterable: true,
  sortable: sortable,
  template: "BUYER",
  width: 2,
});
