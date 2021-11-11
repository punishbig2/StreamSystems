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
  private cacheTimer = setTimeout((): void => {}, 0);
  private allExecutionsCache: ReadonlyArray<Message> = [];
  private myMessagesCache: ReadonlyArray<Message> = [];

  constructor() {
    autorun((): void => {
      if (workareaStore.connected) {
        void this.initialize();
      }
    });
  }

  @action.bound
  public addToCache(message: Message) {
    if (isMyMessage(message))
      this.myMessagesCache = [message, ...this.myMessagesCache];

    if (isAcceptableFill(message))
      this.allExecutionsCache = [message, ...this.allExecutionsCache];

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
  private flushCache(): void {
    this.myMessages = this.myMessagesCache;
    this.allExecutions = this.allExecutionsCache;
    console.log("flushed");
  }

  @action.bound
  public connect() {
    // Call the initializer now, because the user email
    // has surely been set ;)
    void this.initialize();
    // Connect to signal R's manager
    // First cleanup the old listener if it's here
    signalRManager.setMessagesListener((message: Message) => {
      this.addToCache(message);

      clearTimeout(this.cacheTimer);
      this.cacheTimer = setTimeout(this.flushCache, 200);
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
