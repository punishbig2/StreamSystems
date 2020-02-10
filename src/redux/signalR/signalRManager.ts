import {HttpTransportType, HubConnection, HubConnectionBuilder, LogLevel} from '@microsoft/signalr';
import config from 'config';
import {Message, DarkPoolMessage} from 'interfaces/message';
import {W} from 'interfaces/w';
import {Action, AnyAction} from 'redux';
import {API} from 'API';

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
    // Dispatch the action
    if (this.onUpdateMessageBlotterListener !== null) {
      const fn: (message: Message) => void = this
        .onUpdateMessageBlotterListener;
      fn(data);
    }
  };

  private onUpdateMarketData = (message: string): void => {
    const data: W = JSON.parse(message);
    if (data['9712'] === 'TOB')
      this.emitPodWEvent(data);
    // Dispatch the action
    if (this.onUpdateMarketDataListener !== null) {
      const fn: (data: W) => void = this.onUpdateMarketDataListener;
      setTimeout(() => {
        fn(data);
      }, 0);
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
    const type: string = `${w.Symbol}/${w.Strategy}/${w.Tenor}`;
    const event: CustomEvent<W> = new CustomEvent<W>(type, {detail: w});
    // Dispatch it now
    document.dispatchEvent(event);
  };

  public addPodRowListener(symbol: string, strategy: string, tenor: string, listener: (w: W) => void) {
    API.getTOBSnapshot(symbol, strategy, tenor)
      .then((w: W | null) => {
        if (w === null)
          return;
        this.emitPodWEvent(w);
      });
    const type: string = `${symbol}/${strategy}/${tenor}`;
    const listenerWrapper = (event: Event) => {
      const customEvent: CustomEvent<W> = event as CustomEvent<W>;
      // Probably not needed because it's on the document?
      event.stopImmediatePropagation();
      event.stopPropagation();
      // Call the installed listener
      listener(customEvent.detail);
    };
    document.addEventListener(type, listenerWrapper, true);
    return () => {
      document.removeEventListener(type, listenerWrapper, true);
    };
  }
}

