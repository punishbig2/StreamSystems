import {
  HttpTransportType,
  HubConnection,
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel,
} from "@microsoft/signalr";
import { Deal } from "components/MiddleOffice/types/deal";
import config from "config";
import {
  CommissionRate,
  convertToCommissionRatesArray,
} from "mobx/stores/brokerageStore";
import {
  MiddleOfficeProcessingState,
  MiddleOfficeStore,
} from "mobx/stores/middleOfficeStore";
import userProfileStore from "mobx/stores/userPreferencesStore";

import workareaStore from "mobx/stores/workareaStore";
import {
  DEAL_DELETED_EVENT,
  DEAL_EDIT_EVENT,
  Events,
  Methods,
  NEW_DEAL_EVENT,
  PRICING_RESPONSE_EVENT,
  SEF_UPDATE,
} from "signalR/constants";
import { playBeep } from "signalR/helpers";
import { MDEntry } from "types/mdEntry";
import { DarkPoolMessage, ExecTypes, Message } from "types/message";
import { PricingMessage } from "types/pricingMessage";
import { Role } from "types/role";
import { SEFUpdate } from "types/sefUpdate";
import { User } from "types/user";
import { isPodW, W } from "types/w";
import { clearDarkPoolPriceEvent } from "utils/clearDarkPoolPriceEvent";
import { coalesce } from "utils/commonUtils";
import { globalClearDarkPoolPriceEvent } from "utils/globalClearDarkPoolPriceEvent";
import { $$ } from "utils/stringPaster";

interface SEFError {
  dealid: string;
  deal_state: string;
  error_msg: string;
  msgtype: "AR";
  report_status: string;
  useremail: string;
}

export enum DealEditStatus {
  Start,
  End,
}

interface Command {
  readonly name: string;
  readonly args: any[];
}

export class SignalRManager {
  private connection: HubConnection | null = null;
  private onDisconnectedListener: ((error: any) => void) | null = null;
  private onConnectedListener:
    | ((connection: HubConnection) => void)
    | null = null;
  private recordedCommands: ReadonlyArray<Command> = [
    {
      name: Methods.SubscribeForDeals,
      args: ["*"],
    },
    {
      name: Methods.SubscribeForPricingResponse,
      args: ["*"],
    },
    {
      name: Methods.SubscribeForMBMsg,
      args: ["*"],
    },
  ];
  private pendingW: { [k: string]: W } = {};
  private middleOffices: Array<MiddleOfficeStore> = [];

  private callbacks: {
    [k: string]: (m: DarkPoolMessage) => void;
  } = {};

  constructor() {
    window.addEventListener("offline", (): void => {
      const { connection } = this;
      // Oddly enough, this is a problem when testing and debugging
      if (connection !== null) {
        void connection.stop();
        this.connection = null;
      }
    });
    window.addEventListener("online", (): void => {
      this.connect();
    });
  }

  public static createConnection = () =>
    new HubConnectionBuilder()
      .withUrl(
        `${config.BackendUrl}/liveUpdateSignalRHub`,
        HttpTransportType.WebSockets
      )
      .configureLogging(LogLevel.Error)
      .build();

  public connect = (): boolean => {
    const connection: HubConnection = SignalRManager.createConnection();
    this.connection = connection;
    this.installHealthMonitors(connection);
    connection
      .start()
      .then(() => {
        // Listen to installed combinations
        this.replayRecordedCommands();
        this.applySubscriptions(connection);
        this.notifyConnected(connection);
      })
      .catch(console.error);
    return true;
  };

  private notifyConnected(connection: HubConnection) {
    if (this.onConnectedListener) {
      this.onConnectedListener(connection);
    }
  }

  private notifyConnectionLoss(error?: any) {
    if (this.onDisconnectedListener) {
      this.onDisconnectedListener(error);
    }
  }

  private installHealthMonitors = (connection: HubConnection): void => {
    // Connect
    connection.serverTimeoutInMilliseconds = 3600000;
    connection.onclose((error?: Error): void => {
      this.notifyConnectionLoss(error);
      setTimeout((): void => {
        this.connect();
      }, 3000);
    });
  };

  private applySubscriptions = (connection: HubConnection): void => {
    if (connection.state !== HubConnectionState.Connected) {
      throw new Error(
        "cannot apply subscriptions because the connection is not established"
      );
    }
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
  };

  public static addSEFUpdateListener(
    listener: (message: SEFUpdate) => void
  ): () => void {
    const listenerWrapper = (event: Event): void => {
      const custom = event as CustomEvent<SEFUpdate>;
      // Call the actual listener
      listener(custom.detail);
    };
    document.addEventListener(SEF_UPDATE, listenerWrapper);
    return (): void => {
      document.removeEventListener(SEF_UPDATE, listenerWrapper);
    };
  }

  private static shouldShowPopup = (message: Message): boolean => {
    const user: User = workareaStore.user;
    const personality: string = workareaStore.personality;
    const { roles } = user;
    if (roles.includes(Role.Broker)) {
      return personality === message.MDMkt && message.Username === user.email;
    }
    return message.Username === user.email;
  };

  private static emitSEFUpdate(data: any): void {
    const event = new CustomEvent<SEFUpdate>(SEF_UPDATE, {
      detail: {
        dealId: data.dealid,
        status: Number(data.deal_state),
        usi: data.usi_no,
        namespace: data.sef_namespace,
        errorMsg: data.error_msg,
      },
    });
    document.dispatchEvent(event);
  }

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
    document.addEventListener(DEAL_EDIT_EVENT, onEdit);
    return (): void => {
      document.removeEventListener(DEAL_EDIT_EVENT, onEdit);
    };
  }

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

  public addDealDeletedListener(listener: (id: string) => void): () => void {
    const proxyListener = (event: Event) => {
      const customEvent: CustomEvent<string> = event as CustomEvent<string>;
      listener(customEvent.detail);
    };
    document.addEventListener(DEAL_DELETED_EVENT, proxyListener);
    return () => {
      document.removeEventListener(DEAL_DELETED_EVENT, proxyListener);
    };
  }

  public addDeal = async (deal: Deal): Promise<void> => {
    if ("dealId" in deal) {
      // IGNORE THIS INTENTIONALLY
    } else {
      try {
        const event: CustomEvent<Deal> = new CustomEvent<Deal>(NEW_DEAL_EVENT, {
          detail: deal,
        });
        document.dispatchEvent(event);
      } catch (error) {
        console.warn(error);
      }
    }
  };

  public setOnConnectedListener = (fn: (connection: HubConnection) => void) => {
    this.onConnectedListener = fn;
  };

  public setOnDisconnectedListener = (fn: (error: any) => void) => {
    this.onDisconnectedListener = fn;
  };

  private eraseCommand = (command: Command): void => {
    const { recordedCommands } = this;
    const index = recordedCommands.findIndex(
      (each: Command): boolean => each === command
    );
    if (index === -1) {
      console.warn(
        "trying to remove a command that was never recorded: ",
        command.name
      );
    } else {
      this.recordedCommands = [
        ...recordedCommands.slice(0, index),
        ...recordedCommands.slice(index + 1),
      ];
    }
  };

  private recordCommand(command: Command) {
    this.recordedCommands = [...this.recordedCommands, command];
  }

  public removeMarketListener = (
    symbol: string,
    strategy: string,
    tenor: string,
    eventListener: (e: any) => void
  ) => {
    const key: string = $$(symbol, strategy, tenor);
    // Invoke the method
    this.invoke(Methods.UnsubscribeFromMarketData, symbol, strategy, tenor);
    // Remove the event listener
    document.removeEventListener(key, eventListener);
  };

  public addPricingResponseListener = (
    listener: (response: PricingMessage) => void
  ) => {
    const listenerWrapper = (event: Event) => {
      const customEvent: CustomEvent = event as CustomEvent;
      // Call the actual listener
      listener(customEvent.detail);
    };
    document.addEventListener(PRICING_RESPONSE_EVENT, listenerWrapper, true);
    return () => {
      document.removeEventListener(
        PRICING_RESPONSE_EVENT,
        listenerWrapper,
        true
      );
    };
  };

  public addDealListener = (
    listener: (deal: { [key: string]: any }) => void
  ) => {
    const listenerWrapper = (event: Event) => {
      const customEvent = event as CustomEvent<{ [key: string]: any }>;
      // Call the actual listener
      listener(customEvent.detail);
    };
    document.addEventListener(NEW_DEAL_EVENT, listenerWrapper);
    return () => {
      document.removeEventListener(NEW_DEAL_EVENT, listenerWrapper);
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
    const command: Command = {
      name: Methods.SubscribeForMarketData,
      args: [symbol, strategy, tenor],
    };
    const duplicate = this.recordedCommands.findIndex(
      (command: Command): boolean => {
        if (command.name !== Methods.SubscribeForMarketData) return false;
        return (
          command.args[0] === symbol &&
          command.args[1] === strategy &&
          command.args[2] === tenor
        );
      }
    );
    if (duplicate !== -1) {
      console.warn("attempting to add a duplicate command");
    }
    this.recordCommand(command);
    this.runCommand(command);
    return () => {
      this.removeMarketListener(symbol, strategy, tenor, eventListener);
      this.eraseCommand(command);
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
    delete this.callbacks[key];
    // Invoke ths Signal R method
    this.invoke(Methods.UnsubscribeFromDarkPoolPx, currency, strategy, tenor);
  };

  public setDarkPoolPriceListener = (
    currency: string,
    strategy: string,
    tenor: string,
    fn: (message: DarkPoolMessage) => void
  ): (() => void) => {
    if (
      currency === "" ||
      strategy === "" ||
      tenor === "" ||
      !currency ||
      !strategy ||
      !tenor
    )
      return (): void => {};
    const key: string = $$(currency, strategy, tenor);
    const command: Command = {
      name: Methods.SubscribeForDarkPoolPx,
      args: [currency, strategy, tenor],
    };
    this.callbacks[key] = fn;
    // Try to execute it now
    this.recordCommand(command);
    this.runCommand(command);
    return (): void => {
      delete this.callbacks[key];
      this.eraseCommand(command);
    };
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

  public removeMessagesListener = () => {
    this.invoke(Methods.UnsubscribeFromMBMsg, "*");
  };

  public setMessagesListener = (onMessage: (message: Message) => void) => {
    this.onMessageListener = onMessage;
  };

  public addCommissionRatesListener(
    firm: string,
    listener: (rates: ReadonlyArray<CommissionRate>) => void
  ): () => void {
    const eventName = `${firm}updatecommissionrates`;
    const handler = (rawEvent: any) => {
      const event: CustomEvent<ReadonlyArray<CommissionRate>> = rawEvent;
      listener(event.detail);
    };
    document.addEventListener(eventName, handler);
    return () => {
      document.removeEventListener(eventName, handler);
    };
  }

  private onMessageListener: (message: Message) => void = () => null;

  private onClearDarkPoolPx = (message: string) => {
    if (!message || message.trim() === "") {
      document.dispatchEvent(new Event(globalClearDarkPoolPriceEvent()));
    } else {
      const data = JSON.parse(message);
      document.dispatchEvent(
        new Event(
          clearDarkPoolPriceEvent(data.Symbol, data.Strategy, data.Tenor)
        )
      );
    }
  };

  private onDealEdit(status: DealEditStatus): (message: string) => void {
    return (message: string): void => {
      document.dispatchEvent(
        new CustomEvent<{ id: string; status: DealEditStatus }>(
          DEAL_EDIT_EVENT,
          {
            detail: {
              id: message,
              status: status,
            },
          }
        )
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

  private onUpdateMessageBlotter = (rawMessage: string) => {
    const message: Message = JSON.parse(rawMessage);
    // First call the internal handler
    this.handleMessageActions(message);
    // Now call the setup handler
    this.onMessageListener(message);
  };

  private onDealDeleted = (message: string): void => {
    const event: CustomEvent<string> = new CustomEvent(DEAL_DELETED_EVENT, {
      detail: message,
    });
    document.dispatchEvent(event);
  };

  private onPricingResponse = (message: string): void => {
    const deal: Deal = JSON.parse(message);
    const event: CustomEvent<Deal> = new CustomEvent<Deal>(
      PRICING_RESPONSE_EVENT,
      {
        detail: deal,
      }
    );
    document.dispatchEvent(event);
  };

  private onUpdateLegs = (message: string): void => {
    const { middleOffices } = this;
    const data = JSON.parse(message);
    middleOffices.forEach((store: MiddleOfficeStore): void => {
      const { selectedDealID } = store;
      if (selectedDealID === null) return;
      // Only replace legs if current deal matches
      // the updated deal
      if (data.id === selectedDealID) {
        store.setLegs(data.legs, null);
      }
    });
  };

  private onUpdateDeals = (message: string): void => {
    const deal: any = JSON.parse(message);
    const dealWithDefaults: any = {
      ...deal,
      premstyle: coalesce(deal.premstyle, "Forward"),
      deltastyle: coalesce(deal.deltastyle, "Forward"),
    };
    void this.addDeal(dealWithDefaults);
  };

  private onUpdateMarketData = (message: string): void => {
    const w: W = JSON.parse(message);
    this.handleWMessage(w);
  };

  private onUpdateDarkPoolPx = (rawMessage: string) => {
    const message: DarkPoolMessage = JSON.parse(rawMessage);
    const key: string = $$(message.Symbol, message.Strategy, message.Tenor);
    const listener = this.callbacks[key];
    if (listener) {
      listener(message);
    }
  };

  private replayRecordedCommands = () => {
    const { recordedCommands } = this;
    // Execute each command
    recordedCommands.forEach(this.runCommand);
  };

  private runCommand = (command: Command) => {
    const { name, args } = command;
    const { connection } = this;
    if (
      connection === null ||
      connection.state !== HubConnectionState.Connected
    ) {
      return;
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

  private dispatchExecutedMessageEvent = (message: Message) => {
    void playBeep(userProfileStore.preferences, message.ExDestination);
    setTimeout(() => {
      const eventName: string = $$(message.ExecID, "executed");
      if (message.Side === "1") {
        const eventName: string = $$(
          message.Symbol,
          message.Strategy,
          message.Side,
          "Execution"
        );
        document.dispatchEvent(new CustomEvent(eventName));
      }
      document.dispatchEvent(new CustomEvent(eventName));
    }, 500);
  };

  private handleMessageActions = (message: Message) => {
    switch (message.OrdStatus) {
      case ExecTypes.Canceled:
        break;
      case ExecTypes.PendingCancel:
        break;
      case ExecTypes.Filled:
        this.dispatchExecutedMessageEvent(message);
        if (SignalRManager.shouldShowPopup(message)) {
          workareaStore.addRecentExecution(message);
        }
        break;
      case ExecTypes.PartiallyFilled:
        this.dispatchExecutedMessageEvent(message);
        if (SignalRManager.shouldShowPopup(message)) {
          workareaStore.addRecentExecution(message);
        }
        break;
      default:
        break;
    }
  };

  private invoke = (name: string, ...args: any[]): void => {
    const { connection } = this;
    if (
      connection !== null &&
      connection.state === HubConnectionState.Connected
    ) {
    } else {
      this.runCommand({
        name,
        args,
      });
    }
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

  private onSEFUpdate = (data: string): void => {
    const object: SEFError = JSON.parse(data);
    const user: User = workareaStore.user;
    if (object.report_status === "REJECTED") {
      if (object.useremail !== user.email) return;
      SignalRManager.emitSEFUpdate(object);
    } else {
      SignalRManager.emitSEFUpdate(object);
    }
  };

  private onError = (data: string): void => {
    const user: User = workareaStore.user;
    const error: any = JSON.parse(data);
    if (error.useremail !== user.email) {
      if ("dealid" in error) {
        const { middleOffices } = this;
        middleOffices.forEach((store: MiddleOfficeStore): void => {
          if (
            store.selectedDealID === error.dealid &&
            store.status === MiddleOfficeProcessingState.Pricing
          ) {
            // This is a pricing error that belongs to our user anyway
            store.setError({
              error: error.error_msg,
              code: 1001,
              message: error.error_msg,
              status: "Unable to complete",
            });
          }
        });
      }
      console.warn(error);
    } else {
      console.warn(error);
    }
  };

  public connectMiddleOfficeStore(store: MiddleOfficeStore): () => void {
    const { middleOffices } = this;
    const index = middleOffices.length;
    // Add 1 store
    this.middleOffices = [...middleOffices, store];
    return () => {
      const { middleOffices } = this;
      this.middleOffices = [
        ...middleOffices.slice(0, index),
        ...middleOffices.slice(index + 1),
      ];
    };
  }
}

export default new SignalRManager();
