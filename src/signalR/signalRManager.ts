import {
  HttpTransportType,
  HubConnection,
  HubConnectionBuilder,
  LogLevel,
  HubConnectionState,
} from "@microsoft/signalr";
import config from "config";
import { Message, DarkPoolMessage, ExecTypes } from "interfaces/message";
import { W, isPodW } from "interfaces/w";
import { API } from "API";
import moStore from "mobx/stores/moStore";
import { $$ } from "utils/stringPaster";
import { MDEntry } from "interfaces/mdEntry";
import { OCOModes, User } from "interfaces/user";
import { Sides } from "interfaces/sides";
import userProfileStore from "mobx/stores/userPreferencesStore";

import workareaStore from "mobx/stores/workareaStore";
import { Deal } from "components/MiddleOffice/interfaces/deal";
import { createDealFromBackendMessage } from "utils/dealUtils";
import { playBeep } from "signalR/helpers";

const ApiConfig = config.Api;
const INITIAL_RECONNECT_DELAY: number = 3000;
const SidesMap: { [key: string]: Sides } = { "1": Sides.Buy, "2": Sides.Sell };

export enum Methods {
  // Messages
  SubscribeForMarketData = "SubscribeForMarketData",
  UnsubscribeFromMarketData = "UnsubscribeForMarketData",
  SubscribeForMBMsg = "SubscribeForMBMsg",
  UnsubscribeFromMBMsg = "UnsubscribeForMBMsg",
  SubscribeForDarkPoolPx = "SubscribeForDarkPoolPx",
  UnsubscribeFromDarkPoolPx = "UnsubscribeForDarkPoolPx",
  SubscribeForDeals = "SubscribeForDeals",
  UnsubscribeFromDeals = "UnSubscribeForDeals",
  SubscribeForPricingResponse = "SubscribeForPricingResponse",
  UnsubscribeFromPricingResponse = "UnSubscribeForPricing",
}

enum Events {
  UpdateMarketData = "updateMarketData",
  UpdateDarkPoolPrice = "updateDarkPoolPx",
  UpdateMessageBlotter = "updateMessageBlotter",
  ClearDarkPoolPrice = "clearDarkPoolPx",
  UpdateDealsBlotter = "updateDealsBlotter",
  UpdateLegs = "updateLegs",
  OnPricingResponse = "onPricingResponse",
  OnDealDeleted = "onDealDeleted",
}

interface Command {
  name: string;
  args: any[];
  refCount: number;
}

export class SignalRManager {
  private connection: HubConnection | null;
  private onDisconnectedListener: ((error: any) => void) | null = null;
  private onConnectedListener:
    | ((connection: HubConnection) => void)
    | null = null;
  private reconnectDelay: number = INITIAL_RECONNECT_DELAY;
  private recordedCommands: Command[] = [
    {
      name: Methods.SubscribeForDeals,
      args: ["*"],
      refCount: 1,
    },
    {
      name: Methods.SubscribeForPricingResponse,
      args: ["*"],
      refCount: 1,
    },
  ];
  private pendingW: { [k: string]: W } = {};

  // private listeners: { [k: string]: (arg: W) => void } = {};

  private dpListeners: { [k: string]: (m: DarkPoolMessage) => void } = {};
  private onMessageListener: (message: Message) => void = () => null;

  constructor() {
    const connection: HubConnection = SignalRManager.createConnection();
    connection.serverTimeoutInMilliseconds = 3600000;
    connection.keepAliveIntervalInMilliseconds = 8000;
    // Export to class wide variable
    this.connection = connection;
  }

  static createConnection = () =>
    new HubConnectionBuilder()
      .withUrl(
        `http://${ApiConfig.Host}/liveUpdateSignalRHub`,
        HttpTransportType.WebSockets
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
        .catch(console.error);
    } else {
      console.error(
        "attempted to connect but the `connection' object is `null'"
      );
    }
  };

  private onClearDarkPoolPx = (message: string) => {
    localStorage.clear();
    document.dispatchEvent(new CustomEvent("cleardarkpoolprice"));
  };

  private setup = (connection: HubConnection) => {
    if (connection !== null) {
      // Install close handler
      connection.onclose((error?: Error) => {
        if (error) console.warn(error);
        if (this.onDisconnectedListener)
          this.onDisconnectedListener(connection);
      });
      connection.onreconnecting((error?: Error) => {
        if (error) console.warn(error);
      });
      connection.onreconnected(() => {
        this.setup(connection);
      });
      // Listen to installed combinations
      this.replayRecordedCommands();
      // Install listeners
      connection.on(Events.UpdateMarketData, this.onUpdateMarketData);
      connection.on(Events.UpdateDarkPoolPrice, this.onUpdateDarkPoolPx);
      connection.on(Events.UpdateMessageBlotter, this.onUpdateMessageBlotter);
      connection.on(Events.ClearDarkPoolPrice, this.onClearDarkPoolPx);
      connection.on(Events.UpdateDealsBlotter, this.onUpdateDeals);
      connection.on(Events.OnPricingResponse, this.onPricingResponse);
      connection.on(Events.OnDealDeleted, this.onDealDeleted);
      connection.on(Events.UpdateLegs, this.onUpdateLegs);
    }
  };

  private combineWs = (w1: W, w2: W) => {
    const isW1PodW: boolean = isPodW(w1);
    const isW2PodW: boolean = isPodW(w2);
    if ((isW1PodW && isW2PodW) || (!isW1PodW && !isW2PodW)) {
      throw new Error(
        "inconsistent w set, cannot combine unrelated w's with same symbol/strategy/tenor"
      );
    }
    const [pod, full] = isW1PodW ? [w1, w2] : [w2, w1];
    if (full === undefined) return pod;
    if (full.Entries) {
      const { Entries } = pod;
      full.Entries = [
        ...full.Entries,
        ...Entries.filter((entry: MDEntry) => entry.MDEntrySize === undefined),
      ];
    } else {
      full.Entries = pod.Entries;
    }
    return full;
  };

  private dispatchW = (w: W, keySuffix: string = "") => {
    const key: string = $$(w.Symbol, w.Strategy, w.Tenor, keySuffix);
    const detail: W = this.combineWs(w, this.pendingW[key]);
    const event: CustomEvent<W> = new CustomEvent<W>(key, {
      detail,
    });
    document.dispatchEvent(event);
  };

  public handleWMessage = (w: W) => {
    if (w.ExDestination === undefined) {
      const key: string = $$(w.Symbol, w.Strategy, w.Tenor);
      if (!this.pendingW[key]) {
        this.pendingW[key] = w;
      } else {
        this.dispatchW(w);
        delete this.pendingW[key];
      }
    } else if (w.ExDestination === "DP") {
      const key: string = $$(w.Symbol, w.Strategy, w.Tenor, "Dp");
      if (!this.pendingW[key]) {
        this.pendingW[key] = w;
      } else {
        this.dispatchW(w, "Dp");
        delete this.pendingW[key];
      }
    }
  };

  private onUpdateMessageBlotter = (rawMessage: string) => {
    const message: Message = JSON.parse(rawMessage);
    // First call the internal handler
    this.handleMessageActions(message);
    // Now call the setup handler
    this.onMessageListener(message);
  };

  private onDealDeleted = (message: string): void => {
    const event: CustomEvent<string> = new CustomEvent("ondealdeleted", {
      detail: message,
    });
    document.dispatchEvent(event);
  };

  private onPricingResponse = (message: string): void => {
    const event: CustomEvent<Deal> = new CustomEvent<Deal>(
      "onpricingresponse",
      {
        detail: JSON.parse(message),
      }
    );
    document.dispatchEvent(event);
  };

  public addDealDeletedListener(listener: (id: string) => void): () => void {
    const proxyListener = (event: Event) => {
      const customEvent: CustomEvent<string> = event as CustomEvent<string>;
      listener(customEvent.detail);
    };
    document.addEventListener("ondealdeleted", proxyListener);
    return () => {
      document.removeEventListener("ondealdeleted", proxyListener);
    };
  }

  public addDeal = (deal: any): void => {
    try {
      const detail: Deal = createDealFromBackendMessage(deal);
      const event: CustomEvent<Deal> = new CustomEvent<Deal>("ondeal", {
        detail: detail,
      });
      document.dispatchEvent(event);
    } catch (error) {
      console.warn(error);
    }
  };

  private onUpdateLegs = (message: string): void => {
    const { deal } = moStore;
    if (deal === null) return;
    const data = JSON.parse(message);
    // Only replace legs if current deal matches
    // the updated deal
    if (data.dealId === deal.dealID) {
      moStore.setLegs(data.legs, null);
    }
  };

  private onUpdateDeals = (message: string): void => {
    this.addDeal(JSON.parse(message));
  };

  private onUpdateMarketData = (message: string): void => {
    const w: W = JSON.parse(message);
    this.handleWMessage(w);
  };

  private onUpdateDarkPoolPx = (rawMessage: string) => {
    const message: DarkPoolMessage = JSON.parse(rawMessage);
    const key: string = $$(message.Symbol, message.Strategy, message.Tenor);
    const listener: ((m: DarkPoolMessage) => void) | undefined = this
      .dpListeners[key];
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

  private replayRecordedCommands = () => {
    const { recordedCommands } = this;
    recordedCommands.forEach(this.replayCommand);
  };

  private replayCommand = (command: Command) => {
    this.invoke(command.name, ...command.args);
  };

  public removeMarketListener = (
    symbol: string,
    strategy: string,
    tenor: string,
    eventListener: (e: any) => void
  ) => {
    const { recordedCommands } = this;
    const index: number = recordedCommands.findIndex((command: Command) => {
      if (command.name !== Methods.SubscribeForMarketData) return false;
      return (
        command.args[0] === symbol &&
        command.args[1] === strategy &&
        command.args[2] === tenor
      );
    });
    const key: string = $$(symbol, strategy, tenor);
    if (index === -1) {
      console.warn(`command does not exist, cannot remove it`);
    } else {
      const command: Command = recordedCommands[index];
      if (--command.refCount === 1) {
        // Unsubscribe now that we know which one exactly
        this.invoke(Methods.UnsubscribeFromMarketData, ...command.args);
        // Update recorded commands
        this.recordedCommands = [
          ...recordedCommands.slice(0, index),
          ...recordedCommands.slice(index + 1),
        ];
      }
    }
    // Remove event listener, this is always done as there is 1
    // per added listener
    document.removeEventListener(key, eventListener);
  };

  public addPricingResponseListener = (listener: (response: any) => void) => {
    const listenerWrapper = (event: Event) => {
      const customEvent: CustomEvent<any> = event as CustomEvent<any>;
      listener(customEvent.detail);
    };
    document.addEventListener("onpricingresponse", listenerWrapper, true);
    return () => {
      document.removeEventListener("onpricingresponse", listenerWrapper, true);
    };
  };

  public addDealListener = (listener: (deal: Deal) => void) => {
    const listenerWrapper = (event: Event) => {
      const customEvent: CustomEvent<Deal> = event as CustomEvent<Deal>;
      listener(customEvent.detail);
    };
    document.addEventListener("ondeal", listenerWrapper);
    return () => {
      document.removeEventListener("ondeal", listenerWrapper);
    };
  };

  public addMarketListener = (
    symbol: string,
    strategy: string,
    tenor: string,
    listener: (w: W) => void
  ) => {
    const { recordedCommands } = this;
    const key: string = $$(symbol, strategy, tenor);
    const eventListener = (e: any) => {
      const event: CustomEvent<W> = e;
      listener(event.detail);
    };
    // Just add the listener, the rest is done elsewhere
    document.addEventListener(key, eventListener);
    const command: Command = {
      name: Methods.SubscribeForMarketData,
      args: [symbol, strategy, tenor],
      refCount: 1,
    };
    const existingCommand: Command | undefined = recordedCommands.find(
      (cmd: Command) => {
        return cmd.name === command.name;
      }
    );
    if (existingCommand === undefined) {
      // Record the command, but only if it's not already there
      recordedCommands.push(command);
    } else {
      existingCommand.refCount += 1;
    }
    // Try to run the command now
    this.replayCommand(command);
    return () => {
      this.removeMarketListener(symbol, strategy, tenor, eventListener);
    };
  };

  public removeDarkPoolPriceListener = (
    currency: string,
    strategy: string,
    tenor: string
  ) => {
    if (
      currency === "" ||
      strategy === "" ||
      tenor === "" ||
      !currency ||
      !strategy ||
      !tenor
    )
      return;
    const key: string = $$(currency, strategy, tenor);
    // Remove it from the map
    delete this.dpListeners[key];
    // Invoke ths Signal R method
    this.invoke(Methods.UnsubscribeFromDarkPoolPx, currency, strategy, tenor);
  };

  public setDarkPoolPriceListener = (
    currency: string,
    strategy: string,
    tenor: string,
    fn: (message: DarkPoolMessage) => void
  ) => {
    if (
      currency === "" ||
      strategy === "" ||
      tenor === "" ||
      !currency ||
      !strategy ||
      !tenor
    )
      return;
    const { recordedCommands } = this;
    const key: string = $$(currency, strategy, tenor);
    const command: Command = {
      name: Methods.SubscribeForDarkPoolPx,
      args: [currency, strategy, tenor],
      refCount: 1,
    };
    recordedCommands.push(command);
    // Update the listeners map
    this.dpListeners[key] = fn;
    // Try to execute it now
    this.replayCommand(command);
  };

  public setDarkPoolOrderListener = (
    symbol: string,
    strategy: string,
    tenor: string,
    listener: (w: W) => void
  ) => {
    const key: string = $$(symbol, strategy, tenor, "Dp");
    const eventListener = (e: any) => {
      const event: CustomEvent<W> = e;
      listener(event.detail);
    };
    // Commands already exists as this is the same as the market update
    // this.listeners[key] = listener;
    document.addEventListener(key, eventListener);
    return () => {
      document.removeEventListener(key, eventListener);
    };
  };

  private static shouldShowPopup = (message: Message): boolean => {
    const user: User = workareaStore.user;
    const personality: string = workareaStore.personality;
    if (user.isbroker) {
      return personality === message.MDMkt && message.Username === user.email;
    }
    return message.Username === user.email;
  };

  private dispatchExecutedMessageEvent = (message: Message) => {
    const type: string = $$(message.ExecID, "executed");
    playBeep(userProfileStore.preferences, message.ExDestination);
    setTimeout(() => {
      document.dispatchEvent(new CustomEvent(type));
    }, 500);
  };

  private handleMessageActions = (message: Message) => {
    const { preferences: userProfile } = userProfileStore;
    const { user } = workareaStore;
    const ocoMode: OCOModes = userProfile.oco;
    switch (message.OrdStatus) {
      case ExecTypes.Canceled:
        break;
      case ExecTypes.PendingCancel:
        break;
      case ExecTypes.Filled:
        if (ocoMode !== OCOModes.Disabled && message.Username === user.email) {
          API.cancelAll(
            message.Symbol,
            message.Strategy,
            SidesMap[message.Side]
          );
        }
        this.dispatchExecutedMessageEvent(message);
        if (SignalRManager.shouldShowPopup(message)) {
          workareaStore.addRecentExecution(message);
        }
        break;
      case ExecTypes.PartiallyFilled:
        if (ocoMode === OCOModes.PartialEx && message.Username === user.email) {
          API.cancelAll(
            message.Symbol,
            message.Strategy,
            SidesMap[message.Side]
          );
        }
        this.dispatchExecutedMessageEvent(message);
        if (SignalRManager.shouldShowPopup(message)) {
          workareaStore.addRecentExecution(message);
        }
        break;
      default:
        break;
    }
  };

  public removeMessagesListener = () => {
    const { recordedCommands } = this;
    this.recordedCommands = recordedCommands.filter((command: Command) => {
      return command.name === Methods.SubscribeForMBMsg;
    });
    this.invoke(Methods.UnsubscribeFromMBMsg, "*");
  };

  public setMessagesListener = (onMessage: (message: Message) => void) => {
    const { recordedCommands } = this;
    const command: Command = {
      name: Methods.SubscribeForMBMsg,
      args: ["*"],
      refCount: 1,
    };
    this.onMessageListener = onMessage;
    // Add it to the list
    recordedCommands.push(command);
    // Execute it
    this.replayCommand(command);
  };

  private invoke = (name: string, ...args: any[]) => {
    const { connection } = this;
    if (connection === null) return;
    if (connection.state !== HubConnectionState.Connected) {
      return;
    }
    connection.invoke(name, ...args).then((result: any) => {
      if (result !== "success") {
        console.warn(
          `there was a problem invoking \`${name}' with \`${args}': `,
          result
        );
      }
    });
  };
}

export default new SignalRManager();
