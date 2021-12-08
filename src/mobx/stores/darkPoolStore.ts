import { API } from "API";
import { action, computed, observable } from "mobx";
import workareaStore from "mobx/stores/workareaStore";
import signalRManager from "signalR/signalRClient";
import { MDEntry, OrderTypes } from "types/mdEntry";
import { DarkPoolMessage } from "types/message";
import { DarkPoolOrder, Order, OrderStatus } from "types/order";
import { Role } from "types/role";
import { Sides } from "types/sides";
import { User } from "types/user";
import { W } from "types/w";
import { clearDarkPoolPriceEvent } from "utils/clearDarkPoolPriceEvent";
import { globalClearDarkPoolPriceEvent } from "utils/globalClearDarkPoolPriceEvent";

export class DarkPoolStore {
  @observable.ref public orders: Order[] = [];
  @observable public publishedPrice: number | null = null;
  @observable public isTicketOpen: boolean = false;
  @observable public currentOrder: Order | null = null;

  constructor(initial: number | null) {
    this.publishedPrice = initial;
  }

  @computed
  get depth(): Order[] {
    const { orders } = this;
    const user: User = workareaStore.user;
    const personality: string = workareaStore.personality;
    const { roles } = user;
    // Extract only my orders
    return orders.filter((o: Order) => {
      if (roles.includes(Role.Broker)) {
        return o.firm === personality && o.user === user.email;
      }

      return o.user === user.email || o.firm === user.firm;
    });
  }

  @computed
  get price(): number | null {
    const { currentOrder } = this;
    if (currentOrder === null) return this.publishedPrice;
    return currentOrder.price;
  }

  @computed
  get status(): OrderStatus {
    const user: User = workareaStore.user;
    const personality: string = workareaStore.personality;
    const { roles } = user;
    const { currentOrder } = this;
    const isBroker = roles.includes(Role.Broker);
    if (!currentOrder) return OrderStatus.None;
    const isSameFirm = isBroker
      ? currentOrder.firm === personality
      : currentOrder.firm === user.firm;
    if (currentOrder.size === null) return OrderStatus.None;
    if (currentOrder.user === user.email) {
      return (
        OrderStatus.FullDarkPool | OrderStatus.DarkPool | OrderStatus.Owned
      );
    } else if (isSameFirm) {
      return (
        OrderStatus.FullDarkPool | OrderStatus.DarkPool | OrderStatus.SameBank
      );
    }
    return OrderStatus.FullDarkPool | OrderStatus.DarkPool;
  }

  @action.bound
  public onOrderReceived(w: W) {
    const user: User = workareaStore.user;
    const originalEntries: MDEntry[] = w?.Entries;
    if (!originalEntries) {
      this.orders = [];
      this.currentOrder = null;
      return;
    }
    const entries: MDEntry[] = originalEntries.filter(
      (entry: MDEntry) => !!entry.MDEntrySize
    );
    const orders: Order[] = entries.map((entry: MDEntry) =>
      Order.fromWAndMDEntry(w, entry, user)
    );
    if (orders.length > 0) {
      const mine: Order | undefined = orders.find(
        (order: Order) => order.user === user.email
      );
      const bank: Order | undefined = orders.find(
        (order: Order) => order.firm === user.firm
      );
      if (mine) {
        this.currentOrder = mine;
      } else if (bank) {
        this.currentOrder = bank;
      } else {
        const index: number = orders.findIndex(
          (o: Order) => o.price !== null && o.size !== null
        );
        if (index !== -1) {
          this.currentOrder = orders[index];
        } else {
          this.currentOrder = null;
        }
      }
    } else {
      this.currentOrder = null;
    }
    this.orders = orders;
  }

  @action.bound
  public onDarkPoolPricePublished(message: DarkPoolMessage) {
    if (message.DarkPrice !== "") {
      this.publishedPrice = Number(message.DarkPrice);
    } else {
      this.publishedPrice = null;
    }
  }

  @action.bound
  public setDarkPoolPrice(price: number | null): void {
    this.publishedPrice = price;
  }

  @action.bound
  public getClearDarkPoolPriceCallback =
    (symbol: string, strategy: string, tenor: string): (() => void) =>
    (): void => {
      const { user } = workareaStore;
      void API.clearDarkPoolPrice(user.email, symbol, strategy, tenor);
      this.publishedPrice = null;
    };

  @action.bound
  public connect(symbol: string, strategy: string, tenor: string): () => void {
    const cleanup = signalRManager.setDarkPoolPriceListener(
      symbol,
      strategy,
      tenor,
      this.onDarkPoolPricePublished
    );

    this.removeOrderListener = signalRManager.addDarkPoolOrderListener(
      symbol,
      strategy,
      tenor,
      this.onOrderReceived
    );

    const handler = (): void => this.setDarkPoolPrice(null);

    const event1: string = clearDarkPoolPriceEvent(symbol, strategy, tenor);
    const event2: string = globalClearDarkPoolPriceEvent();

    document.addEventListener(event1, handler);
    document.addEventListener(event2, handler);

    return () => {
      document.removeEventListener(event1, handler);
      document.removeEventListener(event2, handler);
      this.removeOrderListener();
      // Call the cleanup item
      cleanup();
    };
  }

  @action.bound
  public setCurrentPublishedPrice(value: number | null): void {
    this.publishedPrice = value;
  }

  public async publishPrice(
    symbol: string,
    strategy: string,
    tenor: string,
    price: number | null
  ) {
    const user: User = workareaStore.user;
    const { roles } = user;
    if (!roles.includes(Role.Broker))
      throw new Error("non broker users cannot publish prices");
    // Update immediately to make it feel faster
    this.publishedPrice = price;
    await API.cancelAllDarkPoolOrder(symbol, strategy, tenor);
    // Call the API
    await API.publishDarkPoolPrice(
      user.email,
      symbol,
      strategy,
      tenor,
      price !== null ? price : ""
    );
  }

  @action.bound
  public closeTicket() {
    this.isTicketOpen = false;
  }

  @action.bound
  public openTicket() {
    this.isTicketOpen = true;
  }

  @action.bound
  public async createOrder(order: DarkPoolOrder) {
    const { orders } = this;
    const user: User = workareaStore.user;
    this.closeTicket();

    const currentOrder: Order | undefined = orders.find((o: Order) => {
      if (o.type === OrderTypes.Bid && order.Side !== Sides.Buy) return false;
      if (o.type === OrderTypes.Ofr && order.Side !== Sides.Sell) return false;
      return user.email === o.user;
    });
    // if (currentOrder) await API.cancelDarkPoolOrder(currentOrder);
    await API.createDarkPoolOrder({
      ...(currentOrder ? { OrderID: currentOrder.orderId } : {}),
      ...order,
    });
  }

  @action.bound
  public cancel(order: Order) {
    void API.cancelDarkPoolOrder(order);
    this.currentOrder = null;
  }

  @action.bound
  public reset(): void {
    this.currentOrder = null;
  }

  private removeOrderListener: () => void = () => null;
}
