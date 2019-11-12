import {HubConnection, HubConnectionBuilder} from '@microsoft/signalr';
import config from 'config';
import {Message} from 'interfaces/md';
import {MessageBlotterEntry} from 'interfaces/messageBlotterEntry';
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
  connection: HubConnection;
  onConnectedListener: ((connection: HubConnection) => void) | null = null;
  onDisconnectedListener: (() => void) | null = null;
  onUpdateMarketDataListener: ((data: Message) => void) | null = null;
  onUpdateMessageBlotterListener: ((data: MessageBlotterEntry) => void) | null = null;
  reconnectDelay: number = INITIAL_RECONNECT_DELAY;

  constructor() {
    this.connection = SignalRManager.createConnection();
  }

  static createConnection = () => new HubConnectionBuilder()
    .withUrl(`http://${ApiConfig.Host}/liveUpdateSignalRHub`)
    .build()
  ;

  connect = () => {
    const {connection} = this;
    connection.serverTimeoutInMilliseconds = 180000;
    connection.keepAliveIntervalInMilliseconds = 8000;
    connection.start()
      .then(() => {
        this.setup();
        // Call the listener if available
        if (this.onConnectedListener !== null)
          this.onConnectedListener(connection);
        this.reconnectDelay = INITIAL_RECONNECT_DELAY;
      })
      .catch(() => {
        console.log('error');
      });
  };

  setup = () => {
    const {connection} = this;
    // Install close handler
    connection.onclose(this.onClose);
    // Install update market handler
    connection.on('updateMarketData', this.onUpdateMarket);
    connection.on('updateMessageBlotter', this.onUpdateMessageBlotter);
  };

  onUpdateMessageBlotter = (message: string): void => {
    const data: MessageBlotterEntry = JSON.parse(message);
    // Dispatch the action
    if (this.onUpdateMessageBlotterListener !== null) {
      this.onUpdateMessageBlotterListener(data);
    }
  };

  onUpdateMarket = (message: string): void => {
    const data: Message = JSON.parse(message);
    // Dispatch the action
    if (this.onUpdateMarketDataListener !== null) {
      this.onUpdateMarketDataListener(data);
    }
  };

  setOnConnectedListener = (fn: (connection: HubConnection) => void) => {
    this.onConnectedListener = fn;
  };

  setOnUpdateMarketDataListener = (fn: (data: Message) => void) => {
    this.onUpdateMarketDataListener = fn;
  };

  setOnUpdateMessageBlotter = (fn: (data: any) => void) => {
    this.onUpdateMessageBlotterListener = fn;
  };

  setOnDisconnectedListener = (fn: () => void) => {
    this.onDisconnectedListener = fn;
  };

  onClose = (error: any) => {
    const {connection} = this;
    // Notify disconnection
    if (this.onDisconnectedListener !== null) {
      this.onDisconnectedListener();
    }
    setTimeout(() => {
      // Stop listening to market row
      connection.off('updateMessageBlotter');
      connection.off('updateMarketData');
      // Restart connection
      this.connection = SignalRManager.createConnection();
      this.reconnectDelay *= 2;
      // Connect
      this.connect();
    }, this.reconnectDelay);
    console.log(error);
  };
}
