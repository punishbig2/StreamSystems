import {
  HttpTransportType,
  HubConnection,
  HubConnectionBuilder,
  LogLevel,
  HubConnectionState,
} from '@microsoft/signalr';
import config from 'config';
import { Message, DarkPoolMessage, ExecTypes } from 'interfaces/message';
import { W, isPodW } from 'interfaces/w';
import { Action, AnyAction } from 'redux';
import { API } from 'API';
import { propagateDepth } from 'utils/messageHandler';
import { $$ } from 'utils/stringPaster';
import { SignalRActions } from 'redux/constants/signalRConstants';
import { MDEntry, OrderTypes } from 'interfaces/mdEntry';
import { Order } from 'interfaces/order';
import { User } from 'interfaces/user';
import deepEqual from 'deep-equal';
import { PodTable } from 'interfaces/podTable';
import { orderArrayToPodTableReducer } from 'utils/dataParser';

const ApiConfig = config.Api;
const INITIAL_RECONNECT_DELAY: number = 3000;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
enum SignalRMessageTypes {
  Invocation = 1,
  StreamItem = 2,
  Completion = 3,
  StreamInvocation = 4,
  CancelInvocation = 5,
  Ping = 6,
  Close = 7
}

export class SignalRManager<A extends Action = AnyAction> {
  private connection: HubConnection | null;
  private onConnectedListener: ((connection: HubConnection) => void) | null = null;
  private onDisconnectedListener: ((error: any) => void) | null = null;
  private onUpdateMarketDataListener: ((data: W) => void) | null = null;
  private onUpdateDarkPoolPxListener: ((data: DarkPoolMessage) => void) | null = null;
  private onUpdateMessageBlotterListener: ((data: Message) => void) | null = null;
  private reconnectDelay: number = INITIAL_RECONNECT_DELAY;
  private user: User = {} as User;

  private static dispatchedWs: { [key: string]: W } = {};
  private static orderCache: { [id: string]: Order } = {};

  private static instance: SignalRManager | null = null;

  private constructor() {
    const connection: HubConnection = SignalRManager.createConnection();
    connection.serverTimeoutInMilliseconds = 3600000;
    connection.keepAliveIntervalInMilliseconds = 8000;
    // Export to class wide variable
    this.connection = connection;
  }

  public setUser = (user: User) => {
    this.user = user;
  };

  static getInstance = (): SignalRManager => {
    if (SignalRManager.instance !== null)
      return SignalRManager.instance;
    SignalRManager.instance = new SignalRManager();
    return SignalRManager.instance;
  };

  static createConnection = () =>
    new HubConnectionBuilder()
      .withUrl(
        `http://${ApiConfig.Host}/liveUpdateSignalRHub`,
        HttpTransportType.WebSockets,
      )
      .withAutomaticReconnect([5, 60, 120])
      .configureLogging(LogLevel.None)
      .build();

  public connect = () => {
    const { connection } = this;
    if (connection !== null) {
      connection
        .start()
        .then(() => {
          this.setup(connection);
          // Call the listener if available
          if (this.onConnectedListener !== null)
            this.onConnectedListener(connection);
          this.reconnectDelay = INITIAL_RECONNECT_DELAY;
        })
        .catch(console.log);
    }
  };

  private setup = (connection: HubConnection) => {
    if (connection !== null) {
      // Install close handler
      connection.onclose((error?: Error) => {
        if (this.onDisconnectedListener) {
          this.onDisconnectedListener(connection);
        }
      });
      connection.onreconnecting((error?: Error) => {
        console.log(error);
      });
      // Install update market handler
      // connection.on('updateMessageBlotter', this.synchronize(this.onUpdateMessageBlotter));
      connection.on('updateMarketData', this.synchronize(this.onUpdateMarketData));
      connection.on('updateDarkPoolPx', this.synchronize(this.onUpdateDarkPoolPx));
    }
  };

  /**
   * Make these callbacks run exactly when they should, i.e. after all events have
   * been processed in the corresponding tick of the clock
   *
   * @param fn
   */
  private synchronize = (fn: (...args: any[]) => any) =>
    (...args: any[]) => {
      setTimeout(() => fn(...args), 0);
    };

  private onUpdateMessageBlotter = (message: string): void => {
    const data: Message = JSON.parse(message);
    if (data.OrdStatus === ExecTypes.Canceled || (data.OrdStatus === ExecTypes.Filled)) {
      const type: OrderTypes = (() => {
        switch (data.Side) {
          case '1':
            return OrderTypes.Bid;
          case '2':
            return OrderTypes.Ofr;
          default:
            return OrderTypes.Invalid;
        }
      })();
      if (type !== OrderTypes.Invalid) {
        const key: string = data.OrderID;
        // Remove the order from the cache
        delete SignalRManager.orderCache[key];
      } else {
        throw new Error('invalid orders cannot be cached, so no sense in removing them');
      }
    }
    if (this.onUpdateMessageBlotterListener !== null) {
      this.onUpdateMessageBlotterListener(data);
    }
  };

  private static isCollapsedW = (w: W): boolean => {
    const cacheKey: string = $$(w.Symbol, w.Strategy, w.Tenor, w.TransactTime, isPodW(w) ? 'TOB' : 'FULL');
    if (SignalRManager.dispatchedWs[cacheKey] !== undefined && deepEqual(w, SignalRManager.dispatchedWs[cacheKey]))
      return true;
    SignalRManager.dispatchedWs[cacheKey] = w;
    return false;
  };

  public static addToCache = (w: W, user: User) => {
    const entries: MDEntry[] = w.Entries;
    if (entries) {
      const orders: Order[] = entries.map((entry: MDEntry) => Order.fromWAndMDEntry(w, entry, user));
      // This is stupid, but it shuts the compiler warning
      if (orders.length > 0) {
        SignalRManager.orderCache = orders.reduce((cache: { [id: string]: Order }, order: Order) => {
          // Cancelled orders are just for "informational purposes"
          if (order.isCancelled())
            return cache;
          if (order.orderId !== undefined)
            cache[order.orderId] = order;
          return cache;
        }, SignalRManager.orderCache);
      }
    }
  };

  public static getDepth = (symbol: string, strategy: string, tenor: string, type: OrderTypes): Order[] => {
    const { orderCache } = SignalRManager;
    const values: Order[] = Object.values(orderCache);
    const unsorted: Order[] = values.filter((order: Order) => {
      return order.symbol === symbol
        && order.strategy === strategy
        && order.tenor === tenor
        && order.type === type;
    });
    return unsorted.sort((o1: Order, o2: Order) => {
      if (o1.type !== o2.type)
        throw new Error('cannot sort orders of different types');
      if (o1.type === OrderTypes.Bid) {
        if (o1.price !== null && o2.price !== null) {
          if (o1.price > o2.price) {
            return o1.price - o2.price;
          }
        }
        return o1.timestamp - o2.timestamp;
      } else if (o1.type === OrderTypes.Ofr) {
        if (o1.price !== null && o2.price !== null) {
          if (o1.price < o2.price) {
            return o1.price - o2.price;
          }
        }
        return o1.timestamp - o2.timestamp;
      } else {
        throw new Error('invalid order types for sorting');
      }
    });
  };

  public static getDepthOfTheBook = (symbol: string, strategy: string, tenor: string): PodTable => {
    const orders: Order[] = [
      ...SignalRManager.getDepth(symbol, strategy, tenor, OrderTypes.Bid),
      ...SignalRManager.getDepth(symbol, strategy, tenor, OrderTypes.Ofr),
    ];
    return orders.reduce(orderArrayToPodTableReducer, {});
  };

  public static getOrdersForUser = (email: string): Order[] => {
    const { orderCache } = SignalRManager;
    const values: Order[] = Object.values(orderCache);
    return values.filter((order: Order) => order.user === email);
  };

  private onUpdateMarketData = (message: string): void => {
    const w: W = JSON.parse(message);
    if (w.ExDestination === undefined) {
      if (SignalRManager.isCollapsedW(w))
        return;
      if (isPodW(w)) {
        this.emitPodWEvent(w);
      } else {
        SignalRManager.addToCache(w, this.user);
        propagateDepth(w, this.user);
      }
      // Dispatch the action
      /*if (this.onUpdateMarketDataListener !== null) {
        const fn: (data: W) => void = this.onUpdateMarketDataListener;
        console.log(w);
        fn(w);
      }*/
    } else if (w.ExDestination === 'DP') {
      this.emitDarkPoolOrderWEvent(w);
    }
  };

  private onUpdateDarkPoolPx = (rawMessage: string) => {
    const message: DarkPoolMessage = JSON.parse(rawMessage);
    const type: string = $$(message.Symbol, message.Strategy, message.Tenor, 'DpPx');
    document.dispatchEvent(new CustomEvent(type, { detail: message }));
  };

  public setOnUpdateDarkPoolPxListener = (fn: (data: DarkPoolMessage) => void) => {
    this.onUpdateDarkPoolPxListener = fn;
  };

  public setOnConnectedListener = (fn: (connection: HubConnection) => void) => {
    this.onConnectedListener = fn;
  };

  public setOnUpdateMarketDataListener = (fn: (data: W) => void) => {
    this.onUpdateMarketDataListener = fn;
  };

  public setOnUpdateMessageBlotter = (fn: (data: any) => void) => {
    this.onUpdateMessageBlotterListener = fn;
  };

  public setOnDisconnectedListener = (fn: (error: any) => void) => {
    this.onDisconnectedListener = fn;
  };

  private emitDarkPoolOrderWEvent = (w: W) => {
    // Now that we know it's the right time, create and dispatch the event
    const type: string = $$(w.Symbol, w.Strategy, w.Tenor, 'Dp');
    const event: CustomEvent<W> = new CustomEvent<W>(type, { detail: w, bubbles: false, cancelable: false });
    // Dispatch it now
    document.dispatchEvent(event);
  };

  public emitPodWEvent = (w: W) => {
    // Now that we know it's the right time, create and dispatch the event
    const type: string = $$(w.Symbol, w.Strategy, w.Tenor);
    const event: CustomEvent<W> = new CustomEvent<W>(type, { detail: w, bubbles: false, cancelable: false });
    // Dispatch it now
    document.dispatchEvent(event);
  };

  public addPodRowListener(symbol: string, strategy: string, tenor: string, listener: (w: W) => void) {
    const connection: HubConnection | null = this.connection;
    if (connection !== null && connection.state === HubConnectionState.Connected) {
      const type: string = $$(symbol, strategy, tenor);
      const listenerWrapper = (event: CustomEvent<W>) => {
        // Call the installed listener
        listener(event.detail);
      };
      document.addEventListener(type, listenerWrapper as EventListener);
      connection.invoke(SignalRActions.SubscribeForMarketData, symbol, strategy, tenor);
      return () => {
        document.removeEventListener(type, listenerWrapper as EventListener);
        // Unsubscribe from the market data feed
        connection.invoke(SignalRActions.UnsubscribeFromMarketData, symbol, strategy, tenor);
      };
    } else {
      throw new Error('you are not connected to signal R, this should never happen');
    }
  }

  public addDarkPoolPxListener = (symbol: string, strategy: string, tenor: string, fn: (message: DarkPoolMessage) => void) => {
    const { connection } = this;
    const type: string = $$(symbol, strategy, tenor, 'DpPx');

    const listenerWrapper = (event: CustomEvent<DarkPoolMessage>) => {
      fn(event.detail);
    };

    document.addEventListener(type, listenerWrapper as EventListener);
    if (connection !== null && connection.state === HubConnectionState.Connected) {
      connection.invoke(SignalRActions.SubscribeForDarkPoolPx, symbol, strategy, tenor);
      return () => {
        document.removeEventListener(type, listenerWrapper as EventListener);
        connection.invoke(SignalRActions.UnsubscribeForDarkPoolPx, symbol, strategy, tenor);
      };
    }
    return () => null;
  };

  public addDarkPoolOrderListener(symbol: string, strategy: string, tenor: string, fn: (w: W) => void) {
    const type: string = $$(symbol, strategy, tenor, 'Dp');
    const listenerWrapper = (event: CustomEvent<W>) => {
      fn(event.detail);
    };
    API.getDarkPoolSnapshot(symbol, strategy, tenor)
      .then((w: W | null) => {
        if (w !== null) {
          this.emitDarkPoolOrderWEvent(w);
        }
      });
    document.addEventListener(type, listenerWrapper as EventListener);
    return () => {
      document.removeEventListener(type, listenerWrapper as EventListener);
    };
  }

  public setMessagesListener(useremail: any, onMessage: (message: Message) => void) {
    const { connection } = this;
    if (connection) {
      connection.invoke(SignalRActions.SubscribeForMBMsg, useremail);
      connection.on('updateMessageBlotter', (message: any) => {
        onMessage(message);
      });
      return () => {
        connection.invoke(SignalRActions.UnsubscribeFromMBMsg, useremail);
      };
    }
    return () => null;
  }

  public loadDepth = (currency: string, strategy: string, user: User) => {
    API.getSnapshot(currency, strategy)
      .then((snapshot: { [k: string]: W } | null) => {
        if (snapshot === null)
          return;
        const keys: string[] = Object.keys(snapshot);
        keys.forEach((tenor: string) => {
          const w: W = snapshot[tenor];
          SignalRManager.addToCache(w, user);
          propagateDepth(w, user);
        });
      });
  };
}

// Call this to initialize it
SignalRManager.getInstance();

