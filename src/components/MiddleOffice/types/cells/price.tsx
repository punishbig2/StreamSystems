import { CellProps } from "components/MiddleOffice/DealBlotter/props";
import { Deal } from "components/MiddleOffice/types/deal";
import React, { ReactElement } from "react";
import { priceFormatter } from "utils/priceFormatter";

export const getDealPrice = (deal: Deal): number | null => {
  if (deal.vol !== undefined && deal.vol !== null) return 100 * deal.vol;
  if (deal.spread !== undefined && deal.spread !== null)
    return 100 * deal.spread;
  return deal.price;
};

export const PriceCell: React.FC<CellProps> = (
  props: CellProps
): ReactElement => {
  const { deal } = props;
  if (deal) {
    return <div>{priceFormatter(getDealPrice(deal))}</div>;
  } else {
    return <div />;
  }
};
