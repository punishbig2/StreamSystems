import { CellProps } from "components/MiddleOffice/DealBlotter/props";
import React, { ReactElement } from "react";

export const StrategyCell: React.FC<CellProps> = (
  props: CellProps
): ReactElement => {
  const { deal } = props;
  if (deal) {
    return <div>{deal.strategy}</div>;
  } else {
    return <div />;
  }
};
