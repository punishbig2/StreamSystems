import { API } from "API";
import { action, autorun, computed, observable } from "mobx";
import workareaStore from "mobx/stores/workareaStore";
import React from "react";
import { playBeep } from "signalR/helpers";
import { ExecTypes, Message } from "types/message";
import { hasRole, Role } from "types/role";
import { User } from "types/user";
import {
  isAcceptableFill,
  isMyMessage,
  sortByTimeDescending,
} from "utils/messageUtils";
import userProfileStore from "mobx/stores/userPreferencesStore";
import signalRClient from "signalR/signalRClient";
import { parseTime } from "utils/timeUtils";

class MessagesStream {
  private listener: (message: ReadonlyArray<Message>) => void = (): void => {};

  constructor() {
    signalRClient.setMessagesListener(this.onMessage);
  }

  private dispatchExecutedMessageEvent(message: Message) {
    void playBeep(userProfileStore.preferences, message.ExDestination);

    setTimeout(() => {
      const eventName: string = `${message.ExecID}executed`;
      if (message.Side === "1") {
        const eventName: string = `${message.Symbol}${message.Strategy}${message.Side}Execution`;
        document.dispatchEvent(new CustomEvent(eventName));
      }
      document.dispatchEvent(new CustomEvent(eventName));
    }, 500);
  }

  private handleMessageActions(message: Message) {
    switch (message.OrdStatus) {
      case ExecTypes.Canceled:
        break;
      case ExecTypes.PendingCancel:
        break;
      case ExecTypes.Filled:
      case ExecTypes.PartiallyFilled:
        this.dispatchExecutedMessageEvent(message);
        if (MessagesStream.shouldShowPopup(message)) {
          workareaStore.addRecentExecution(message);
        }
        break;
      default:
        break;
    }
  }

  private static shouldShowPopup = (message: Message): boolean => {
    const user: User = workareaStore.user;
    const personality: string = workareaStore.personality;
    const { roles } = user;
    if (hasRole(roles, Role.Broker)) {
      return personality === message.MDMkt && message.Username === user.email;
    }
    return message.Username === user.email;
  };

  public onMessage = (messages: ReadonlyArray<Message>): void => {
    for (const message of messages) {
      this.handleMessageActions(message);
    }
    this.listener(messages);
  };

  public setHandler(listener: (message: ReadonlyArray<Message>) => void): void {
    this.listener = listener;
  }

  public removeHandler(): void {
    this.listener = (): void => {};
  }
}

export class MessagesStore {
  @observable loading: boolean = false;

  @observable.ref entries: ReadonlyArray<Message> = [];
  private stream: MessagesStream = new MessagesStream();
  @observable.ref executionHistory: ReadonlyArray<Message> = [];

  constructor() {
    autorun((): void => {
      if (workareaStore.connected) {
        void this.initialize();
      }
    });
  }

  @computed
  public get messages(): ReadonlyArray<Message> {
    return this.entries.filter(isMyMessage);
  }

  @computed
  public get executions(): ReadonlyArray<Message> {
    return [
      ...this.entries.filter(isAcceptableFill),
      ...this.executionHistory,
    ].sort((a: Message, b: Message): number => {
      return (
        parseTime(b.TransactTime).getTime() -
        parseTime(a.TransactTime).getTime()
      );
    });
  }

  @action.bound
  public addMessages(messages: ReadonlyArray<Message>): void {
    this.entries = [...messages, ...this.entries];
  }

  @action.bound
  public async initialize() {
    this.loading = true;
    // Load the data ...
    const now: Date = new Date();
    const midnight: Date = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      0,
      0,
      0
    );
    const daysAgo = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - 7,
      0,
      0,
      0
    );
    const entries: Message[] = await API.getMessagesSnapshot(
      "*",
      midnight.getTime()
    );
    // Sort all entries
    this.entries = entries.sort(sortByTimeDescending);
    // We're done
    this.loading = false;
    // Load executions history
    this.executionHistory = (
      await API.getExecutionHistory("*", midnight.getTime(), daysAgo.getTime())
    ).filter(isAcceptableFill);
  }

  @action.bound
  public connect(): void {
    // Call the initializer now, because the user email
    // has surely been set ;)
    void this.initialize();
    // Connect to signal R's manager
    // First cleanup the old listener if it's here
    this.stream.setHandler(this.addMessages);
  }

  @action.bound
  public disconnect(): void {
    this.stream.removeHandler();
  }

  @action.bound
  public reset(): void {
    this.entries = [...this.entries];
  }
}

export const MessagesStoreContext = React.createContext<MessagesStore>(
  new MessagesStore()
);
