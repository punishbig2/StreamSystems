import { API } from "API";
import { action, autorun, observable } from "mobx";
import workareaStore from "mobx/stores/workareaStore";
import React from "react";
import { Message } from "types/message";
import {
  isAcceptableFill,
  isMyMessage,
  sortByTimeDescending,
} from "utils/messageUtils";

class MessagesStream {
  private listener: (message: ReadonlyArray<Message>) => void = (): void => {};

  constructor() {
    navigator.serviceWorker.register("./workers/messages.js").then((): void => {
      const worker = new Worker("./workers/messages.js");
      // Set it up
      worker.onmessage = this.onMessage;
    });
  }

  public onMessage = (message: MessageEvent): void => {
    this.listener(message.data);
  };

  public setHandler(listener: (message: ReadonlyArray<Message>) => void): void {
    this.listener = listener;
  }

  public removeHandler(): void {
    this.listener = (): void => {};
  }
}

export class MessagesStore {
  @observable.ref myMessages: ReadonlyArray<Message> = [];
  @observable.ref allExecutions: ReadonlyArray<Message> = [];
  @observable loading: boolean = false;

  private entries: ReadonlyArray<Message> = [];
  private stream: MessagesStream = new MessagesStream();

  constructor() {
    autorun((): void => {
      if (workareaStore.connected) {
        void this.initialize();
      }
    });
  }

  @action.bound
  public addMessages(messages: ReadonlyArray<Message>): void {
    this.myMessages = [...messages.filter(isMyMessage), ...this.myMessages];

    this.allExecutions = [
      ...messages.filter(isAcceptableFill),
      ...this.allExecutions,
    ];

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
}

export const MessagesStoreContext = React.createContext<MessagesStore>(
  new MessagesStore()
);
