import {
  HttpTransportType,
  HubConnection,
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel,
} from "@microsoft/signalr";
import { API } from "API";
import { Deal } from "components/MiddleOffice/types/deal";
import config from "config";
import {
  CommissionRate,
  convertToCommissionRatesArray,
} from "mobx/stores/brokerageStore";
import moStore, { MoStatus } from "mobx/stores/moStore";
import userProfileStore from "mobx/stores/userPreferencesStore";

import workareaStore from "mobx/stores/workareaStore";
import { playBeep } from "signalR/helpers";
import { MDEntry } from "types/mdEntry";
import { DarkPoolMessage, ExecTypes, Message } from "types/message";
import {
  MOErrorMessage,
  ON_MIDDLE_OFFICE_ERROR,
} from "types/middleOfficeError";
import { PricingMessage } from "types/pricingMessage";
import { Sides } from "types/sides";
import { OCOModes, User } from "types/user";
import { isPodW, W } from "types/w";
import { coalesce } from "utils/commonUtils";
import { createDealFromBackendMessage } from "utils/dealUtils";
import { parseSEFError } from "utils/parseSEFError";
import { $$ } from "utils/stringPaster";

const INITIAL_RECONNECT_DELAY: number = 3000;
const SidesMap: { [key: string]: Sides } = { "1": Sides.Buy, "2": Sides.Sell };

interface SEFError {
  dealid: string;
  error_msg: string;
  msgtype: "AR";
  report_status: string;
  useremail: string;
}

enum DealEditStatus {
  Start,
  End,
}

export enum Methods {
  // Messages
  SubscribeForMarketData = "SubscribeForMarketData",
  UnsubscribeFromMarketData = "UnsubscribeForMarketData",
  SubscribeForMBMsg = "SubscribeForMBMsg",
  UnsubscribeFromMBMsg = "UnsubscribeForMBMsg",
  SubscribeForDarkPoolPx = "SubscribeForDarkPoolPx",
  UnsubscribeFromDarkPoolPx = "UnsubscribeForDarkPoolPx",
  SubscribeForDeals = "SubscribeForDeals",
  SubscribeForPricingResponse = "SubscribeForPricingResponse",
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
  OnError = "onError",
  OnSEFUpdate = "onSEFUpdate",
  OnCommissionUpdate = "onCommissionUpdate",
  OnDealEditStart = "OnDealEditStart",
  OnDealEditEnd = "OnDealEditEnd",
}

interface Command {
  readonly name: string;
  readonly args: any[];
}

export class SignalRManager {
  private connection: HubConnection | null;
  private onDisconnectedListener: ((error: any) => void) | null = null;
  private onConnectedListener:
    | ((connection: HubConnection) => void)
    | null = null;
  private reconnectDelay: number = INITIAL_RECONNECT_DELAY;
  private deferredCommands: Array<Command> = [
    {
      name: Methods.SubscribeForDeals,
      args: ["*"],
    },
    {
      name: Methods.SubscribeForPricingResponse,
      args: ["*"],
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
        `${config.BackendUrl}/liveUpdateSignalRHub`,
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
      // Install listeners
      connection.on(Events.UpdateMarketData, this.onUpdateMarketData);
      connection.on(Events.UpdateDarkPoolPrice, this.onUpdateDarkPoolPx);
      connection.on(Events.UpdateMessageBlotter, this.onUpdateMessageBlotter);
      connection.on(Events.ClearDarkPoolPrice, this.onClearDarkPoolPx);
      connection.on(Events.UpdateDealsBlotter, this.onUpdateDeals);
      connection.on(Events.OnPricingResponse, this.onPricingResponse);
      connection.on(Events.OnDealDeleted, this.onDealDeleted);
      connection.on(Events.UpdateLegs, this.onUpdateLegs);
      connection.on(Events.OnError, this.onError);
      connection.on(Events.OnSEFUpdate, this.onSEFUpdate);
      connection.on(Events.OnCommissionUpdate, this.onCommissionUpdate);
      connection.on(
        Events.OnDealEditStart,
        this.onDealEdit(DealEditStatus.Start)
      );
      connection.on(Events.OnDealEditEnd, this.onDealEdit(DealEditStatus.End));
      // Listen to installed combinations
      this.processDeferredCommands();
    }
  };

  public setDealEditListener(
    listener: (status: DealEditStatus, id: string) => void
  ): () => void {
    const onEdit = (event: Event): void => {
      const customEvent: CustomEvent<{
        id: string;
        status: DealEditStatus;
      }> = event as CustomEvent<{
        id: string;
        status: DealEditStatus;
      }>;
      const { id, status } = customEvent.detail;
      listener(status, id);
    };
    document.addEventListener("dealedit", onEdit);
    return (): void => {
      document.removeEventListener("dealedit", onEdit);
    };
  }

  private onDealEdit(status: DealEditStatus): (message: string) => void {
    return (message: string): void => {
      document.dispatchEvent(
        new CustomEvent<{ id: string; status: DealEditStatus }>("dealedit", {
          detail: {
            id: message,
            status: status,
          },
        })
      );
    };
  }

  private combineWs = (w1: W, w2: W): W => {
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
    const deal: Deal = JSON.parse(message);
    const event: CustomEvent<Deal> = new CustomEvent<Deal>(
      "onpricingresponse",
      {
        detail: deal,
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

  public addDeal = async (deal: any): Promise<void> => {
    if ("dealId" in deal) {
      // IGNORE THIS INTENTIONALLY
    } else {
      try {
        const detail: Deal = await createDealFromBackendMessage(deal);
        const event: CustomEvent<Deal> = new CustomEvent<Deal>("ondeal", {
          detail: detail,
        });
        document.dispatchEvent(event);
      } catch (error) {
        console.warn(error);
      }
    }
  };

  private onUpdateLegs = (message: string): void => {
    const { selectedDealID } = moStore;
    if (selectedDealID === null) return;
    const data = JSON.parse(message);
    // Only replace legs if current deal matches
    // the updated deal
    if (data.id === selectedDealID) {
      moStore.setLegs(data.legs, null);
    }
  };

  private onUpdateDeals = (message: string): void => {
    const deal: any = JSON.parse(message);
    const dealWithDefaults: any = {
      ...deal,
      premstyle: coalesce(deal.premstyle, "Forward"),
      deltastyle: coalesce(deal.deltastyle, "Forward"),
    };
    this.addDeal(dealWithDefaults).then(() => {});
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

  private processDeferredCommands = () => {
    const { deferredCommands } = this;
    deferredCommands.forEach(this.runCommand);
    // Clear it
    this.deferredCommands = [];
  };

  private runCommand = (command: Command) => {
    const { name, args } = command;
    const { connection } = this;
    if (
      connection === null ||
      connection.state !== HubConnectionState.Connected
    ) {
      throw new Error("not connected yet");
    }
    connection
      .invoke(name, ...args)
      .then((result: string): void => {
        if (result !== "success") {
          console.warn(
            `there was a problem invoking \`${name}' with \`${args.join(
              ", "
            )}': `,
            result
          );
        }
      })
      .catch((error: any) => {
        console.warn(error);
      });
  };

  public removeMarketListener = (
    symbol: string,
    strategy: string,
    tenor: string,
    eventListener: (e: any) => void
  ) => {
    const key: string = $$(symbol, strategy, tenor);
    this.invoke(Methods.UnsubscribeFromMarketData, symbol, strategy, tenor);
    document.removeEventListener(key, eventListener);
  };

  public addPricingResponseListener = (
    listener: (response: PricingMessage) => void
  ) => {
    const listenerWrapper = (event: Event) => {
      const customEvent: CustomEvent<any> = event as CustomEvent<any>;
      // Call the actual listener
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
      // Call the actual listener
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
    const key: string = $$(symbol, strategy, tenor);
    const eventListener = (e: any) => {
      const event: CustomEvent<W> = e;
      listener(event.detail);
    };
    document.addEventListener(key, eventListener);
    this.invoke(Methods.SubscribeForMarketData, symbol, strategy, tenor);
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
    const key: string = $$(currency, strategy, tenor);
    const command: Command = {
      name: Methods.SubscribeForDarkPoolPx,
      args: [currency, strategy, tenor],
    };
    // Update the listeners map
    this.dpListeners[key] = fn;
    // Try to execute it now
    this.invoke(command.name, ...command.args);
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
    this.invoke(Methods.UnsubscribeFromMBMsg, "*");
  };

  public setMessagesListener = (onMessage: (message: Message) => void) => {
    const command: Command = {
      name: Methods.SubscribeForMBMsg,
      args: ["*"],
    };
    this.onMessageListener = onMessage;
    // Execute it
    this.runCommand(command);
  };

  private invoke = (name: string, ...args: any[]): void => {
    const { connection } = this;
    if (
      connection === null ||
      connection.state !== HubConnectionState.Connected
    ) {
      const { deferredCommands } = this;
      deferredCommands.push({
        name,
        args,
      });
    } else {
      this.runCommand({
        name,
        args,
      });
    }
  };

  private emitMiddleOfficeError = (error: MOErrorMessage): void => {
    const event: CustomEvent<MOErrorMessage> = new CustomEvent<MOErrorMessage>(
      ON_MIDDLE_OFFICE_ERROR,
      {
        detail: error,
      }
    );
    document.dispatchEvent(event);
  };

  private onCommissionUpdate = (data: string): void => {
    const object: any = JSON.parse(data);
    const firm: string = object.firm;
    const event: CustomEvent<ReadonlyArray<CommissionRate>> = new CustomEvent<
      ReadonlyArray<CommissionRate>
    >(firm + "updatecommissionrates", {
      detail: convertToCommissionRatesArray(object),
    });
    document.dispatchEvent(event);
  };

  private static emitSEFUpdate(data: any): void {
    const existingDeal: Deal | undefined = moStore.findDeal(data.dealid);
    if (existingDeal === undefined) {
      return;
    }
    const deal: Deal = {
      ...existingDeal,
      // Update the updated values
      status: Number(data.deal_state),
      usi: data.usi_no,
    };
    const event: CustomEvent<Deal> = new CustomEvent<Deal>("ondeal", {
      detail: deal,
    });
    document.dispatchEvent(event);
    // Reset the status to normal
    moStore.setStatus(MoStatus.Normal);
  }

  private onSEFUpdate = (data: string): void => {
    const object: SEFError = JSON.parse(data);
    const user: User = workareaStore.user;
    if (object.report_status === "REJECTED") {
      if (object.useremail !== user.email) return;
      const error: MOErrorMessage = {
        status: "701",
        content: parseSEFError(object.error_msg),
        code: 701,
        error: "Could not submit to SEF",
      };
      this.emitMiddleOfficeError(error);
    } else {
      SignalRManager.emitSEFUpdate(object);
    }
  };

  private onError = (data: string): void => {
    const user: User = workareaStore.user;
    const error: any = JSON.parse(data);
    if (error.useremail !== user.email) {
      if ("dealid" in error) {
        if (
          moStore.selectedDealID === error.dealid &&
          moStore.status === MoStatus.Pricing
        ) {
          // This is a pricing error that belongs to our user anyway
          moStore.setError({
            error: error.error_msg,
            code: 1001,
            message: error.error_msg,
            status: "Unable to complete",
          });
        }
      }
      console.warn(error);
    } else {
      console.log(error);
    }
  };

  public addCommissionRatesListener(
    firm: string,
    listener: (rates: ReadonlyArray<CommissionRate>) => void
  ): () => void {
    const handler = (rawEvent: any) => {
      const event: CustomEvent<ReadonlyArray<CommissionRate>> = rawEvent;
      listener(event.detail);
    };
    document.addEventListener(firm + "updatecommissionrates", handler);
    return () => {
      document.removeEventListener(firm + "updatecommissionrates", handler);
    };
  }
}

export default new SignalRManager();
