import { API } from "API";
import { getAggregatedSize } from "columns/podColumns/OrderColumn/helpers/getAggregatedSize";
import { action, computed, observable } from "mobx";
import workareaStore from "mobx/stores/workareaStore";
import { OrderTypes } from "types/mdEntry";
import { FIXMessage, Order, OrderStatus } from "types/order";
import { Role } from "types/role";
import { User } from "types/user";
import { ArrowDirection, MessageTypes } from "types/w";
import { getCurrentTime, getSideFromType } from "utils/commonUtils";
import { pickBestOrder } from "utils/pickBestOrder";
import { priceFormatter } from "utils/priceFormatter";
import { sizeFormatter } from "utils/sizeFormatter";
import { $$ } from "utils/stringPaster";

export class OrderStore {
  public type: OrderTypes = OrderTypes.Invalid;

  public symbol = "";
  public strategy = "";
  public tenor = "";

  @observable orderID: string | undefined;
  @observable baseSize: number | null = null;
  @observable price: number | null = null;
  @observable currentStatus: OrderStatus = OrderStatus.None;
  @observable baseStatus: OrderStatus = OrderStatus.None;

  @observable defaultSize = 0;
  @observable minimumSize = 0;
  @observable orderTicket: Order | null = null;

  @observable.ref depth: Order[] = [];

  @computed
  get size(): number | null {
    if ((this.baseStatus & OrderStatus.InDepth) !== 0 || this.baseSize === null)
      return this.baseSize;
    return getAggregatedSize(this, this.depth);
  }

  @computed
  get cancelOrder(): Order | null {
    const { user, personality } = workareaStore;
    const { email, roles } = user;
    const { depth } = this;

    const validOrders = depth.filter((order: Order): boolean => {
      // Only same side
      if (order.type !== this.type) return false;
      // No cancelled orders
      if ((order.status & OrderStatus.Cancelled) !== 0) return false;
      // If I am a broker, it must be the same firm as personality I am assuming
      if (roles.includes(Role.Broker) && order.firm === personality)
        return true;
      // If it's mine, always
      return order.user === email && !roles.includes(Role.Broker);
    });

    const order = validOrders.reduce(
      (best: Order | null, current: Order): Order | null => {
        if (best === null) {
          return current;
        }

        return pickBestOrder(best, current);
      },
      null
    );

    return order ?? null;
  }

  private getReplaceOrderId(type: OrderTypes): string | null {
    const { user, personality } = workareaStore;
    const { email, roles, firm } = user;
    const { depth } = this;

    const myOrders = depth.filter((order: Order): boolean => {
      if (order.user !== email) return false;
      if (roles.includes(Role.Broker)) {
        return firm === personality && order.type === type;
      }

      return order.type === type;
    });

    const order = myOrders.reduce(pickBestOrder, null);

    if (order === null) {
      return null;
    }

    return order.orderId ?? null;
  }

  @computed
  get replaceOrderId(): string | null {
    return this.getReplaceOrderId(this.type);
  }

  @computed
  get minimumPrice(): number {
    return 0;
  }

  @computed
  get maximumPrice(): number {
    return 0;
  }

  @computed
  get status(): OrderStatus {
    return this.baseStatus | this.currentStatus;
  }

  public getCreatorPrice(editedPrice: number | null): number | null {
    const currentOrder = this.getExistingOrder(this.type);
    if (editedPrice !== null) return editedPrice;
    if (currentOrder === null) return null;
    return currentOrder.price;
  }

  public getCreatorSize(editedSize: number | null): number | null {
    const currentOrder = this.getExistingOrder(this.type);
    if (this.defaultSize === undefined)
      throw new Error("impossible to determine order creation size");
    if (editedSize !== null) return editedSize;
    if (currentOrder !== null && currentOrder.size !== null)
      return currentOrder.size;
    // Finally, use the default size
    return this.defaultSize;
  }

  @action.bound
  public async createWithType(
    inputPrice: number | null,
    inputSize: number | null,
    type: OrderTypes,
    cancelOldOrder = true
  ): Promise<void> {
    const price: number | null = this.getCreatorPrice(inputPrice);
    const size: number | null = this.getCreatorSize(inputSize);
    if (price === null) /* in this case just ignore this */ return;
    if (size === null) {
      throw new Error(
        "cannot create orders when the user has not initialized the cell"
      );
    }
    const user: User = workareaStore.user;
    const personality: string = workareaStore.personality;
    // Now attempt to create the new order
    if (user === null || personality === null)
      throw new Error("store not properly initialized");
    // Set "creating status"
    this.currentStatus =
      this.currentStatus |
      (type === this.type ? OrderStatus.BeingCreated : OrderStatus.None);
    const { roles } = user;
    // Create the request
    const side = getSideFromType(type);
    const matchingOrderId = cancelOldOrder
      ? this.getReplaceOrderId(type)
      : null;
    const request: FIXMessage = ((): FIXMessage => {
      if (matchingOrderId !== null) {
        return {
          MsgType: MessageTypes.M,
          OrderID: matchingOrderId,
          TransactTime: getCurrentTime(),
          User: user.email,
          Symbol: this.symbol,
          Strategy: this.strategy,
          Tenor: this.tenor,
          Side: side,
          Firm: workareaStore.effectiveFirm,
          Quantity: size.toString(),
          Price: price.toString(),
          MDMkt: roles.includes(Role.Broker) ? personality : undefined,
          ...API.getCancelCondition(),
        };
      } else {
        return {
          MsgType: MessageTypes.D,
          TransactTime: getCurrentTime(),
          User: user.email,
          Symbol: this.symbol,
          Strategy: this.strategy,
          Tenor: this.tenor,
          Side: side,
          Firm: workareaStore.effectiveFirm,
          Quantity: size.toString(),
          Price: price.toString(),
          MDMkt: roles.includes(Role.Broker) ? personality : undefined,
          ...API.getCancelCondition(),
        };
      }
    })();
    const response = await API.executeCreateOrderRequest(request);
    if (response.Status === "Success") {
      this.currentStatus = this.currentStatus & ~OrderStatus.BeingCreated;
      const newOrder: Order = {
        instruction: "",
        // Current user owns this order of course
        firm: user.firm,
        user: user.email,
        // Status should obviously be like the following
        status: this.getNewOrderStatus(price),
        // Response received from the server
        timestamp: response.TransactTime,
        orderId: response.OrderID,
        type: this.type,
        // Price and size set in this function
        size: size,
        price: price,
        // Combination
        strategy: this.strategy,
        tenor: this.tenor,
        symbol: this.symbol,
        // We cannot know this, or can we?
        arrowDirection: ArrowDirection.None,
        uid: () => $$(this.symbol, this.strategy, this.tenor),
      };
      const status: OrderStatus =
        (this.status & OrderStatus.HasDepth) !== 0
          ? OrderStatus.HasDepth
          : OrderStatus.None;
      // Update current order
      if ((status & OrderStatus.AtTop) === OrderStatus.AtTop) {
        this.setOrder(
          newOrder,
          newOrder.status | OrderStatus.JustCreated | status
        );
      }
    } else {
      this.currentStatus =
        (this.currentStatus & ~OrderStatus.BeingCreated) |
        OrderStatus.ActionError;
    }
  }

  @action.bound
  public async create(
    inputPrice: number | null,
    inputSize: number | null
  ): Promise<void> {
    return this.createWithType(inputPrice, inputSize, this.type);
  }

  @action.bound
  public async cancel(): Promise<void> {
    const user: User | null = workareaStore.user;
    if (user !== null) {
      const { cancelOrder: order } = this;

      if (order === null) {
        console.warn("the user should not be able to cancel things");
        return;
      }

      this.currentStatus = this.currentStatus | OrderStatus.BeingCancelled;
      const response = await API.cancelOrder(order, user);
      if (response.Status === "Success") {
        this.currentStatus = this.currentStatus & ~OrderStatus.BeingCancelled;
      } else {
        this.currentStatus =
          (this.currentStatus & ~OrderStatus.BeingCancelled) |
          OrderStatus.ActionError;
      }
    }
  }

  @action.bound
  public setOrder(order: Order | undefined, status: OrderStatus): void {
    if (order?.type === OrderTypes.Invalid) return;
    this.baseStatus = OrderStatus.None;

    if (order) {
      this.price = order.price;
      this.baseSize = order.size;
      this.orderID = order.orderId;
      this.type = order.type;
      this.symbol = order.symbol;
      this.strategy = order.strategy;
      this.tenor = order.tenor;
      this.baseStatus = status;
    }
  }

  @action.bound
  public setDefaultAndMinimumSizes(
    defaultSize: number,
    minimumSize: number
  ): void {
    this.defaultSize = defaultSize;
    this.minimumSize = minimumSize;
  }

  @action.bound
  public setOrderTicket(orderTicket: Order): void {
    this.orderTicket = orderTicket;
  }

  @action.bound
  public unsetOrderTicket(): void {
    this.orderTicket = null;
  }

  @action.bound
  public setStatusBit(status: OrderStatus): void {
    this.currentStatus |= status;
  }

  @action.bound
  public unsetStatusBit(status: OrderStatus): void {
    this.currentStatus &= ~status;
  }

  @action.bound
  public setCurrentDepth(depth: ReadonlyArray<Order>): void {
    if (!depth) return;
    this.depth = depth.filter((order: Order) => order.size !== null);
  }

  public shouldCancelReplace(size: number | null): boolean {
    const changed: boolean =
      sizeFormatter(size) !== sizeFormatter(this.baseSize);
    if ((this.baseStatus & OrderStatus.Owned) !== 0) return changed;
    return true;
  }

  public uid(): string {
    return this.symbol + this.strategy + this.tenor;
  }

  private getExistingOrder(type: OrderTypes): Order | null {
    const { depth } = this;
    const user: User = workareaStore.user;
    const found: Order | undefined = depth.find(
      (order: Order) => order.user === user.email && order.type === type
    );
    if (found !== undefined) return found;
    return null;
  }

  private getNewOrderStatus(price: number): OrderStatus {
    const { depth } = this;
    const top: Order | undefined = depth.find(
      (order: Order): boolean =>
        (order.status & OrderStatus.Active) === OrderStatus.Active &&
        (order.status & OrderStatus.Cancelled) === 0
    );
    if (top === undefined)
      return OrderStatus.Active | OrderStatus.AtTop | OrderStatus.Owned;
    if (priceFormatter(price) === priceFormatter(top.price)) {
      return OrderStatus.Active;
    } else {
      if (top.price === null) return OrderStatus.Active;
      switch (this.type) {
        case OrderTypes.Ofr:
          return price < top.price
            ? OrderStatus.Active | OrderStatus.AtTop | OrderStatus.Owned
            : OrderStatus.Active;
        case OrderTypes.Bid:
          return price > top.price
            ? OrderStatus.Active | OrderStatus.AtTop | OrderStatus.Owned
            : OrderStatus.Active;
        case OrderTypes.DarkPool:
        case OrderTypes.Invalid:
          break;
      }
    }
    return OrderStatus.Active;
  }
}
