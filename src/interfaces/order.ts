import { MDEntry, OrderTypes } from 'interfaces/mdEntry';
import { User } from 'interfaces/user';
import { ArrowDirection, MessageTypes, W } from 'interfaces/w';
import { $$ } from 'utils/stringPaster';
import { Sides } from 'interfaces/sides';

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

const normalizeTickDirection = (source: string | undefined, orderType: OrderTypes): ArrowDirection => {
  if (orderType === OrderTypes.Bid) {
    switch (source) {
      case '0':
        return ArrowDirection.Up;
      case '2':
        return ArrowDirection.Down;
      default:
        return ArrowDirection.None;
    }
  } else {
    switch (source) {
      case '0':
        return ArrowDirection.Down;
      case '2':
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

  constructor(tenor: string, currency: string, strategy: string, user: string, size: number | null, type: OrderTypes) {
    this.type = type;
    this.tenor = tenor;
    this.symbol = currency;
    this.strategy = strategy;
    this.user = user;
    this.price = null;
    this.size = size;
    this.arrowDirection = ArrowDirection.None;
    this.status = OrderStatus.None;
    this.timestamp = Date.now();
  }

  public uid = () => $$(this.symbol, this.strategy, this.tenor);

  public static fromOrderMessage = (entry: OrderMessage, email: string): Order => {
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
    order.status = OrderStatus.Cancelled | OrderStatus.PreFilled | OrderStatus.RunOrder;
    // Return the newly built order
    return order;
  };

  public static fromWAndMDEntry = (w: W, entry: MDEntry, user: User): Order => {
    const price: number | null = getNumber(entry.MDEntryPx);
    const ownership: OrderStatus = user.email === entry.MDEntryOriginator ? OrderStatus.Owned : OrderStatus.NotOwned;
    const sameBank: OrderStatus = user.firm === entry.MDMkt ? OrderStatus.SameBank : OrderStatus.None;
    const preFilled: OrderStatus = price !== null ? OrderStatus.PreFilled : OrderStatus.None;
    const active: OrderStatus =
      entry.MDEntrySize === undefined || entry.MDEntrySize === '0'
        ? OrderStatus.Cancelled
        : OrderStatus.Active;
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
    order.price = price;
    order.firm = entry.MDMkt;
    order.orderId = entry.OrderID;
    order.status = ownership | preFilled | sameBank | active | isOwnerBroker;
    order.arrowDirection = normalizeTickDirection(entry.TickDirection, order.type);
    order.timestamp = Number(entry.MDEntryTime);
    // Now return the built order
    return order;
  };

  /*public dispatchEvent = (action: OrderAction) => {
    const type: string = $$(this.uid(), action);
    const event: CustomEvent = new CustomEvent<Order>(type, { detail: this });
    // Now dispatch it
    document.dispatchEvent(event);
  };*/

  public isOwnedByCurrentUser = (user: User): boolean => {
    return this.user === user.email;
  };

  public isCancelled = () => {
    return (this.status & OrderStatus.Cancelled) !== 0;
  };

  public isSameBankAsCurrentUser = () => {
    return (this.status & OrderStatus.SameBank) !== 0;
  };
}
