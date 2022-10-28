import { PodTableType } from "columns/podColumns/OrderColumn";
import { getOrderStatus } from "columns/podColumns/OrderColumn/helpers/getOrderStatus";
import { getOrderStatusClass } from "components/Table/CellRenderers/Price/utils/getOrderStatusClass";
import { OrderStore } from "mobx/stores/orderStore";
import workareaStore from "mobx/stores/workareaStore";
import React, { ReactNode, useMemo } from "react";
import { OrderTypes } from "types/mdEntry";
import { Order, OrderStatus } from "types/order";
import { hasRole, Role } from "types/role";
import { User } from "types/user";
import { priceFormatter } from "utils/priceFormatter";

interface Props {
  readonly rows?: Order[];
  readonly type?: OrderTypes;
  readonly orderStore: OrderStore;
}

export const MiniDOB: React.FC<Props> = (props: Props) => {
  const user: User = workareaStore.user;
  const { rows, orderStore } = props;
  const isBroker: boolean = useMemo((): boolean => {
    const { roles } = user;
    return hasRole(roles, Role.Broker);
  }, [user]);
  if (!rows) return null;
  const children = rows.map((order: Order, index: number) => {
    const { price, size, firm } = order;
    const status: OrderStatus = getOrderStatus(
      order,
      orderStore.depth,
      PodTableType.Dob
    );
    const priceElement: ReactNode = (() => {
      return (
        <div className={getOrderStatusClass(status, "mini-price")} key={1}>
          {priceFormatter(price)}
        </div>
      );
    })();
    const elements: ReactNode[] = [priceElement];
    const sizeElement = (
      <div className={getOrderStatusClass(status, "mini-size")} key={2}>
        {size}
      </div>
    );

    if (props.type === OrderTypes.Bid) {
      elements.unshift(sizeElement);
      if (isBroker) {
        elements.unshift(
          <div key={3} className="mini-firm">
            {firm}
          </div>
        );
      }
    } else {
      elements.push(sizeElement);
      if (isBroker) {
        elements.push(
          <div key={3} className="mini-firm">
            {firm}
          </div>
        );
      }
    }
    return (
      <div className="row" key={index}>
        {elements}
      </div>
    );
  });
  return (
    <>
      <div className="mini-dob">{children}</div>
    </>
  );
};
