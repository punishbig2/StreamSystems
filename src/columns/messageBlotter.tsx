import { CellProps } from "columns/messageBlotterColumns/cellProps";
import { involved } from "columns/messageBlotterColumns/helpers";
import { compareCurrencyPairs } from "columns/messageBlotterColumns/utils";
import { TableColumn } from "components/Table/tableColumn";
import { Globals } from "golbals";
import moment, { Moment } from "moment";
import React, { ReactElement } from "react";
import { Message } from "types/message";
import { Role } from "types/role";
import { User } from "types/user";
import { DarkPool } from "types/w";
import {
  getMessagePrice,
  getMessageSize,
  TransTypes,
} from "utils/messageUtils";
import { priceFormatter } from "utils/priceFormatter";
import { tenorToNumber } from "utils/tenorUtils";
import {
  DateFormatter,
  FIX_DATE_FORMAT,
  parseTime,
  TimeFormatter,
} from "utils/timeUtils";
import workareaStore from "mobx/stores/workareaStore";

export enum BlotterTypes {
  None,
  Executions,
  Regular,
}

const tenor = (sortable: boolean): TableColumn => ({
  name: "Tenor",
  template: "XXXXX",
  filterable: true,
  sortable: sortable,
  header: () => "Tenor",
  render: ({ message: { Tenor } }: CellProps) => Tenor,
  width: 2,
  filterByKeyword: (v1: Message, keyword: string): boolean => {
    const original: string = v1.Tenor;
    const value = original.toLowerCase();
    return value.startsWith(keyword);
  },
  difference: (v1: Message, v2: Message): number => {
    return tenorToNumber(v1.Tenor) - tenorToNumber(v2.Tenor);
  },
});

const symbol = (sortable: boolean): TableColumn => ({
  name: "Currency",
  template: "  XXXXXX  ",
  filterable: true,
  sortable: sortable,
  header: () => "Currency",
  render: ({ message }: { message: Message }): ReactElement => (
    <span>{message.Symbol}</span>
  ),
  width: 2,
  filterByKeyword: (v1: Message, keyword: string): boolean => {
    const original: string = v1.Symbol;
    if (!original) return false;
    const value = original.toLowerCase();
    return value.includes(keyword.toLowerCase());
  },
  difference: (v1: Message, v2: Message): number => {
    return compareCurrencyPairs(v1.Symbol, v2.Symbol);
  },
});

const strategy = (sortable: boolean): TableColumn => ({
  name: "Strategy",
  template: "WWWWWW",
  filterable: true,
  sortable: sortable,
  header: () => "Strategy",
  render: ({ message }: CellProps): ReactElement => (
    <span>{message.Strategy}</span>
  ),
  width: 2,
  filterByKeyword: (v1: Message, keyword: string): boolean => {
    const original: string = v1.Strategy;
    const value = original.toLowerCase();
    return value.includes(keyword.toLowerCase());
  },
  difference: (v1: Message, v2: Message) => {
    const s1: string = v1.Strategy;
    return s1.localeCompare(v2.Strategy);
  },
});

const trader = (sortable: boolean): TableColumn => ({
  name: "Trader",
  template: "some_trader@email.com",
  filterable: true,
  sortable: sortable,
  header: () => "Trader",
  render: ({ message }: CellProps): ReactElement => {
    const email = message.ContraTrader
      ? message.ContraTrader
      : message.Username;
    if (email === undefined) {
      return <span />;
    }
    const user: User = workareaStore.findUserByEmail(email);
    return (
      <span>
        {user.firstname} {user.lastname}
      </span>
    );
  },
  width: 5,
  filterByKeyword: (v1: Message, keyword: string): boolean => {
    const value: number = Number(v1.Price);
    const numeric: number = Number(keyword);
    if (isNaN(numeric)) return false;
    return priceFormatter(value) === priceFormatter(numeric);
  },
  difference: (v1: Message, v2: Message) => {
    return Number(v1.Price) - Number(v2.Price);
  },
});

const price = (sortable: boolean): TableColumn => ({
  name: "Price",
  template: "999999.99",
  filterable: true,
  sortable: sortable,
  header: () => "Level",
  render: (props: CellProps): ReactElement => (
    <span>{priceFormatter(getMessagePrice(props.message))}</span>
  ),
  width: 2,
  filterByKeyword: (v1: Message, keyword: string): boolean => {
    const value: number = Number(v1.Price);
    const numeric: number = Number(keyword);
    if (isNaN(numeric)) return false;
    return priceFormatter(value) === priceFormatter(numeric);
  },
  difference: (v1: Message, v2: Message) => {
    return Number(v1.Price) - Number(v2.Price);
  },
});

const getSide = (message: Message): "Buy" | "Sell" => {
  return message.Side === "1" ? "Buy" : "Sell";
};

const side = (sortable: boolean, flip = false): TableColumn => ({
  name: "Side",
  template: "SELL",
  filterable: true,
  sortable: sortable,
  header: () => "Side",
  render: (props: CellProps) => {
    const { message } = props;
    const { roles } = workareaStore.user;
    if (!involved(message) && !roles.includes(Role.Broker)) return <div />;
    return getSide(message);
  },
  width: 2,
  filterByKeyword: (v1: Message, keyword: string): boolean => {
    return getSide(v1).includes(keyword.toLowerCase());
  },
  difference: (v1: Message, v2: Message): number => {
    return getSide(v1).localeCompare(getSide(v2));
  },
});

const size = (sortable: boolean): TableColumn => ({
  name: "Size",
  template: "999999",
  filterable: true,
  sortable: sortable,
  header: () => "Size",
  render: (props: CellProps): ReactElement => (
    <span>{getMessageSize(props.message)}</span>
  ),
  width: 2,
  filterByKeyword: (v1: Message, keyword: string): boolean => {
    const value: number = getMessageSize(v1);
    const numeric: number = Number(keyword);
    if (isNaN(numeric)) return false;
    return value === numeric;
  },
  difference: (v1: Message, v2: Message) => {
    return getMessageSize(v1) - getMessageSize(v2);
  },
});

const transactTime = (): TableColumn => ({
  name: "TransactTime",
  template: "MM/DD/YYYY 00:00:00 pm",
  header: () => "Time",
  filterable: true,
  sortable: true,
  render: (props: CellProps): ReactElement | string => {
    const { message } = props;
    const date: Date = parseTime(message.TransactTime, Globals.timezone);
    return (
      <div className={"date-time-cell"}>
        <span className={"date"}>{DateFormatter.format(date)}</span>
        <span className={"time"}>{TimeFormatter.format(date)}</span>
      </div>
    );
  },
  width: 4,
  difference: (v1: Message, v2: Message): number => {
    const m1: Moment = moment(v1.TransactTime, FIX_DATE_FORMAT);
    const m2: Moment = moment(v2.TransactTime, FIX_DATE_FORMAT);
    return m1.diff(m2);
  },
  filterByKeyword: (v1: Message, keyword: string): boolean => {
    const original: string = v1.TransactTime;
    if (!original) return false;
    const value: string = origin.toLowerCase();
    return value.includes(keyword.toLowerCase());
  },
});

const transactType = (sortable: boolean) => ({
  name: "ExecTransType",
  template: "Long String to Fit the content",
  header: () => "Type",
  filterable: true,
  sortable: sortable,
  render: (props: CellProps) => {
    const { message: data } = props;
    if (TransTypes[data.OrdStatus]) {
      return TransTypes[data.OrdStatus];
    } else {
      return data.OrdStatus;
    }
  },
  width: 3,
  difference: (v1: Message, v2: Message): number => {
    return Number(v1.OrdStatus) - Number(v2.OrdStatus);
  },
  filterByKeyword: (v1: Message, keyword: string): boolean => {
    const original: string = TransTypes[v1.OrdStatus];
    if (!original) return false;
    const value = original.toLowerCase();
    return value.includes(keyword.toLowerCase());
  },
});

const counterParty = (
  sortable: boolean,
  isExecBlotter: boolean
): TableColumn => ({
  name: "CPTY",
  template: "WWWWWW",
  filterable: true,
  sortable: sortable,
  header: () => "CPTY",
  render: (props: CellProps) => {
    const { message } = props;
    const { ExecBroker, MDMkt } = message;
    const { user } = workareaStore;
    if (!involved(message) && !user.roles.includes(Role.Broker)) return <div />;
    return (
      <div className={"normal cpty " + (isExecBlotter ? "exec-blotter" : "")}>
        {user.firm === ExecBroker ? MDMkt : ExecBroker}
      </div>
    );
  },
  width: 2,
  filterByKeyword: ({ ExecBroker }: Message, keyword: string): boolean => {
    if (ExecBroker) {
      const lowerCase: string = ExecBroker.toLowerCase();
      return lowerCase.includes(keyword.toLowerCase());
    } else {
      return false;
    }
  },
  difference: ({ ExecBroker }: Message, v2: Message) => {
    if (ExecBroker) {
      const lowerCase: string = ExecBroker.toLowerCase();
      if (v2.ExecBroker) {
        return lowerCase.localeCompare(v2.ExecBroker.toLowerCase());
      } else {
        return -1;
      }
    } else {
      return 1;
    }
  },
});

const pool = (sortable: boolean): TableColumn => ({
  name: "pool",
  difference: function (p1: any, p2: any) {
    return 0;
  },
  filterByKeyword: function (p1: any, p2: string) {
    return false;
  },
  header: () => "Venue",
  render: (props: CellProps) => {
    const { ExDestination } = props.message;
    return (
      <div className={"message-blotter-cell normal"}>
        {ExDestination === DarkPool ? "Dark Pool" : "Electronic"}&nbsp;
      </div>
    );
  },
  filterable: true,
  sortable: sortable,
  template: "MAKE_IT_WIDE_AND_WIDER",
  width: 3,
});

const columns: (type: BlotterTypes) => { [key: string]: TableColumn[] } = (
  type: BlotterTypes
) => {
  const notExecutionsBlotter: boolean = type !== BlotterTypes.Executions;
  return {
    normal: [
      ...(notExecutionsBlotter ? [transactType(true)] : []),
      transactTime(),
      symbol(notExecutionsBlotter),
      tenor(notExecutionsBlotter),
      strategy(notExecutionsBlotter),
      price(notExecutionsBlotter),
      side(notExecutionsBlotter),
      size(notExecutionsBlotter),
      counterParty(notExecutionsBlotter, !notExecutionsBlotter),
      pool(notExecutionsBlotter),
    ],
    broker: [
      transactTime(),
      ...(notExecutionsBlotter ? [transactType(true)] : []),
      size(notExecutionsBlotter),
      symbol(notExecutionsBlotter),
      tenor(notExecutionsBlotter),
      strategy(notExecutionsBlotter),
      price(notExecutionsBlotter),
      side(notExecutionsBlotter),
      counterParty(notExecutionsBlotter, !notExecutionsBlotter),
      trader(notExecutionsBlotter),
      pool(notExecutionsBlotter),
    ],
  };
};

export default columns;
