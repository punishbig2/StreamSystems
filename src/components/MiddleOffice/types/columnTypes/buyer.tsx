import moStore from "mobx/stores/moStore";
import React, { ReactElement } from "react";
import { ColumnSpec } from "components/Table/columnSpecification";
import { CellProps } from "components/MiddleOffice/DealBlotter/props";
import { Deal } from "components/MiddleOffice/types/deal";
import { BankCell } from "components/MiddleOffice/types/cells/banks";
import { BankEntity } from "types/bankEntity";
import { resolveBankToEntity } from "utils/dealUtils";

export default (sortable: boolean): ColumnSpec => ({
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
  render: (props: CellProps): ReactElement | string | null => {
    const { deal } = props;
    if (deal === null) {
      return <BankCell deal={deal} />;
    } else {
      const entityName: string = resolveBankToEntity(deal.buyer);
      const entity: BankEntity = moStore.entitiesMap[entityName];
      return <span>{entity !== undefined ? entity.id : deal.buyer}</span>;
    }
  },
  filterable: true,
  sortable: sortable,
  template: "BUYER",
  width: 2,
});
