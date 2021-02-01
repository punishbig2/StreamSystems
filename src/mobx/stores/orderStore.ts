import { API } from "API";
import { getAggregatedSize } from "columns/podColumns/OrderColumn/helpers/getAggregatedSize";
import { action, computed, observable } from "mobx";
import workareaStore from "mobx/stores/workareaStore";
import { OrderTypes } from "types/mdEntry";
import { CreateOrder, Order, OrderStatus } from "types/order";
import { Role } from "types/role";
import { User } from "types/user";
import { ArrowDirection, MessageTypes } from "types/w";
import { getCurrentTime, getSideFromType } from "utils/commonUtils";
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

  private getClashingOrder(type: OrderTypes): Order | null {
    const { depth } = this;
    const user: User = workareaStore.user;
    const found: Order | undefined = depth.find(
      (order: Order) => order.user === user.email && order.type === type
    );
    if (found !== undefined) return found;
    return null;
  }

  @computed
  get size(): number | null {
    if ((this.baseStatus & OrderStatus.InDepth) !== 0 || this.baseSize === null)
      return this.baseSize;
    return getAggregatedSize(this, this.depth);
  }

  @computed
  get minimumPrice(): number {
    return 0;
  }

  @computed
  get maximumPrice(): number {
    return 0;
  }

  public getCreatorPrice(editedPrice: number | null): number | null {
    const currentOrder = this.getClashingOrder(this.type);
    if (editedPrice !== null) return editedPrice;
    if (currentOrder === null) return null;
    return currentOrder.price;
  }

  public getCreatorSize(editedSize: number | null): number | null {
    const currentOrder = this.getClashingOrder(this.type);
    if (this.defaultSize === undefined)
      throw new Error("impossible to determine order creation size");
    if (editedSize !== null) return editedSize;
    if (currentOrder !== null && currentOrder.size !== null)
      return currentOrder.size;
    // Finally use the default size
    return this.defaultSize;
  }

  @computed
  get status(): OrderStatus {
    return this.baseStatus | this.currentStatus;
  }

  private getCancelOrderId(type: OrderTypes): { OrderID?: string } {
    const clashingOrder: Order | null = this.getClashingOrder(type);
    if (clashingOrder === null) {
      return {};
    }
    return { OrderID: clashingOrder.orderId };
  }

  @action.bound
  public async createWithType(
    inputPrice: number | null,
    inputSize: number | null,
    type: OrderTypes
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
    const request: CreateOrder = {
      ...this.getCancelOrderId(type),
      MsgType: MessageTypes.D,
      TransactTime: getCurrentTime(),
      User: user.email,
      Symbol: this.symbol,
      Strategy: this.strategy,
      Tenor: this.tenor,
      Side: side,
      Quantity: size.toString(),
      Price: price.toString(),
      MDMkt: roles.includes(Role.Broker) ? personality : undefined,
      ...API.getCancelCondition(),
    };
    const response = await API.executeCreateOrderRequest(request);
    if (response.Status === "Success") {
      this.currentStatus = this.currentStatus & ~OrderStatus.BeingCreated;
      const newOrder: Order = {
        instruction: "",
        // Current user owns this order of course
        firm: user.firm,
        user: user.email,
        // Status should obviously be like the following
        status: OrderStatus.Owned | OrderStatus.Active,
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
      this.setOrder(
        newOrder,
        newOrder.status | OrderStatus.JustCreated | status
      );
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
    const { depth } = this;
    const user: User | null = workareaStore.user;
    const personality: string = workareaStore.personality;
    if (user !== null) {
      const { roles } = user;
      const order: Order | undefined = depth.find((o: Order) => {
        if (o.type !== this.type) return false;
        if (roles.includes(Role.Broker)) return o.firm === personality;
        return o.user === user.email;
      });
      if (!!order && !!order.orderId && !!order.size) {
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
  }

  @action.bound
  public setOrder(order: Order | undefined, status: OrderStatus): void {
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
  public setPrice(price: number | null): void {
    this.price = price;
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
  public setCurrentDepth(depth: Order[]): void {
    if (!depth) return;
    this.depth = depth.filter((order: Order) => order.size !== null);
  }

  public shouldCancelReplace(size: number | null): boolean {
    const changed: boolean =
      sizeFormatter(size) !== sizeFormatter(this.baseSize);
    if ((this.baseStatus & OrderStatus.Owned) !== 0) return changed;
    return true;
  }
}
