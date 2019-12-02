import {HttpTransportType, HubConnection, HubConnectionBuilder, LogLevel} from '@microsoft/signalr';
import config from 'config';
import {Message} from 'interfaces/message';
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

interface Transport {
  transport: string;
  transferFormats: string[];
}

interface NegotiationData {
  availableTransports: { transports: Transport[] };
  connectionId: string;
}

export class SignalRManager<A extends Action = AnyAction> {
  private connection: HubConnection | null;
  private onConnectedListener: ((connection: HubConnection) => void) | null = null;
  private onDisconnectedListener: ((error: any) => void) | null = null;
  private onUpdateMarketDataListener: ((data: W) => void) | null = null;
  private onUpdateMessageBlotterListener: ((data: Message) => void) | null = null;
  private reconnectDelay: number = INITIAL_RECONNECT_DELAY;

  constructor() {
    this.connection = SignalRManager.createConnection();
  }

  static createConnection = () => new HubConnectionBuilder()
    .withUrl(`http://${ApiConfig.Host}/liveUpdateSignalRHub`, HttpTransportType.LongPolling)
    .configureLogging(LogLevel.None)
    .withAutomaticReconnect()
    .build()
  ;

  public connect = () => {
    const {connection} = this;
    if (connection !== null) {
      connection.serverTimeoutInMilliseconds = 10000;
      connection.keepAliveIntervalInMilliseconds = 8000;
      connection.start()
        .then(() => {
          this.setup();
          // Call the listener if available
          if (this.onConnectedListener !== null)
            this.onConnectedListener(connection);
          this.reconnectDelay = INITIAL_RECONNECT_DELAY;
        })
        .catch(console.log);
    }
  };

  private setup = () => {
    const {connection} = this;
    if (connection !== null) {
      // Install close handler
      connection.onclose(this.onClose);
      // Install update market handler
      connection.on('updateMarketData', this.onUpdateMarket);
      connection.on('updateMessageBlotter', this.onUpdateMessageBlotter);
    }
  };

  public onUpdateMessageBlotter = (message: string): void => {
    const data: Message = JSON.parse(message);
    // Dispatch the action
    if (this.onUpdateMessageBlotterListener !== null) {
      this.onUpdateMessageBlotterListener(data);
    }
  };

  public onUpdateMarket = (message: string): void => {
    const data: W = JSON.parse(message);
    // Dispatch the action
    if (this.onUpdateMarketDataListener !== null) {
      this.onUpdateMarketDataListener(data);
    }
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

  private onClose = (error: any) => {
    // const {connection} = this;
    // Notify disconnection
    if (this.onDisconnectedListener !== null) {
      this.onDisconnectedListener(error);
    }
    /*setTimeout(() => {
      // Stop listening to market row
      connection.off('updateMessageBlotter');
      connection.off('updateMarketData');
      // Restart connection
      this.connection = SignalRManager.createConnection();
      this.reconnectDelay *= 2;
      // Connect
      this.connect();
    }, this.reconnectDelay);*/
  };
}
