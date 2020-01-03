import {HttpTransportType, HubConnection, HubConnectionBuilder, LogLevel} from '@microsoft/signalr';
import config from 'config';
import {Message, DarkPoolMessage} from 'interfaces/message';
import {W} from 'interfaces/w';
import {Action, AnyAction} from 'redux';

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
  Close = 7,
}

export class SignalRManager<A extends Action = AnyAction> {
  private connection: HubConnection | null;
  private onConnectedListener: ((connection: HubConnection) => void) | null = null;
  private onDisconnectedListener: ((error: any) => void) | null = null;
  private onUpdateMarketDataListener: ((data: W) => void) | null = null;
  private onUpdateDarkPoolPxListener: ((data: DarkPoolMessage) => void) | null = null;
  private onUpdateMessageBlotterListener: ((data: Message) => void) | null = null;
  private reconnectDelay: number = INITIAL_RECONNECT_DELAY;

  constructor() {
    const connection: HubConnection = SignalRManager.createConnection();
    connection.serverTimeoutInMilliseconds = 3600000;
    connection.keepAliveIntervalInMilliseconds = 8000;
    // Export to class wide variable
    this.connection = connection;
  }

  static createConnection = () => new HubConnectionBuilder()
    .withUrl(
      `http://${ApiConfig.Host}/liveUpdateSignalRHub`,
      HttpTransportType.WebSockets,
    )
    .withAutomaticReconnect([5, 60, 120])
    .configureLogging(LogLevel.None)
    .build()
  ;

  public connect = () => {
    const {connection} = this;
    if (connection !== null) {
      connection.start()
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
      this.onUpdateMessageBlotterListener(data);
    }
  };

  private onUpdateMarketData = (message: string): void => {
    const data: W = JSON.parse(message);
    // Dispatch the action
    if (this.onUpdateMarketDataListener !== null) {
      this.onUpdateMarketDataListener(data);
    }
  };

  private onUpdateDarkPoolPx = (message: string) => {
    console.log(message);
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
}
