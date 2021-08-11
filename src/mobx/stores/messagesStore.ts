import { API } from "API";
import { action, autorun, observable } from "mobx";
import workareaStore from "mobx/stores/workareaStore";
import React from "react";
import signalRManager from "signalR/signalRManager";
import { Message } from "types/message";
import { User } from "types/user";
import {
  isAcceptableFill,
  isMyMessage,
  sortByTimeDescending,
} from "utils/messageUtils";

export class MessagesStore {
  @observable.ref myMessages: ReadonlyArray<Message> = [];
  @observable.ref allExecutions: ReadonlyArray<Message> = [];
  @observable loading: boolean = false;
  private entries: ReadonlyArray<Message> = [];

  constructor() {
    autorun((): void => {
      if (workareaStore.connected) {
        void this.initialize();
      }
    });
  }

  @action.bound
  public addEntry(message: Message) {
    const user: User = workareaStore.user;
    if (message.Username === user.email)
      this.myMessages = [message, ...this.myMessages];
    if (isAcceptableFill(message))
      this.allExecutions = [message, ...this.allExecutions];
    this.entries = [message, ...this.entries];
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
    const entries: Message[] = await API.getMessagesSnapshot(
      "*",
      midnight.getTime()
    );
    // Sort all entries
    this.entries = entries.sort(sortByTimeDescending);
    this.reapplyFilters();
    // We're done
    this.loading = false;
  }

  @action.bound
  public reapplyFilters() {
    const { entries } = this;

    this.allExecutions = entries.filter(isAcceptableFill);
    this.myMessages = entries.filter(isMyMessage);
  }

  @action.bound
  public connect() {
    // Call the initializer now, because the user email
    // has surely been set ;)
    void this.initialize();
    // Connect to signal R's manager
    // First cleanup the old listener if it's here
    signalRManager.setMessagesListener((message: Message) => {
      this.addEntry(message);
    });
  }

  @action.bound
  public disconnect() {
    signalRManager.removeMessagesListener();
  }
}

export const MessagesStoreContext = React.createContext<MessagesStore>(
  new MessagesStore()
);
