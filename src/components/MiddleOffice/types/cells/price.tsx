import { CellProps } from "components/MiddleOffice/DealBlotter/props";
import { Deal } from "components/MiddleOffice/types/deal";
import moStore from "mobx/stores/moStore";
import React, { ReactElement } from "react";
import { priceFormatter } from "utils/priceFormatter";

export const getDealPrice = (deal: Deal): number | null => {
  if (deal.vol !== undefined && deal.vol !== null) return 100 * deal.vol;
  if (deal.spread !== undefined && deal.spread !== null)
    return 100 * deal.spread;
  if (deal.id === "E0df7d194-81605707969") console.log(deal);
  if (deal.price === null || deal.price === undefined) {
    const { legs } = moStore;
    if (legs.length === 0) return null;
    if (legs[0].vol === undefined) return null;
    return legs[0].vol;
  }
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
