import { Typography } from "@material-ui/core";
import { TableColumn } from "components/Table/tableColumn";
import React from "react";
import { Role } from "types/role";
import { xPoints } from "utils/timesPolygon";
import { OrderTypes } from "types/mdEntry";
import { Order } from "types/order";
import { User } from "types/user";
import workareaStore from "mobx/stores/workareaStore";

const getSide = (order: Order): string => {
  if (order.type === OrderTypes.Ofr) return "Sell";
  return "Buy";
};

const columns = (
  onCancelOrder: (order: Order) => void,
  showInstruction: boolean
): ReadonlyArray<TableColumn> => {
  return [
    {
      name: "ref",
      header: () => "REF",
      render: (order: Order) => {
        const classes: string[] = ["times"];
        const user: User = workareaStore.user;
        const personality: string = workareaStore.personality;
        const { roles } = user;
        const isBroker: boolean = roles.includes(Role.Broker);
        const clickable =
          order.user === user.email || (isBroker && personality === user.firm);

        if (clickable) classes.push("clickable");
        return (
          <div
            key={2}
            className={classes.join(" ")}
            onClick={clickable ? () => onCancelOrder(order) : undefined}
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
        return (
          <Typography className={classes.join(" ")}>{order.size}</Typography>
        );
      },
      width: 2,
      template: "99999.99",
    },
    ...(showInstruction
      ? [
          {
            name: "inst",
            header: () => "Inst",
            render: (order: Order) => {
              if (order.instruction === undefined)
                return <div className={"empty"}>None</div>;
              return <div>{order.instruction}</div>;
            },
            width: 2,
            template: "Inst",
          },
        ]
      : []),
  ];
};

export default columns;
