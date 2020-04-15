import { observable, action, computed } from 'mobx';
import { OrderStatus, Order, CreateOrder } from 'interfaces/order';
import { getAggregatedSize } from 'columns/podColumns/OrderColumn/helpers/getAggregatedSize';
import { OrderTypes } from 'interfaces/mdEntry';
import { MessageTypes } from 'interfaces/w';
import { getSideFromType, getCurrentTime } from 'utils';
import { User } from 'interfaces/user';
import { API } from 'API';
import workareaStore from 'mobx/stores/workareaStore';

export class OrderStore {
  public type: OrderTypes = OrderTypes.Invalid;

  public symbol: string = '';
  public strategy: string = '';
  public tenor: string = '';

  @observable user: User | null = null;
  @observable personality: string | null = null;

  @observable orderID: string | undefined;
  @observable baseSize: number | null = null;
  @observable price: number | null = null;
  @observable currentStatus: OrderStatus = OrderStatus.None;
  @observable baseStatus: OrderStatus = OrderStatus.None;

  @observable submittedSize: number | null = null;
  @observable editedSize: number | null = null;
  @observable defaultSize: number = 0;
  @observable minimumSize: number = 0;
  @observable orderTicket: Order | null = null;

  @observable.ref depth: Order[] = [];

  @computed
  get size() {
    if (this.editedSize !== null)
      return this.editedSize;
    if ((this.baseStatus & OrderStatus.InDepth) !== 0 || (this.baseSize === null))
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

  private getCreateSize() {
    if ((this.status & OrderStatus.Owned) === 0)
      return this.defaultSize !== undefined ? this.defaultSize : this.minimumSize;
    // If a size was submitted use it
    if (this.editedSize !== null)
      return this.editedSize;
    // Otherwise use current order's size
    if (this.baseSize !== null)
      return this.baseSize;
    // Finally use the default size
    if (this.defaultSize === undefined)
      throw new Error('impossible to determine order creation size');
    return this.defaultSize;
  }

  @computed
  get status() {
    return this.baseStatus | this.currentStatus;
  }

  @action.bound
  public resetAllSizes() {
    this.submittedSize = null;
    this.editedSize = null;
  }

  @action.bound
  public async create() {
    const price: number | null = this.price;
    const size: number | null = this.getCreateSize();
    if (price === null || size === null)
      throw new Error('cannot create orders when the user has not initialized the cell');
    // First cancel previous orders if any
    if ((this.status & OrderStatus.Cancelled) === 0)
      await this.cancel();
    // Now attempt to create the new order
    const { user, personality } = this;
    if (user === null || personality === null)
      throw new Error('store not properly initialized');
    // Set "creating status"
    this.currentStatus = this.currentStatus | OrderStatus.BeingCreated;
    // Create the request
    const request: CreateOrder = {
      MsgType: MessageTypes.D,
      TransactTime: getCurrentTime(),
      User: user.email,
      Symbol: this.symbol,
      Strategy: this.strategy,
      Tenor: this.tenor,
      Side: getSideFromType(this.type),
      Quantity: size.toString(),
      Price: price.toString(),
      MDMkt: user.isbroker ? personality : undefined,
    };
    const response = await API.executeCreateOrderRequest(request);
    if (response.Status === 'Success') {
      this.currentStatus = this.currentStatus & ~OrderStatus.BeingCreated;
    } else {
      this.currentStatus = (this.currentStatus & ~OrderStatus.BeingCreated) | OrderStatus.ActionError;
    }
  }

  @action.bound
  public async cancel() {
    const { depth } = this;
    const user: User | null = workareaStore.user;
    if (user !== null) {
      const order: Order | undefined = depth.find((o: Order) => o.type === this.type && o.user === user.email);
      if (!!order && !!order.orderId && !!order.size) {
        this.currentStatus = this.currentStatus | OrderStatus.BeingCancelled;
        const response = await API.cancelOrder(order, user);
        if (response.Status === 'Success') {
          this.currentStatus = this.currentStatus & ~OrderStatus.BeingCancelled;
        } else {
          this.currentStatus = (this.currentStatus & ~OrderStatus.BeingCancelled) | OrderStatus.ActionError;
        }
      }
    }
  }

  @action.bound
  public setEditedSize(value: number | null) {
    this.editedSize = value;
  }

  @action.bound
  public setOrder(order: Order | undefined, status: OrderStatus) {
    if (order) {
      this.price = order.price;
      this.baseSize = order.size;
      this.orderID = order.orderId;
      this.submittedSize = null;
      this.editedSize = null;
      this.type = order.type;
      this.symbol = order.symbol;
      this.strategy = order.strategy;
      this.tenor = order.tenor;
    }
    this.baseStatus = status;
    this.submittedSize = null;
    this.editedSize = null;
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
  public setPersonality(personality: string) {
    this.personality = personality;
  }

  @action.bound
  public setUser(user: User) {
    this.user = user;
  }

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
    this.depth = depth;
  }
}

