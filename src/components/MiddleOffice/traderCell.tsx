import { CellProps } from "components/MiddleOffice/DealBlotter/props";
import { BankCell } from "components/MiddleOffice/types/cells/banks";
import {
  MiddleOfficeStore,
  MiddleOfficeStoreContext,
} from "mobx/stores/middleOfficeStore";
import React, { ReactElement } from "react";
import { BankEntity } from "types/bankEntity";
import { resolveBankToEntity } from "utils/dealUtils";

interface Props extends CellProps {
  readonly side: "buyer" | "seller";
}

export const TraderCell: React.FC<Props> = (props: Props): ReactElement => {
  const { deal } = props;
  const store = React.useContext<MiddleOfficeStore>(MiddleOfficeStoreContext);
  if (deal === null) {
    return <BankCell deal={deal} />;
  } else {
    const entityName: string = resolveBankToEntity(
      deal[props.side],
      store.entities
    );
    const entity: BankEntity = store.entitiesMap[entityName];
    return <span>{entity !== undefined ? entity.id : deal[props.side]}</span>;
  }
};
