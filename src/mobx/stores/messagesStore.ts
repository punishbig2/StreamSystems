import { involved } from "columns/messageBlotterColumns/helpers";
import { STRM } from "stateDefs/workspaceState";
import { Message } from "types/message";
import { observable, action, computed } from "mobx";
import { API } from "API";
import signalRManager from "signalR/signalRManager";
import workareaStore from "mobx/stores/workareaStore";
import { Role } from "types/role";
import { User } from "types/user";
import { Symbol } from "types/symbol";
import {
  isAcceptableFill,
  sortByTimeDescending,
  isMyMessage,
} from "utils/messageUtils";

export class MessagesStore {
  private entries: ReadonlyArray<Message> = [];
  @observable.ref myMessages: ReadonlyArray<Message> = [];
  @observable.ref allExecutions: ReadonlyArray<Message> = [];
  @observable loading: boolean = false;
  @observable ccyGroupFilter = "All";

  private static normalExecutionsFilter(
    executions: ReadonlyArray<Message>
  ): ReadonlyArray<Message> {
    const { roles } = workareaStore.user;
    if (
      (roles.includes(Role.Broker) && workareaStore.personality !== STRM) ||
      !roles.includes(Role.Broker)
    ) {
      return executions.filter(involved);
    } else {
      return executions;
    }
  }

  @computed
  public get executions(): ReadonlyArray<Message> {
    const { symbols } = workareaStore;
    const { allExecutions } = this;
    const { ccyGroupFilter } = this;
    if (ccyGroupFilter !== "All") {
      const filteredSymbols = symbols.filter(
        ({ ccyGroup }: Symbol): boolean =>
          ccyGroupFilter.toLowerCase() == ccyGroup.toLowerCase()
      );
      return MessagesStore.normalExecutionsFilter(
        allExecutions.filter(
          (message: Message): boolean =>
            filteredSymbols.find((symbol: Symbol): boolean => {
              return symbol.symbolID === message.Symbol;
            }) !== undefined
        )
      );
    } else {
      return MessagesStore.normalExecutionsFilter(allExecutions);
    }
  }

  @action.bound
  public setCCYGroupFilter(filter: string): void {
    this.ccyGroupFilter = filter;
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

export default new MessagesStore();
