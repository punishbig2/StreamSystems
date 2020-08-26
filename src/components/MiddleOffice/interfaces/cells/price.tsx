import { CellProps } from "components/MiddleOffice/DealBlotter/props";
import { observer } from "mobx-react";
import React, { ReactElement } from "react";

export const PriceCell: React.FC<CellProps> = observer(
  (props: CellProps): ReactElement => {
    const { deal } = props;
    if (deal) {
      return <div />;
    } else {
      return <div />;
    }
  }
);
