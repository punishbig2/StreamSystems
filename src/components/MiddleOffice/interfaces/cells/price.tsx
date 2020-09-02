import { CellProps } from "components/MiddleOffice/DealBlotter/props";
import { Deal } from "components/MiddleOffice/interfaces/deal";
import { observer } from "mobx-react";
import React, { ReactElement } from "react";

export const getDealPrice = (deal: Deal): number | null => {
  if (deal.vol !== undefined && deal.vol !== null) return deal.vol;
  if (deal.spread !== undefined && deal.spread !== null) return deal.spread;
  return null;
};

export const PriceCell: React.FC<CellProps> = observer(
  (props: CellProps): ReactElement => {
    const { deal } = props;
    if (deal) {
      return <div>{getDealPrice(deal)}</div>;
    } else {
      return <div />;
    }
  }
);
