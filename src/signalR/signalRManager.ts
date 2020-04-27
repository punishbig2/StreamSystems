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
import { OCOModes } from 'interfaces/user';
import { Sides } from 'interfaces/sides';
import userProfileStore from 'mobx/stores/userPreferencesStore';

import workareaStore from 'mobx/stores/workareaStore';

const ApiConfig = config.Api;
const INITIAL_RECONNECT_DELAY: number = 3000;
const SidesMap: { [key: string]: Sides } = { '1': Sides.Buy, '2': Sides.Sell };

export enum SignalRMethods {
  // Messages
  SubscribeForMarketData = 'SubscribeForMarketData',
  UnsubscribeFromMarketData = 'UnsubscribeForMarketData',
  SubscribeForMBMsg = 'SubscribeForMBMsg',
  UnsubscribeFromMBMsg = 'UnsubscribeForMBMsg',
  SubscribeForDarkPoolPx = 'SubscribeForDarkPoolPx',
  UnsubscribeForDarkPoolPx = 'UnsubscribeForDarkPoolPx',
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
  private onDisconnectedListener: ((error: any) => void) | null = null;
  private onConnectedListener: ((connection: HubConnection) => void) | null = null;
  private reconnectDelay: number = INITIAL_RECONNECT_DELAY;
  private recordedCommands: Command[] = [];
  private pendingW: { [k: string]: W } = {};

  private listeners: { [k: string]: (arg: W) => void } = {};
  private static instance: SignalRManager | null = null;

  private dpListeners: { [k: string]: (m: DarkPoolMessage) => void } = {};
  private onMessageListener: (message: Message) => void = () => null;

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
    } else {
      console.error('attempted to connect but the `connection\' object is `null\'');
    }
  };

  private setup = (connection: HubConnection) => {
    if (connection !== null) {
      // Install close handler
      connection.onclose((error?: Error) => {
        if (error)
          console.warn(error);
        if (this.onDisconnectedListener)
          this.onDisconnectedListener(connection);
      });
      connection.onreconnecting((error?: Error) => {
        if (error)
          console.warn(error);
      });
      connection.onreconnected(() => {
        this.setup(connection);
      });
      connection.on('updateMarketData', this.onUpdateMarketData);
      connection.on('updateDarkPoolPx', this.onUpdateDarkPoolPx);
      connection.on('updateMessageBlotter', this.onUpdateMessageBlotter);
    }
  };

  private onUpdateMarketData = (message: string): void => {
    const w: W = JSON.parse(message);
    this.handleWMessage(w);
  };

  private static isEmptyW(w: W): boolean {
    const entries: MDEntry[] = w.Entries;
    if (!entries || entries.length < 2)
      return true;
    return (!entries[0].MDEntryPx && !entries[1].MDEntryPx);
  };

  private combineWs = (w1: W, w2: W) => {
    const [pod, full] = isPodW(w1) ? [w1, w2] : [w2, w1];
    if (full.Entries) {
      const { Entries } = pod;
      full.Entries = [...full.Entries, ...Entries.filter((entry: MDEntry) => entry.MDEntrySize === undefined)];
    } else {
      full.Entries = pod.Entries;
    }
    return full;
  };

  public handleWMessage(w: W) {

    if (w.ExDestination === undefined) {
      const key: string = $$(w.Symbol, w.Strategy, w.Tenor);
      if (!this.pendingW[key]) {
        this.pendingW[key] = w;
      } else {
        const listener: ((w: W) => void) | undefined = this.listeners[key];
        if (listener) {
          listener(this.combineWs(w, this.pendingW[key]));
          // Remove it
          delete this.pendingW[key];
        }
      }
    } else if (w.ExDestination === 'DP' && !SignalRManager.isEmptyW(w)) {
      const listener: ((w: W) => void) | undefined = this.listeners[$$(w.Symbol, w.Strategy, w.Tenor, 'Dp')];
      if (listener) {
        listener(w);
      }
    }
  };

  private onUpdateMessageBlotter(rawMessage: string) {
    const message: Message = JSON.parse(rawMessage);
    // First call the internal handler
    this.handleMessageActions(message);
    // Now call the setup handler
    this.onMessageListener(message);
  }

  private onUpdateDarkPoolPx = (rawMessage: string) => {
    const message: DarkPoolMessage = JSON.parse(rawMessage);
    const key: string = $$(message.Symbol, message.Strategy, message.Tenor);
    const listener: ((m: DarkPoolMessage) => void) | undefined = this.dpListeners[key];
    if (listener) {
      listener(message);
    }
  };

  public setOnConnectedListener = (fn: (connection: HubConnection) => void) => {
    this.onConnectedListener = fn;
  };

  public setOnDisconnectedListener = (fn: (error: any) => void) => {
    this.onDisconnectedListener = fn;
  };

  private replayRecorderCommands() {
    const { recordedCommands } = this;
    recordedCommands.forEach(this.replayCommand);
  }

  private replayCommand(command: Command) {
    this.invoke(command.name, ...command.args);
  }

  public removeTOBWListener(symbol: string, strategy: string, tenor: string) {
    const { recordedCommands } = this;
    const key: string = $$(symbol, strategy, tenor);
    const index: number = recordedCommands.findIndex((command: Command) => {
      if (command.name !== SignalRMethods.SubscribeForMarketData)
        return false;
      return command.args[0] === symbol && command.args[1] === strategy && command.args[2] === tenor;
    });
    if (index === -1) {
      console.warn(`command does not exist, cannot remove it`);
    } else {
      const command: Command = recordedCommands[index];
      // Unsubscribe now that we know which one exactyl
      this.invoke(SignalRMethods.UnsubscribeFromMarketData, ...command.args);
      // Remove the listener
      delete this.listeners[key];
      // Update recorded commands
      this.recordedCommands = [...recordedCommands.slice(0, index), ...recordedCommands.slice(index + 1)];
    }
  }

  public setMarketListener(symbol: string, strategy: string, tenor: string, listener: (w: W) => void) {
    const { recordedCommands } = this;
    const key: string = $$(symbol, strategy, tenor);
    // Just add the listener, the rest is done elsewhere
    this.listeners[key] = listener;
    const command: Command = {
      name: SignalRMethods.SubscribeForMarketData,
      args: [symbol, strategy, tenor],
    };
    // Record the command
    recordedCommands.push(command);
    // Try to run the command now
    this.replayCommand(command);
  }

  public setTOBWListener(symbol: string, strategy: string, tenor: string, listener: (w: W) => void) {
    const key: string = $$(symbol, strategy, tenor);
    // We always save the listener
    this.listeners[key] = listener;
  }

  public removeDarkPoolPriceListener = (currency: string, strategy: string, tenor: string) => {
    if (currency === '' || strategy === '' || tenor === '' || !currency || !strategy || !tenor)
      return;
    const key: string = $$(currency, strategy, tenor);
    // Remove it from the map
    delete this.dpListeners[key];
    // Invoke ths Signal R method
    this.invoke(SignalRMethods.UnsubscribeForDarkPoolPx, currency, strategy, tenor);
  };

  public setDarkPoolPriceListener = (currency: string, strategy: string, tenor: string, fn: (message: DarkPoolMessage) => void) => {
    if (currency === '' || strategy === '' || tenor === '' || !currency || !strategy || !tenor)
      return;
    const { recordedCommands } = this;
    const key: string = $$(currency, strategy, tenor);
    const command: Command = {
      name: SignalRMethods.SubscribeForDarkPoolPx,
      args: [currency, strategy, tenor],
    };
    recordedCommands.push(command);
    // Update the listeners map
    this.dpListeners[key] = fn;
    // Try to execute it now
    this.replayCommand(command);
  };

  public setDarkPoolOrderListener(symbol: string, strategy: string, tenor: string, listener: (w: W) => void) {
    const key: string = $$(symbol, strategy, tenor, 'Dp');
    // Commands already exists as this is the same as the market update
    this.listeners[key] = listener;
    return () => {
      delete this.listeners[key];
    };
  }

  private handleMessageActions = (message: Message) => {
    const { preferences: userProfile } = userProfileStore;
    const { user } = workareaStore;
    const ocoMode: OCOModes = userProfile.oco;
    if (message.Username !== user.email)
      return;
    switch (message.OrdStatus) {
      case ExecTypes.Canceled:
        break;
      case ExecTypes.PendingCancel:
        break;
      case ExecTypes.Filled:
        if (ocoMode !== OCOModes.Disabled && message.Username === user.email)
          API.cancelAll(message.Symbol, message.Strategy, SidesMap[message.Side]);
      // eslint-disable-next-line no-fallthrough
      case ExecTypes.PartiallyFilled:
        if (ocoMode === OCOModes.PartialEx && message.Username === user.email)
          API.cancelAll(message.Symbol, message.Strategy, SidesMap[message.Side]);
        if (message.Username === user.email)
          workareaStore.addRecentExecution(message);
        break;
      default:
        break;
    }
  };

  public removeMessagesListener() {
    const { recordedCommands } = this;
    const index: number = recordedCommands.findIndex((cmd: Command) => cmd.name === SignalRMethods.SubscribeForMBMsg);
    if (index !== -1) {
      this.recordedCommands = [
        ...recordedCommands.slice(0, index),
        ...recordedCommands.slice(index + 1),
      ];
    }
    this.invoke(SignalRMethods.UnsubscribeFromMBMsg, '*');
  };

  public setMessagesListener(useremail: any, onMessage: (message: Message) => void) {
    const { recordedCommands } = this;
    recordedCommands.push({
      name: SignalRMethods.SubscribeForMBMsg,
      args: ['*'],
    });
    this.onMessageListener = onMessage;
  }

  private invoke(name: string, ...args: any[]) {
    const { connection } = this;
    if (connection === null)
      return;
    if (connection.state !== HubConnectionState.Connected) {
      console.warn('attempting to invoke a signal R command with an inactive connection');
      return;
    }
    connection.invoke(name, ...args);
  }
}

// Call this to initialize it
SignalRManager.getInstance();

