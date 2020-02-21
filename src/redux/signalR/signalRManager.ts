import {HttpTransportType, HubConnection, HubConnectionBuilder, LogLevel, HubConnectionState} from '@microsoft/signalr';
import config from 'config';
import {Message, DarkPoolMessage, ExecTypes} from 'interfaces/message';
import {W, isPodW, MessageTypes} from 'interfaces/w';
import {Action, AnyAction} from 'redux';
import {API} from 'API';
import {propagateDepth} from 'utils/messageHandler';
import {$$} from 'utils/stringPaster';
import {SignalRActions} from 'redux/constants/signalRConstants';
import {MDEntry, OrderTypes} from 'interfaces/mdEntry';
import {Order} from 'interfaces/order';
import {getAuthenticatedUser} from 'utils/getCurrentUser';
import {User} from 'interfaces/user';
import deepEqual from 'deep-equal';

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
    const {connection} = this;
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
      connection.on('updateMessageBlotter', this.synchronize(this.onUpdateMessageBlotter));
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

  private static addToCache = (w: W) => {
    const entries: MDEntry[] = w.Entries;
    const user: User = getAuthenticatedUser();
    if (entries) {
      const orders: Order[] = entries.map((entry: MDEntry) => Order.fromWAndMDEntry(w, entry, user));
      // This is stupid, but it shuts the compiler warning
      if (orders.length > 0) {
        SignalRManager.orderCache = orders.reduce((cache: { [id: string]: Order }, order: Order) => {
          const key: string = order.orderId ? order.orderId : $$(order.uid(), order.type);
          if (order.orderId !== undefined)
            cache[key] = order;
          return cache;
        }, SignalRManager.orderCache);
      }
    }
  };

  public static getDepthOfTheBook = (symbol: string, strategy: string, tenor: string, type: OrderTypes) => {
    const {orderCache} = SignalRManager;
    const values: Order[] = Object.values(orderCache);
    return values.filter((order: Order) => {
      return order.symbol === symbol
        && order.strategy === strategy
        && order.tenor === tenor
        && order.type === type;
    });
  };

  public static getOrdersForUser = (email: string): Order[] => {
    const {orderCache} = SignalRManager;
    const values: Order[] = Object.values(orderCache);
    return values.filter((order: Order) => order.user === email);
  };

  private onUpdateMarketData = (message: string): void => {
    const w: W = JSON.parse(message);
    if (SignalRManager.isCollapsedW(w))
      return;
    if (isPodW(w)) {
      this.emitPodWEvent(w);
    } else {
      SignalRManager.addToCache(w);
      propagateDepth(w);
    }
    // Dispatch the action
    if (this.onUpdateMarketDataListener !== null) {
      const fn: (data: W) => void = this.onUpdateMarketDataListener;
      fn(w);
    }
  };

  private onUpdateDarkPoolPx = (rawMessage: string) => {
    const message: DarkPoolMessage = JSON.parse(rawMessage);
    const type: string = $$(message.Symbol, message.Strategy, message.Tenor, 'DpPx');
    document.dispatchEvent(new CustomEvent(type, {detail: message}));
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

  private emitPodWEvent = (w: W) => {
    // Now that we know it's the right time, create and dispatch the event
    const type: string = $$(w.Symbol, w.Strategy, w.Tenor);
    const event: CustomEvent<W> = new CustomEvent<W>(type, {detail: w, bubbles: false, cancelable: false});
    // Dispatch it now
    document.dispatchEvent(event);
  };

  public addPodRowListener(symbol: string, strategy: string, tenor: string, listener: (w: W) => void) {
    const connection: HubConnection | null = this.connection;
    const user: User = getAuthenticatedUser();
    if (connection !== null && connection.state === HubConnectionState.Connected) {
      const type: string = $$(symbol, strategy, tenor);
      const listenerWrapper = (event: CustomEvent<W>) => {
        // Call the installed listener
        listener(event.detail);
      };
      document.addEventListener(type, listenerWrapper as EventListener);
      // Now subscribe to the events
      setTimeout(() => {
        connection.invoke(SignalRActions.SubscribeForMarketData, symbol, strategy, tenor);
        // Now get the "snapshots"
        API.getTOBSnapshot(symbol, strategy, tenor)
          .then((w: W | null) => {
            if (w === null) {
              this.emitPodWEvent({
                MsgType: MessageTypes.W,
                TransactTime: Date.now() / 1000,
                User: user.email,
                Tenor: tenor,
                Strategy: strategy,
                Symbol: symbol,
                NoMDEntries: 2,
                Entries: [],
                ExDestination: undefined,
                '9712': 'TOB',
              });
            } else {
              SignalRManager.addToCache(w);
              this.emitPodWEvent({...w, '9712': 'TOB'});
            }
          });
        API.getSnapshot(symbol, strategy, tenor)
          .then((w: W | null) => {
            if (w === null)
              return;
            SignalRManager.addToCache(w);
            propagateDepth(w);
          });
      }, 0);

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
    const {connection} = this;
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
}

