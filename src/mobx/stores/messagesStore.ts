import { API } from 'API';
import { action, autorun, computed, makeObservable, observable } from 'mobx';
import userProfileStore from 'mobx/stores/userPreferencesStore';
import workareaStore from 'mobx/stores/workareaStore';
import React from 'react';
import { playBeep } from 'signalR/helpers';
import signalRClient from 'signalR/signalRClient';
import { ExecTypes, Message } from 'types/message';
import { hasRole, Role } from 'types/role';
import { User } from 'types/user';
import { isAcceptableFill, isMyMessage, sortByTimeDescending } from 'utils/messageUtils';
import { parseTime } from 'utils/timeUtils';

class MessagesStream {
  private listener: (message: readonly Message[]) => void = (): void => {
    return;
  };

  constructor() {
    signalRClient.setMessagesListener(this.onMessage);
  }

  private dispatchExecutedMessageEvent(message: Message): void {
    void playBeep(userProfileStore.preferences, message.ExDestination);

    setTimeout(() => {
      const eventName = `${message.ExecID}executed`;
      if (message.Side === '1') {
        const eventName = `${message.Symbol}${message.Strategy}${message.Side}Execution`;
        document.dispatchEvent(new CustomEvent(eventName));
      }
      document.dispatchEvent(new CustomEvent(eventName));
    }, 500);
  }

  private handleMessageActions(message: Message): void {
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

  public onMessage = (messages: readonly Message[]): void => {
    for (const message of messages) {
      this.handleMessageActions(message);
    }
    this.listener(messages);
  };

  public setHandler(listener: (message: readonly Message[]) => void): void {
    this.listener = listener;
  }

  public removeHandler(): void {
    this.listener = (): void => {
      return;
    };
  }
}

export class MessagesStore {
  public loading = false;

  public entries: readonly Message[] = [];
  private stream: MessagesStream = new MessagesStream();
  public executionHistory: readonly Message[] = [];

  constructor() {
    makeObservable(this, {
      loading: observable,
      entries: observable.ref,
      executionHistory: observable.ref,
      messages: computed,
      executions: computed,
      addMessages: action.bound,
      setSnapshotAndHistory: action.bound,
      connect: action.bound,
      disconnect: action.bound,
      reset: action.bound,
    });

    autorun((): void => {
      if (workareaStore.connected) {
        void this.initialize();
      }
    });
  }

  public get messages(): readonly Message[] {
    return this.entries.filter(isMyMessage);
  }

  public get executions(): readonly Message[] {
    return [...this.entries.filter(isAcceptableFill), ...this.executionHistory].sort(
      (a: Message, b: Message): number => {
        return parseTime(b.TransactTime).getTime() - parseTime(a.TransactTime).getTime();
      }
    );
  }

  public addMessages(messages: readonly Message[]): void {
    this.entries = [...messages, ...this.entries];
  }

  public setSnapshotAndHistory(entries: readonly Message[], history: readonly Message[]): void {
    // Sort all entries
    this.entries = entries.slice().sort(sortByTimeDescending);
    // We're done
    this.loading = false;
    // Load executions history
    this.executionHistory = history.filter(isAcceptableFill);
  }

  public async initialize(): Promise<void> {
    this.loading = true;
    // Load the data ...
    const now: Date = new Date();
    const midnight: Date = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const daysAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7, 0, 0, 0);
    const entries = await API.getMessagesSnapshot('*', midnight.getTime());
    const history = await API.getExecutionHistory('*', midnight.getTime(), daysAgo.getTime());

    this.setSnapshotAndHistory(entries, history);
  }

  public connect(): void {
    // Call the initializer now, because the user email
    // has surely been set ;)
    void this.initialize();
    // Connect to signal R's manager
    // First cleanup the old listener if it's here
    this.stream.setHandler(this.addMessages);
  }

  public disconnect(): void {
    this.stream.removeHandler();
  }

  public reset(): void {
    this.entries = [...this.entries];
  }
}

export const MessagesStoreContext = React.createContext<MessagesStore>(new MessagesStore());
