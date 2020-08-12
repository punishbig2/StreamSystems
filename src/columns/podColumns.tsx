import React, { ReactElement } from "react";
import { ColumnSpec } from "components/Table/columnSpecification";
import strings from "locales";
import { OrderColumnWrapper } from "columns/podColumns/orderColumnWrapper";
import { TenorColumn } from "columns/podColumns/tenorColumn";
import { FirmColumn } from "columns/podColumns/firmColumn";
import { DarkPoolColumn } from "columns/podColumns/darkPoolColumn";
import { OrderTypes } from "types/mdEntry";
import { API } from "API";
import { getSideFromType } from "utils";
import { User } from "types/user";
import workareaStore from "mobx/stores/workareaStore";

interface RefButtonProps {
  readonly type: OrderTypes;
  readonly strategy: string;
  readonly currency: string;
}

const RefButton: React.FC<RefButtonProps> = (props: RefButtonProps) => {
  const labels: { [key: string]: string } = {
    [OrderTypes.Bid]: strings.RefBids,
    [OrderTypes.Ofr]: strings.RefOfrs,
  };
  const isDisabled: boolean = props.currency === "" || props.strategy === "";
  return (
    <div className={"button-container"}>
      <button
        onClick={cancelAll(props.type, props.currency, props.strategy)}
        disabled={isDisabled}
      >
        {labels[props.type]}
      </button>
    </div>
  );
};

const cancelAll = (
  type: OrderTypes,
  symbol: string,
  strategy: string
) => () => {
  const user: User = workareaStore.user;
  if (user.isbroker) {
    API.cancelAllExtended(symbol, strategy, getSideFromType(type));
  } else {
    API.cancelAll(symbol, strategy, getSideFromType(type));
  }
};

const getRefButton = (
  depth: boolean,
  currency: string,
  strategy: string,
  type: OrderTypes
): (() => ReactElement | null) => {
  if (depth) return () => null;
  return () => (
    <RefButton type={type} currency={currency} strategy={strategy} />
  );
};

const columns = (
  currency: string,
  strategy: string,
  depth: boolean = false
): ColumnSpec[] => {
  const user: User = workareaStore.user;
  return [
    TenorColumn(),
    ...(user.isbroker ? [FirmColumn(OrderTypes.Bid)] : []),
    OrderColumnWrapper(
      strings.BidPx,
      OrderTypes.Bid,
      depth,
      getRefButton(depth, currency, strategy, OrderTypes.Bid)
    ),
    DarkPoolColumn(),
    OrderColumnWrapper(
      strings.OfrPx,
      OrderTypes.Ofr,
      depth,
      getRefButton(depth, currency, strategy, OrderTypes.Ofr)
    ),
    ...(user.isbroker ? [FirmColumn(OrderTypes.Ofr)] : []),
  ];
};

export default columns;
