import { Message } from "interfaces/message";
import { observable, action } from "mobx";
import { API } from "API";
import signalRManager from "signalR/signalRManager";
import workareaStore from "mobx/stores/workareaStore";
import { User } from "interfaces/user";
import {
  isAcceptableFill,
  sortByTimeDescending,
  isMyMessage,
} from "messageUtils";

export class MessagesStore {
  private entries: Message[] = [];
  @observable.ref myMessages: Message[] = [];
  @observable.ref executions: Message[] = [];
  @observable loading: boolean = false;

  @action.bound
  public addEntry(message: Message) {
    const user: User = workareaStore.user;
    if (message.Username === user.email)
      this.myMessages = [message, ...this.myMessages];
    if (isAcceptableFill(message))
      this.executions = [message, ...this.executions];
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

    this.executions = entries.filter(isAcceptableFill);
    this.myMessages = entries.filter(isMyMessage);
  }

  @action.bound
  public connect() {
    // Call the initializer now, because the user email
    // has surely been set ;)
    this.initialize();
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

export default new MessagesStore();
