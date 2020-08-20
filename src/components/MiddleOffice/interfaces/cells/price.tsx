import React, { ReactElement } from "react";
import { observer } from "mobx-react";
import { CellProps } from "components/MiddleOffice/DealBlotter/props";
import { priceFormatter } from "utils/priceFormatter";

export const PriceCell: React.FC<CellProps> = observer(
  (props: CellProps): ReactElement => {
    const { deal } = props;
    if (deal) {
      return <div>{priceFormatter(deal.price)}</div>;
    } else {
      return <div />;
    }
  }
);
