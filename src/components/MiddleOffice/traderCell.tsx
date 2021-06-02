import { CellProps } from "components/MiddleOffice/DealBlotter/props";
import { BankCell } from "components/MiddleOffice/types/cells/banks";
import {
  MiddleOfficeStore,
  MiddleOfficeStoreContext,
} from "mobx/stores/middleOfficeStore";
import React, { ReactElement } from "react";
import { BankEntity } from "types/bankEntity";
import { resolveBankToEntity } from "utils/dealUtils";

export const BuyerCell: React.FC<CellProps> = (
  props: CellProps
): ReactElement => {
  const { deal } = props;
  const store = React.useContext<MiddleOfficeStore>(MiddleOfficeStoreContext);
  if (deal === null) {
    return <BankCell deal={deal} />;
  } else {
    const entityName: string = resolveBankToEntity(deal.buyer, store.entities);
    const entity: BankEntity = store.entitiesMap[entityName];
    return <span>{entity !== undefined ? entity.id : deal.buyer}</span>;
  }
};
