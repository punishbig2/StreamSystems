import { MDEntry, OrderTypes } from "types/mdEntry";
import { Role } from "types/role";
import { Sides } from "types/sides";
import { User } from "types/user";
import { ArrowDirection, MessageTypes, W } from "types/w";
import { priceFormatter } from "utils/priceFormatter";
import { $$ } from "utils/stringPaster";

export interface CreateOrder {
  OrderID?: string;
  MsgType: MessageTypes;
  TransactTime: string;
  User: string;
  Symbol: string;
  Strategy: string;
  Tenor: string;
  Side: Sides;
  Quantity: string;
  Price: string;
  MDMkt?: string;
  Orders?: any[];
  CancelCondition?: number;
}

export interface CreateOrderBulk {
  MsgType: MessageTypes;
  TransactTime: string;
  User: string;
  Symbol: string;
  Strategy: string;
  MDMkt?: string;
  Orders?: any[];
}

export type DarkPoolOrder = CreateOrder & {
  ExecInst?: string;
};

export enum OrderStatus {
  None = 0,
  Active = 1 << 1,
  Cancelled = 1 << 2,
  PreFilled = 1 << 3,
  PriceEdited = 1 << 4,
  SizeEdited = 1 << 5,
  Owned = 1 << 6,
  NotOwned = 1 << 7,
  HasDepth = 1 << 8,
  HasMyOrder = 1 << 9,
  SameBank = 1 << 10,
  BeingCreated = 1 << 11,
  BeingCancelled = 1 << 12,
  BeingLoaded = 1 << 13,
  DarkPool = 1 << 14,
  FullDarkPool = 1 << 15,
  OwnedByBroker = 1 << 16,
  RunOrder = 1 << 17,
  Publishing = 1 << 18,
  Joined = 1 << 19,
  AtTop = 1 << 20,
  InDepth = 1 << 21,
  ActionError = 1 << 22,
  JustCreated = 1 << 23,
}

export interface OrderMessage {
  OrderID: string;
  Price: string;
  Tenor: string;
  Symbol: string;
  Strategy: string;
  Side: "1" | "2";
  OrderQty: string;
}

const getNumber = (value: string | null | undefined): number | null => {
  if (!value) return null;
  return Number(value);
};

const normalizeTickDirection = (
  source: string | undefined,
  orderType: OrderTypes
): ArrowDirection => {
  if (orderType === OrderTypes.Bid) {
    switch (source) {
      case "0":
        return ArrowDirection.Up;
      case "2":
        return ArrowDirection.Down;
      default:
        return ArrowDirection.None;
    }
  } else {
    switch (source) {
      case "0":
        return ArrowDirection.Down;
      case "2":
        return ArrowDirection.Up;
      default:
        return ArrowDirection.None;
    }
  }
};

export class Order {
  public firm: string | undefined;
  public orderId: string | undefined;
  public price: number | null;
  public size: number | null;
  public status: OrderStatus;
  public strategy: string;
  public symbol: string;
  public tenor: string;
  public type: OrderTypes;
  public user: string;
  public arrowDirection: ArrowDirection;
  public timestamp: number;
  public instruction: string | undefined = undefined;

  constructor(
    tenor: string,
    currency: string,
    strategy: string,
    user: string,
    size: number | null,
    type: OrderTypes
  ) {
    this.type = type;
    this.tenor = tenor;
    this.symbol = currency;
    this.strategy = strategy;
    this.user = user;
    this.price = null;
    this.size = size;
    this.arrowDirection = ArrowDirection.None;
    this.status = OrderStatus.None;
    this.timestamp = Math.floor(Date.now() / 1000);
  }

  public static fromOrderMessage = (
    entry: OrderMessage,
    email: string,
    defaultBidSize: number | null = null,
    defaultOfrSize: number | null = null
  ): Order => {
    const type: OrderTypes =
      entry.Side === "1" ? OrderTypes.Bid : OrderTypes.Ofr;
    const size = ((): number | null => {
      const fromMessage = Number(entry.OrderQty);
      if (
        isNaN(fromMessage) ||
        priceFormatter(fromMessage) === priceFormatter(0)
      ) {
        return type === OrderTypes.Bid ? defaultBidSize : defaultOfrSize;
      }
      return fromMessage;
    })();
    const order: Order = new Order(
      entry.Tenor,
      entry.Symbol,
      entry.Strategy,
      email,
      size,
      type
    );
    // Update the price
    order.price = Number(entry.Price);
    order.status =
      OrderStatus.Cancelled | OrderStatus.PreFilled | OrderStatus.RunOrder;
    // Return the newly built order
    return order;
  };

  public static fromWAndMDEntry = (w: W, entry: MDEntry, user: User): Order => {
    const price: number | null = getNumber(entry.MDEntryPx);
    const ownership: OrderStatus =
      user.email === entry.MDEntryOriginator
        ? OrderStatus.Owned
        : OrderStatus.NotOwned;
    const sameBank: OrderStatus =
      user.firm === entry.MDMkt ? OrderStatus.SameBank : OrderStatus.None;
    const preFilled: OrderStatus =
      price !== null ? OrderStatus.PreFilled : OrderStatus.None;
    const active: OrderStatus =
      entry.MDEntrySize === undefined || entry.MDEntrySize === "0"
        ? OrderStatus.Cancelled
        : OrderStatus.Active;
    const { roles } = user;
    const isOwnerBroker: OrderStatus = roles.includes(Role.Broker)
      ? OrderStatus.OwnedByBroker
      : OrderStatus.None;
    const order: Order = new Order(
      w.Tenor,
      w.Symbol,
      w.Strategy,
      entry.MDEntryOriginator,
      getNumber(entry.MDEntrySize),
      entry.MDEntryType
    );
    // Update fields not in the constructor
    const execInstNames: { [execInst: string]: string } = {
      G: "AON",
      D: "1/2 ON",
    };
    if (entry.ExecInst !== undefined) {
      order.instruction = execInstNames[entry.ExecInst];
    }
    order.price = price;
    order.firm = entry.MDMkt;
    order.orderId = entry.OrderID;
    order.status = ownership | preFilled | sameBank | active | isOwnerBroker;
    order.arrowDirection = normalizeTickDirection(
      entry.TickDirection,
      order.type
    );
    order.timestamp = Number(entry.MDEntryTime);
    // Now return the built order
    return order;
  };

  public uid = () => $$(this.symbol, this.strategy, this.tenor);
}
