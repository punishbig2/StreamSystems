import { observable, computed, action } from 'mobx';
import { Order, OrderStatus, DarkPoolOrder } from 'interfaces/order';
import { W } from 'interfaces/w';
import { SignalRManager } from 'signalR/signalRManager';
import workareaStore from 'mobx/stores/workareaStore';
import { User } from 'interfaces/user';
import { MDEntry, OrderTypes } from 'interfaces/mdEntry';
import { DarkPoolMessage } from 'interfaces/message';
import { API } from 'API';
import { $$ } from 'utils/stringPaster';
import { PodTable } from 'interfaces/podTable';
import { orderSorter } from 'components/PodTile/helpers';
import { PodRowStatus } from 'interfaces/podRow';

export class DarkPoolStore {
  @observable orders: Order[] = [];
  @observable publishedPrice: number | null = null;
  @observable isTicketOpen: boolean = false;
  @observable currentOrder: Order | null = null;

  @computed
  get depth(): PodTable | null {
    const { orders } = this;
    const user: User = workareaStore.user;
    const mine: Order | undefined = orders.find((o: Order) => o.user === user.email);
    if (!mine)
      return null;
    const filtered = orders.filter((o: Order) => o.type === mine.type);
    // Sort according to the type
    filtered.sort(orderSorter(mine.type));
    // Now convert it to a PodTable
    return filtered.reduce((table: PodTable, order: Order, index: number): PodTable => {
      table[index] = {
        id: index.toString(),
        bid: order.type === OrderTypes.Bid ? order : {} as Order,
        ofr: order.type === OrderTypes.Ofr ? order : {} as Order,
        darkPrice: null,
        spread: null,
        mid: null,
        tenor: order.tenor,
        status: PodRowStatus.Normal,
      };
      return table;
    }, {});
  }

  @computed
  get price(): number | null {
    const { currentOrder } = this;
    if (currentOrder === null)
      return this.publishedPrice;
    return currentOrder.price;
  }

  @computed
  get status(): OrderStatus {
    const user: User | null = workareaStore.user;
    if (user === null)
      return OrderStatus.None;
    const { currentOrder } = this;
    if (!currentOrder)
      return OrderStatus.None;
    if (currentOrder.size === null)
      return OrderStatus.None;
    if (currentOrder.user === user.email)
      return OrderStatus.FullDarkPool | OrderStatus.DarkPool | OrderStatus.Owned;
    if (currentOrder.firm === user.firm)
      return OrderStatus.FullDarkPool | OrderStatus.DarkPool | OrderStatus.Owned;
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
    const entries: MDEntry[] = originalEntries.filter((entry: MDEntry) => !!entry.MDEntrySize);
    const orders: Order[] = entries.map((entry: MDEntry) => Order.fromWAndMDEntry(w, entry, user));
    if (orders.length > 0) {
      const mine: Order | undefined = orders.find((order: Order) => order.user === user.email);
      const bank: Order | undefined = orders.find((order: Order) => order.firm === user.firm);
      if (mine) {
        this.currentOrder = mine;
      } else if (bank) {
        this.currentOrder = bank;
      } else {
        const index: number = orders.findIndex((o: Order) => o.price !== null && o.size !== null);
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
    const key: string = $$(message.Symbol, message.Strategy, message.Tenor, 'DPPx');
    if (message.DarkPrice !== '') {
      this.publishedPrice = Number(message.DarkPrice);
      // Save to the database
      localStorage.setItem(key, message.DarkPrice);
    } else {
      this.publishedPrice = null;
      localStorage.removeItem(key);
    }
  }

  @action.bound
  public connect(currency: string, strategy: string, tenor: string) {
    const signalRManager = SignalRManager.getInstance();
    signalRManager.setDarkPoolPriceListener(currency, strategy, tenor, this.onDarkPoolPricePublished);
    signalRManager.setDarkPoolOrderListener(currency, strategy, tenor, this.onOrderReceived);
    // Read saved value
    const currentValue: string | null = localStorage.getItem($$(currency, strategy, tenor, 'DPPx'));
    if (currentValue !== null) {
      this.publishedPrice = Number(currentValue);
    } else {
      this.publishedPrice = null;
    }
  }

  public static disconnect(currency: string, strategy: string, tenor: string) {
    const signalRManager = SignalRManager.getInstance();
    signalRManager.removeDarkPoolPriceListener(currency, strategy, tenor);
  }

  public async publishPrice(currency: string, strategy: string, tenor: string, price: number | null) {
    const user: User = workareaStore.user;
    if (!user.isbroker)
      throw new Error('non broker users cannot publish prices');
    await API.cancelAllDarkPoolOrder(currency, strategy, tenor);
    // Call the API
    await API.publishDarkPoolPrice(user.email, currency, strategy, tenor, price !== null ? price : '');
    // Update immediately to make it feel faster
    this.publishedPrice = price;
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
  public createOrder(order: DarkPoolOrder) {
    const user: User = workareaStore.user;
    this.closeTicket();
    API.createDarkPoolOrder(order, user);
    // Ideally we should update `currentOrder'
  }

  @action.bound
  public cancel() {
    const user: User = workareaStore.user;
    const { orders } = this;
    const mine: Order | undefined = orders.find((o: Order) => user.email === o.user);
    if (mine)
      API.cancelDarkPoolOrder(mine, user);
    this.currentOrder = null;
  }
}
