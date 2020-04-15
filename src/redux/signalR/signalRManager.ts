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
import { $$ } from 'utils/stringPaster';
import { MDEntry } from 'interfaces/mdEntry';
import { User, OCOModes } from 'interfaces/user';
import { Sides } from 'interfaces/sides';
import userProfileStore from 'mobx/stores/userProfileStore';

import workareaStore from 'mobx/stores/workareaStore';

const ApiConfig = config.Api;
const INITIAL_RECONNECT_DELAY: number = 3000;
const SidesMap: { [key: string]: Sides } = { '1': Sides.Buy, '2': Sides.Sell };

export enum SignalRActions {
  // Messages
  SubscribeForMarketData = 'SubscribeForMarketData',
  UnsubscribeFromMarketData = 'UnsubscribeForMarketData',
  SubscribeForMBMsg = 'SubscribeForMBMsg',
  UnsubscribeFromMBMsg = 'UnsubscribeForMBMsg',
  SubscribeForDarkPoolPx = 'SubscribeForDarkPoolPx',
  UnsubscribeForDarkPoolPx = 'UnsubscribeForDarkPoolPx',
  // Internal
  Disconnected = 'SignalR.Disconnected',
  Connected = 'SignalR.Connected'
}

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

interface Command {
  name: string;
  args: any[];
}

export class SignalRManager<A extends Action = AnyAction> {
  private connection: HubConnection | null;
  private onConnectedListener: ((connection: HubConnection) => void) | null = null;
  private onDisconnectedListener: ((error: any) => void) | null = null;
  /*private onUpdateMarketDataListener: ((data: W) => void) | null = null;
  private onUpdateDarkPoolPxListener: ((data: DarkPoolMessage) => void) | null = null;
  private onUpdateMessageBlotterListener: ((data: Message) => void) | null = null;*/
  private reconnectDelay: number = INITIAL_RECONNECT_DELAY;
  private user: User = {} as User;
  private recordedCommands: Command[] = [];

  private listeners: { [k: string]: (arg: W) => void } = {};
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
          // Replay recorded commands
          this.replayRecorderCommands();
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

  /*private onUpdateMessageBlotter = (message: string): void => {
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
  public static removeFromCache = (orderID: string) => {
    delete SignalRManager.orderCache[orderID];
  };

  public static addToCache = (w: W, user: User) => {
    const entries: MDEntry[] = w.Entries;
    if (entries) {
      const orders: Order[] = entries.map((entry: MDEntry) => Order.fromWAndMDEntry(w, entry, user));
      // This is stupid, but it shuts the compiler warning
      if (orders.length > 0) {
        SignalRManager.orderCache = orders.reduce((cache: { [id: string]: Order }, order: Order) => {
          // Cancelled orders are just for "informational purposes"
          if (order.size === null)
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
  };*/

  /*public static getOrdersForUser = (email: string): Order[] => {
    const { orderCache } = SignalRManager;
    const values: Order[] = Object.values(orderCache);
    return values.filter((order: Order) => order.user === email);
  };*/

  private onUpdateMarketData = (message: string): void => {
    const w: W = JSON.parse(message);
    this.handleWMessage(w);
  };

  private static isEmptyW(w: W): boolean {
    const entries: MDEntry[] = w.Entries;
    if (entries.length < 2)
      return true;
    return (!entries[0].MDEntryPx && !entries[1].MDEntryPx);
  };

  public handleWMessage(w: W) {
    if (w.ExDestination === undefined) {
      if (isPodW(w)) {
        const listener: ((w: W) => void) | undefined = this.listeners[$$(w.Symbol, w.Strategy, w.Tenor)];
        if (listener) {
          listener(w);
        }
      } else {
        const listener: ((w: W) => void) | undefined = this.listeners[$$(w.Symbol, w.Strategy, w.Tenor, 'depth')];
        if (listener) {
          listener(w);
        }
      }
    } else if (w.ExDestination === 'DP' && !SignalRManager.isEmptyW(w)) {
      const listener: ((w: W) => void) | undefined = this.listeners[$$(w.Symbol, w.Strategy, w.Tenor, 'Dp')];
      if (listener) {
        listener(w);
      }
    }
  };

  private onUpdateDarkPoolPx = (rawMessage: string) => {
    const message: DarkPoolMessage = JSON.parse(rawMessage);
    const type: string = $$(message.Symbol, message.Strategy, message.Tenor, 'DpPx');
    document.dispatchEvent(new CustomEvent(type, { detail: message }));
  };

  /*public setOnUpdateDarkPoolPxListener = (fn: (data: DarkPoolMessage) => void) => {
    this.onUpdateDarkPoolPxListener = fn;
  };*/

  public setOnConnectedListener = (fn: (connection: HubConnection) => void) => {
    this.onConnectedListener = fn;
  };

  /*public setOnUpdateMarketDataListener = (fn: (data: W) => void) => {
    this.onUpdateMarketDataListener = fn;
  };

  public setOnUpdateMessageBlotter = (fn: (data: any) => void) => {
    this.onUpdateMessageBlotterListener = fn;
  };*/

  public setOnDisconnectedListener = (fn: (error: any) => void) => {
    this.onDisconnectedListener = fn;
  };

  private replayRecorderCommands() {
    const { recordedCommands } = this;
    recordedCommands.forEach(this.replayCommand);
  }

  private replayCommand(command: Command) {
    const { connection } = this;
    if (connection === null)
      return;
    if (connection.state !== HubConnectionState.Connected)
      return;
    connection.invoke(command.name, ...command.args);
  }

  public removeTOBWListener(symbol: string, strategy: string, tenor: string) {
    const { recordedCommands } = this;
    const key: string = $$(symbol, strategy, tenor);
    const index: number = recordedCommands.findIndex((command: Command) => {
      if (command.name !== SignalRActions.SubscribeForMarketData)
        return false;
      return command.args[0] === symbol && command.args[1] === strategy && command.args[2] === tenor;
    });
    if (index === -1) {
      console.warn(`command does not exist, cannot remove it`);
    } else {
      const { connection } = this;
      if (connection === null)
        return;
      if (connection.state !== HubConnectionState.Connected)
        return;
      connection.invoke(SignalRActions.UnsubscribeFromMarketData, ...recordedCommands[index].args);
      delete this.listeners[key];
      // Update recorded commands
      this.recordedCommands = [...recordedCommands.slice(0, index), ...recordedCommands.slice(index + 1)];
    }
  }

  public setMarketListener(symbol: string, strategy: string, tenor: string, listener: (w: W) => void) {
    const key: string = $$(symbol, strategy, tenor, 'depth');
    // Just add the listener, the rest is done elsewhere
    this.listeners[key] = listener;
  }

  public setTOBWListener(symbol: string, strategy: string, tenor: string, listener: (w: W) => void) {
    const { recordedCommands } = this;
    const key: string = $$(symbol, strategy, tenor);
    // We always save the listener
    this.listeners[key] = listener;
    const command: Command = {
      name: SignalRActions.SubscribeForMarketData,
      args: [symbol, strategy, tenor],
    };
    // Record the command
    recordedCommands.push(command);
    // Try to run the command now
    this.replayCommand(command);
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
    } else {
      console.log('cannot connect to dark pool price');
    }
    return () => null;
  };

  public addDarkPoolOrderListener(symbol: string, strategy: string, tenor: string, listener: (w: W) => void) {
    const key: string = $$(symbol, strategy, tenor, 'Dp');
    // Commands already exists as this is the same as the market update
    this.listeners[key] = listener;
    return () => {
      delete this.listeners[key];
    };
  }

  private handleMessageActions = (message: Message) => {
    const { profile: userProfile } = userProfileStore;
    const ocoMode: OCOModes = userProfile.oco;
    const { user } = this;
    switch (message.OrdStatus) {
      case ExecTypes.Canceled:
        break;
      case ExecTypes.PendingCancel:
        break;
      case ExecTypes.Filled:
        if (ocoMode !== OCOModes.Disabled && message.Username === user.email)
          API.cancelAll(message.Symbol, message.Strategy, SidesMap[message.Side], user);
      // eslint-disable-next-line no-fallthrough
      case ExecTypes.PartiallyFilled:
        if (ocoMode === OCOModes.PartialEx && message.Username === user.email)
          API.cancelAll(message.Symbol, message.Strategy, SidesMap[message.Side], user);
        workareaStore.addRecentExecution(message);
        break;
      default:
        break;
    }
  };

  public setMessagesListener(useremail: any, onMessage: (message: Message) => void) {
    const { connection } = this;
    if (connection) {
      connection.invoke(SignalRActions.SubscribeForMBMsg, useremail);
      connection.on('updateMessageBlotter', (raw: string) => {
        const message: Message = JSON.parse(raw);
        // First call the internal handler
        this.handleMessageActions(message);
        // Now call the setup handler
        onMessage(message);
      });
      return () => {
        connection.invoke(SignalRActions.UnsubscribeFromMBMsg, useremail);
      };
    }
    return () => null;
  }

  /*public loadDepth = (currency: string, strategy: string, user: User) => {
    API.getSnapshot(currency, strategy)
      .then((snapshot: { [k: string]: W } | null) => {
        if (snapshot === null)
          return;
        const keys: string[] = Object.keys(snapshot);
        keys.forEach((tenor: string) => {
          // const w: W = snapshot[tenor];
          // propagateDepth(w, user);
        });
      });
  };*/
}

// Call this to initialize it
SignalRManager.getInstance();

