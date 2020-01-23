import {MDEntry, OrderTypes} from 'interfaces/mdEntry';
import {User} from 'interfaces/user';
import {ArrowDirection, MessageTypes, W} from 'interfaces/w';
import {$$} from 'utils/stringPaster';

export enum Sides {
  Buy = 'BUY',
  Sell = 'SELL'
}

export interface CreateOrder {
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
}

export type DarkPoolOrder = CreateOrder & {
  ExecInst?: string;
};

export enum OrderErrors {
  NegativePrice = 'Invalid price. Price should be positive.'
}

export interface UpdateOrder {
  MsgType: MessageTypes;
  TransactTime: string;
  User: string;
  OrderID: string;
  Quantity: string;
  Price: string;
  Symbol: string;
  Strategy: string;
  Tenor: string;
}

export enum OrderStatus {
  None = 0,
  Active = 1 << 1,
  Cancelled = 1 << 2,
  PreFilled = 1 << 3,
  PriceEdited = 1 << 4,
  QuantityEdited = 1 << 5,
  Owned = 1 << 6,
  NotOwned = 1 << 7,
  HaveOrders = 1 << 8,
  HasDepth = 1 << 9,
  SameBank = 1 << 10,
  BeingCreated = 1 << 11,
  BeingCancelled = 1 << 12,
  BeingLoaded = 1 << 13,
  DarkPool = 1 << 14,
  FullDarkPool = 1 << 15,
  OwnedByBroker = 1 << 16,
}

export interface OrderMessage {
  OrderID: string;
  Price: string;
  Tenor: string;
  Symbol: string;
  Strategy: string;
  Side: '1' | '2';
  OrderQty: string;
}

const getNumber = (value: string | null | undefined): number | null => {
  if (!value) return null;
  const numeric: number = Number(value);
  if (numeric === 0) return null;
  return numeric;
};

const normalizeTickDirection = (source: string | undefined): ArrowDirection => {
  switch (source) {
    case '0':
      return ArrowDirection.Up;
    case '2':
      return ArrowDirection.Down;
    default:
      return ArrowDirection.None;
  }
};

export class Order {
  public arrowDirection: ArrowDirection;
  public firm: string | undefined;
  public orderId: string | undefined;
  public price: number | null;
  public quantity: number | null;
  public status: OrderStatus;
  public strategy: string;
  public symbol: string;
  public tenor: string;
  public type: OrderTypes;
  public user: string;
  public timestamp: string = Date.now().toString();

  constructor(
    tenor: string,
    symbol: string,
    strategy: string,
    user: string,
    quantity: number | null,
    type: OrderTypes,
  ) {
    this.type = type;
    this.tenor = tenor;
    this.symbol = symbol;
    this.strategy = strategy;
    this.user = user;
    this.price = null;
    this.quantity = quantity;
    this.arrowDirection = ArrowDirection.None;
    this.status = OrderStatus.None;
  }

  public uid = () => {
    return $$(this.tenor, this.symbol, this.strategy);
  };

  public static fromOrderMessage = (
    entry: OrderMessage,
    email: string,
  ): Order => {
    const type: OrderTypes =
      entry.Side === '1' ? OrderTypes.Bid : OrderTypes.Ofr;
    const order: Order = new Order(
      entry.Tenor,
      entry.Symbol,
      entry.Strategy,
      email,
      Number(entry.OrderQty),
      type,
    );
    // Update the price
    order.price = Number(entry.Price);
    order.status = OrderStatus.Cancelled | OrderStatus.PreFilled;
    // Return the newly built order
    return order;
  };

  public static fromWAndMDEntry = (w: W, entry: MDEntry, user: User): Order => {
    const price: number | null = getNumber(entry.MDEntryPx);
    // Status holders
    const ownership: OrderStatus =
      user.email === entry.MDEntryOriginator
        ? OrderStatus.Owned
        : OrderStatus.NotOwned;
    const sameBank: OrderStatus =
      user.firm === entry.MDMkt ? OrderStatus.SameBank : OrderStatus.None;
    const preFilled: OrderStatus =
      price !== null ? OrderStatus.PreFilled : OrderStatus.None;
    const cancelled: OrderStatus =
      price !== null && !entry.MDEntrySize
        ? OrderStatus.Cancelled
        : OrderStatus.None;
    const isOwnerBroker: OrderStatus = user.isbroker ? OrderStatus.OwnedByBroker : OrderStatus.None;
    const order: Order = new Order(
      w.Tenor,
      w.Symbol,
      w.Strategy,
      entry.MDEntryOriginator,
      getNumber(entry.MDEntrySize),
      entry.MDEntryType,
    );
    // Update fields not in the constructor
    order.price = getNumber(entry.MDEntryPx);
    order.firm = entry.MDMkt;
    order.orderId = entry.OrderID;
    order.status =
      OrderStatus.Active | ownership | preFilled | sameBank | cancelled | isOwnerBroker;
    order.arrowDirection = normalizeTickDirection(entry.TickDirection);
    // Now return the built order
    return order;
  };
}
