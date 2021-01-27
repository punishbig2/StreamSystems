import { API } from "API";
import { action, computed, observable } from "mobx";
import workareaStore from "mobx/stores/workareaStore";
import signalRManager from "signalR/signalRManager";
import { MDEntry, OrderTypes } from "types/mdEntry";
import { DarkPoolMessage } from "types/message";
import { DarkPoolOrder, Order, OrderStatus } from "types/order";
import { Role } from "types/role";
import { Sides } from "types/sides";
import { User } from "types/user";
import { W } from "types/w";

export class DarkPoolStore {
  @observable orders: Order[] = [];
  @observable publishedPrice: number | null = null;
  @observable isTicketOpen: boolean = false;
  @observable currentOrder: Order | null = null;

  private removeOrderListener: () => void = () => null;

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
    if (!currentOrder) return OrderStatus.None;
    if (currentOrder.size === null) return OrderStatus.None;
    if (currentOrder.user === user.email) {
      if (roles.includes(Role.Broker) && currentOrder.firm !== personality)
        return OrderStatus.FullDarkPool | OrderStatus.DarkPool;
      return (
        OrderStatus.FullDarkPool | OrderStatus.DarkPool | OrderStatus.Owned
      );
    } else if (currentOrder.firm === user.firm) {
      return (
        OrderStatus.FullDarkPool | OrderStatus.DarkPool | OrderStatus.SameBank
      );
    }
    return OrderStatus.FullDarkPool | OrderStatus.DarkPool;
  }

  @action.bound
  public onOrderReceived(w: W) {
    const user: User = workareaStore.user;
    const originalEntries: MDEntry[] = w.Entries;
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
  public clearDarkPoolPrice() {
    this.publishedPrice = null;
  }

  @action.bound
  public connect(
    currency: string,
    strategy: string,
    tenor: string
  ): () => void {
    this.currentOrder = null;
    this.orders = [];
    signalRManager.setDarkPoolPriceListener(
      currency,
      strategy,
      tenor,
      this.onDarkPoolPricePublished
    );
    this.removeOrderListener = signalRManager.setDarkPoolOrderListener(
      currency,
      strategy,
      tenor,
      this.onOrderReceived
    );
    document.addEventListener("cleardarkpoolprice", this.clearDarkPoolPrice);
    return () => {
      document.removeEventListener(
        "cleardarkpoolprice",
        this.clearDarkPoolPrice
      );
      this.removeOrderListener();
      signalRManager.removeDarkPoolPriceListener(currency, strategy, tenor);
    };
  }

  @action.bound
  public setCurrentPublishedPrice(value: number | null): void {
    this.publishedPrice = value;
  }

  public async publishPrice(
    currency: string,
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
    await API.cancelAllDarkPoolOrder(currency, strategy, tenor);
    // Call the API
    await API.publishDarkPoolPrice(
      user.email,
      currency,
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
    API.cancelDarkPoolOrder(order);
    this.currentOrder = null;
  }
}
