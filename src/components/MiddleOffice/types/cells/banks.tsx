import React, { ReactElement } from "react";
import { CellProps } from "components/MiddleOffice/DealBlotter/props";

export const BankCell: React.FC<CellProps> = (
  props: CellProps
): ReactElement | null => {
  const { deal } = props;
  if (deal) {
    return null;
  } else {
    return <div />;
  }
};
