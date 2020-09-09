import { CellProps } from "components/MiddleOffice/DealBlotter/props";
import { Deal } from "components/MiddleOffice/types/deal";
import { observer } from "mobx-react";
import React, { ReactElement } from "react";
import { priceFormatter } from "utils/priceFormatter";

export const getDealPrice = (deal: Deal): number | null => {
  if (deal.vol !== undefined && deal.vol !== null) return 100 * deal.vol;
  if (deal.spread !== undefined && deal.spread !== null) return deal.spread;
  return null;
};

export const PriceCell: React.FC<CellProps> = observer(
  (props: CellProps): ReactElement => {
    const { deal } = props;
    if (deal) {
      return <div>{priceFormatter(getDealPrice(deal))}</div>;
    } else {
      return <div />;
    }
  }
);
