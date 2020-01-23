import { getOrderStatusClass } from "components/Table/CellRenderers/Price/utils/getOrderStatusClass";
import { OrderTypes } from "interfaces/mdEntry";
import { Order } from "interfaces/order";
import React, { ReactNode } from "react";
import { priceFormatter } from "utils/priceFormatter";

interface Props {
  type?: OrderTypes;
  rows?: Order[];
}

export const MiniDOB: React.FC<Props> = (props: Props) => {
  const { rows } = props;
  if (!rows) return null;
  const children = rows.map(
    ({ price, quantity, status }: Order, index: number) => {
      const priceElement: ReactNode = (() => {
        return (
          <div className={getOrderStatusClass(status, "mini-price")} key={1}>
            {priceFormatter(price)}
          </div>
        );
      })();
      const elements: ReactNode[] = [priceElement];
      const sizeElement = (
        <div className={"mini-size"} key={2}>
          {quantity}
        </div>
      );
      if (props.type === OrderTypes.Bid) elements.unshift(sizeElement);
      else elements.push(sizeElement);
      return (
        <div className={"row"} key={index}>
          {elements}
        </div>
      );
    }
  );
  return (
    <>
      <div className={"mini-dob"}>{children}</div>
    </>
  );
};
