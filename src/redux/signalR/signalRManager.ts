import {HttpTransportType, HubConnection, HubConnectionBuilder, LogLevel, HubConnectionState} from '@microsoft/signalr';
import config from 'config';
import {Message, DarkPoolMessage, ExecTypes} from 'interfaces/message';
import {W, isPodW} from 'interfaces/w';
import {Action, AnyAction} from 'redux';
import {API} from 'API';
import {propagateDepth} from 'utils/messageHandler';
import {$$} from 'utils/stringPaster';
import {SignalRActions} from 'redux/constants/signalRConstants';
import {MDEntry, OrderTypes} from 'interfaces/mdEntry';
import {Order} from 'interfaces/order';
import {getAuthenticatedUser} from 'utils/getCurrentUser';
import {User} from 'interfaces/user';

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

  private static dispatchedWs: string[] = [];
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
      connection.on('updateMessageBlotter', this.onUpdateMessageBlotter);
      connection.on('updateMarketData', this.onUpdateMarketData);
      connection.on('updateDarkPoolPx', this.onUpdateDarkPoolPx);
    }
  };

  private onUpdateMessageBlotter = (message: string): void => {
    const data: Message = JSON.parse(message);
    if (data.OrdStatus === ExecTypes.Canceled) {
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
        const key: string = $$(data.Symbol, data.Strategy, data.Tenor, type);
        // Remove the order from the cache
        delete SignalRManager.orderCache[key];
      }
    }
    // Dispatch the action
    if (this.onUpdateMessageBlotterListener !== null) {
      const fn: (message: Message) => void = this
        .onUpdateMessageBlotterListener;
      fn(data);
    }
  };

  private static isCollapsedW = (w: W): boolean => {
    const dispatched = SignalRManager.dispatchedWs;
    const cacheKey: string = $$(w.Symbol, w.Strategy, w.Tenor, w.TransactTime, isPodW(w) ? 'TOB' : 'FULL');
    if (dispatched.includes(cacheKey))
      return true;
    dispatched.unshift(cacheKey);
    // update it
    dispatched.splice(10, dispatched.length - 10);
    // We have not collapsed it yet
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
          const key: string = $$(order.symbol, order.strategy, order.tenor, order.type);
          if (order.orderId !== undefined)
            cache[key] = order;
          return cache;
        }, SignalRManager.orderCache);
      }
    }
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
    }
    // Dispatch the action
    if (this.onUpdateMarketDataListener !== null) {
      const fn: (data: W) => void = this.onUpdateMarketDataListener;
      fn(w);
    }
  };

  private onUpdateDarkPoolPx = (message: string) => {
    if (this.onUpdateDarkPoolPxListener) {
      this.onUpdateDarkPoolPxListener(JSON.parse(message));
    }
  };

  public setOnUpdateDarkPoolPxListener = (
    fn: (data: DarkPoolMessage) => void,
  ) => {
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
    if (connection !== null && connection.state === HubConnectionState.Connected) {
      const type: string = $$(symbol, strategy, tenor);
      const listenerWrapper = (event: CustomEvent<W>) => {
        // Call the installed listener
        listener(event.detail);
      };
      connection.invoke(SignalRActions.SubscribeForMarketData, symbol, strategy, tenor);
      // Add the listener so that they are ready to receive
      document.addEventListener(type, listenerWrapper as EventListener);
      // Now get the "snapshots"
      API.getTOBSnapshot(symbol, strategy, tenor)
        .then((w: W | null) => {
          if (w === null)
            return;
          SignalRManager.addToCache(w);
          this.emitPodWEvent({...w, '9712': 'TOB'});
        });
      API.getSnapshot(symbol, strategy, tenor)
        .then((w: W | null) => {
          if (w === null)
            return;
          SignalRManager.addToCache(w);
          propagateDepth(w);
        });
      return () => {
        document.removeEventListener(type, listenerWrapper as EventListener);
        // Unsubscribe from the market data feed
        connection.invoke(SignalRActions.UnsubscribeFromMarketData, symbol, strategy, tenor);
      };
    } else {
      throw new Error('you are not connected to signal R, this should never happen');
    }
  }
}

