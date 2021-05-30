import moStore from "mobx/stores/moStore";
import React, { ReactElement } from "react";
import { TableColumn } from "components/Table/tableColumn";
import { BankEntity } from "types/bankEntity";
import { resolveBankToEntity } from "utils/dealUtils";
import { BankCell } from "../cells/banks";
import { CellProps } from "components/MiddleOffice/DealBlotter/props";
import { Deal } from "components/MiddleOffice/types/deal";

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
  render: (props: CellProps): ReactElement | string | null => {
    const { deal } = props;
    if (deal === null) {
      return <BankCell deal={deal} />;
    } else {
      const entityName: string = resolveBankToEntity(deal.seller);
      const entity: BankEntity = moStore.entitiesMap[entityName];
      return <span>{entity !== undefined ? entity.id : deal.seller}</span>;
    }
  },
  filterable: true,
  sortable: sortable,
  template: "BUYER",
  width: 2,
});
