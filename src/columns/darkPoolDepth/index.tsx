import React from "react";
import { ColumnSpec } from "components/Table/columnSpecification";
import { Order } from "types/order";
import { xPoints } from "timesPolygon";
import { OrderTypes } from "types/mdEntry";
import workareaStore from "../../mobx/stores/workareaStore";
import { User } from "../../types/user";

const getSide = (order: Order): string => {
  if (order.type === OrderTypes.Ofr) return "Sell";
  return "Buy";
};

const columns = (onCancelOrder: (order: Order) => void): ColumnSpec[] => [
  {
    name: "ref",
    header: () => "REF",
    render: (order: Order) => {
      const classes: string[] = ["times"];
      const user: User = workareaStore.user;
      const personality: string = workareaStore.personality;
      if (
        order.user === user.email ||
        (user.isbroker && personality === user.firm)
      )
        classes.push("clickable");
      return (
        <div
          key={2}
          className={classes.join(" ")}
          onClick={() => onCancelOrder(order)}
        >
          <svg viewBox={"0 0 612 792"}>
            <g>
              <polygon className={"st0"} points={xPoints} />
            </g>
          </svg>
        </div>
      );
    },
    width: 1,
    template: "XXXX",
  },
  {
    name: "side",
    header: () => "Side",
    render: (order: Order) => {
      const side: string = getSide(order);
      const classes: string[] = [side.toLowerCase(), "cell"];
      const user: User = workareaStore.user;
      if (order.firm === user.firm) classes.push("same-bank");
      if (order.user === user.email) classes.push("owned");
      return <div className={classes.join(" ")}>{side}</div>;
    },
    width: 2,
    template: "9999999.99",
  },
  {
    name: "size",
    header: () => "Qty",
    render: (order: Order) => {
      const side: string = getSide(order);
      const classes: string[] = [side.toLowerCase(), "cell"];
      const user: User = workareaStore.user;
      if (order.firm === user.firm) classes.push("same-bank");
      if (order.user === user.email) classes.push("owned");
      return <div className={classes.join(" ")}>{order.size}</div>;
    },
    width: 2,
    template: "99999.99",
  },
];

export default columns;
