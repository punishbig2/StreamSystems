import { observable, action, computed } from 'mobx';
import { OrderStatus, Order, CreateOrder } from 'types/order';
import { getAggregatedSize } from 'columns/podColumns/OrderColumn/helpers/getAggregatedSize';
import { OrderTypes } from 'types/mdEntry';
import { MessageTypes, ArrowDirection } from 'types/w';
import { getSideFromType, getCurrentTime } from 'utils';
import { User } from 'types/user';
import { API } from 'API';
import workareaStore from 'mobx/stores/workareaStore';
import { sizeFormatter } from 'utils/sizeFormatter';
import { $$ } from 'utils/stringPaster';

export class OrderStore {
  public type: OrderTypes = OrderTypes.Invalid;

  public symbol: string = "";
  public strategy: string = "";
  public tenor: string = "";

  @observable orderID: string | undefined;
  @observable baseSize: number | null = null;
  @observable price: number | null = null;
  @observable currentStatus: OrderStatus = OrderStatus.None;
  @observable baseStatus: OrderStatus = OrderStatus.None;

  @observable defaultSize: number = 0;
  @observable minimumSize: number = 0;
  @observable orderTicket: Order | null = null;

  @observable.ref depth: Order[] = [];

  get myOrder(): Order | null {
    const { depth } = this;
    const user: User = workareaStore.user;
    const found: Order | undefined = depth.find(
      (o: Order) => o.user === user.email && o.type === this.type
    );
    if (found !== undefined) return found;
    return null;
  }

  @computed
  get size() {
    if ((this.baseStatus & OrderStatus.InDepth) !== 0 || this.baseSize === null)
      return this.baseSize;
    return getAggregatedSize(this, this.depth);
  }

  @computed
  get minimumPrice() {
    return 0;
  }

  @computed
  get maximumPrice() {
    return 0;
  }

  public getCreatorPrice(editedPrice: number | null): number | null {
    const { myOrder } = this;
    if (editedPrice !== null) return editedPrice;
    if (myOrder === null) return null;
    return myOrder.price;
  }

  public getCreatorSize(editedSize: number | null): number | null {
    const { myOrder } = this;
    if (this.defaultSize === undefined)
      throw new Error("impossible to determine order creation size");
    if (editedSize !== null) return editedSize;
    if (myOrder !== null && myOrder.size !== null) return myOrder.size;
    // Finally use the default size
    return this.defaultSize;
  }

  @computed
  get status() {
    return this.baseStatus | this.currentStatus;
  }

  @action.bound
  public async createWithType(
    inputPrice: number | null,
    inputSize: number | null,
    type: OrderTypes
  ) {
    const price: number | null = this.getCreatorPrice(inputPrice);
    const size: number | null = this.getCreatorSize(inputSize);
    if (price === null) /* in this case just ignore this */ return;
    if (size === null)
      throw new Error(
        "cannot create orders when the user has not initialized the cell"
      );
    // First cancel previous orders if any
    if ((this.status & OrderStatus.Cancelled) === 0) await this.cancel();
    const user: User = workareaStore.user;
    const personality: string = workareaStore.personality;
    // Now attempt to create the new order
    if (user === null || personality === null)
      throw new Error("store not properly initialized");
    // Set "creating status"
    this.currentStatus =
      this.currentStatus |
      (type === this.type ? OrderStatus.BeingCreated : OrderStatus.None);
    // Create the request
    const request: CreateOrder = {
      MsgType: MessageTypes.D,
      TransactTime: getCurrentTime(),
      User: user.email,
      Symbol: this.symbol,
      Strategy: this.strategy,
      Tenor: this.tenor,
      Side: getSideFromType(type),
      Quantity: size.toString(),
      Price: price.toString(),
      MDMkt: user.isbroker ? personality : undefined,
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
      const status: OrderStatus = (this.status & OrderStatus.HasDepth) !== 0 ? OrderStatus.HasDepth : OrderStatus.None;
      // Update current order
      this.setOrder(newOrder, newOrder.status | OrderStatus.JustCreated | status);
    } else {
      this.currentStatus =
        (this.currentStatus & ~OrderStatus.BeingCreated) |
        OrderStatus.ActionError;
    }
  }

  @action.bound
  public async create(inputPrice: number | null, inputSize: number | null) {
    return this.createWithType(inputPrice, inputSize, this.type);
  }

  @action.bound
  public async cancel() {
    const { depth } = this;
    const user: User | null = workareaStore.user;
    const personality: string = workareaStore.personality;
    if (user !== null) {
      const order: Order | undefined = depth.find((o: Order) => {
        if (o.type !== this.type) return false;
        if (user.isbroker) return o.firm === personality;
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
  public setOrder(order: Order | undefined, status: OrderStatus) {
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
  public setDefaultAndMinimumSizes(defaultSize: number, minimumSize: number) {
    this.defaultSize = defaultSize;
    this.minimumSize = minimumSize;
  }

  @action.bound
  public setOrderTicket(orderTicket: Order) {
    this.orderTicket = orderTicket;
  }

  @action.bound
  public unsetOrderTicket() {
    this.orderTicket = null;
  }

  @action.bound
  public setPrice(price: number | null) {
    this.price = price;
  }

  @action.bound
  public addStatusBit(status: OrderStatus) {
    this.currentStatus |= status;
  }

  @action.bound
  public removeStatusBit(status: OrderStatus) {
    this.currentStatus &= ~status;
  }

  @action.bound
  public setCurrentDepth(depth: Order[]) {
    if (!depth) return;
    this.depth = depth.filter((order: Order) => order.size !== null);
  }

  public shouldCancelReplace(size: number | null) {
    const changed: boolean =
      sizeFormatter(size) !== sizeFormatter(this.baseSize);
    if ((this.baseStatus & OrderStatus.Owned) !== 0) return changed;
    return true;
  }
}
