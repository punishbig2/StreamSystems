import React, { ReactElement } from "react";
import { observer } from "mobx-react";
import { CellProps } from "components/MiddleOffice/DealBlotter/props";
import { priceFormatter } from "utils/priceFormatter";
import { Price } from "components/Table/CellRenderers/Price";
import { ArrowDirection } from "interfaces/w";
import { OrderStatus } from "interfaces/order";

export const PriceCell: React.FC<CellProps> = observer(
  (props: CellProps): ReactElement => {
    const { store, deal } = props;
    const onSubmit = (
      input: HTMLInputElement,
      value: number | null,
      changed: boolean
    ) => {
      if (changed) {
        store.setPrice(value);
      }
    };
    if (deal) {
      return <div>{priceFormatter(deal.lastPrice)}</div>;
    } else {
      return (
        <Price
          arrow={ArrowDirection.None}
          value={store.price}
          status={OrderStatus.None}
          onSubmit={onSubmit}
        />
      );
    }
  }
);
