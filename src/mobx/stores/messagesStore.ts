import { Message } from 'interfaces/message';
import { observable, action } from 'mobx';
import { API } from 'API';
import { SignalRManager } from 'signalR/signalRManager';
import workareaStore from 'mobx/stores/workareaStore';
import { User } from 'interfaces/user';
import { isAcceptableFill, isFill, sortByTimeDescending, isMyMessage, getLink } from 'messageUtils';

export class MessagesStore {
  @observable.ref myMessages: Message[] = [];
  @observable.ref systemExecutions: Message[] = [];
  @observable.ref executions: Message[] = [];
  @observable loading: boolean = false;
  private cleanup: (() => void) | null = null;

  @action.bound
  public addEntry(message: Message) {
    const user: User = workareaStore.user;
    if (message.Username === user.email)
      this.myMessages = [message, ...this.myMessages];
    if (isAcceptableFill(message))
      this.executions = [message, ...this.executions];
    if (isFill(message))
      this.systemExecutions = [message, ...this.systemExecutions];
  }

  @action.bound
  public async initialize() {
    this.loading = true;
    // Load the data ...
    const now: Date = new Date();
    const midnight: Date = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const entries: Message[] = await API.getMessagesSnapshot('*', midnight.getTime());
    // Sort all entries
    entries.sort(sortByTimeDescending);
    // Group by interest
    this.executions = entries.filter(isAcceptableFill);
    this.myMessages = entries.filter(isMyMessage);
    this.systemExecutions = entries.filter(isFill)
      .filter((message: Message, index: number, all: Message[]): boolean => {
        // Remove duplicates
        return all.findIndex((m: Message) => getLink(m) === getLink(message)) !== index;
      });
    // We're done
    this.loading = false;
  }

  @action.bound
  public connect(email: string) {
    // Call the initializer now, because the user email
    // has surely been set ;)
    this.initialize();
    // Connect to signal R's manager
    const signalRManager: SignalRManager = SignalRManager.getInstance();
    // First cleanup the old listener if it's here
    signalRManager.setMessagesListener(email, (message: Message) => {
      this.addEntry(message);
    });
  }

  @action.bound
  public disconnect() {
    const signalRManager: SignalRManager = SignalRManager.getInstance();
    signalRManager.removeMessagesListener();
  }
}

export default new MessagesStore();
