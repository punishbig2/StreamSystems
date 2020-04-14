import { Message } from 'interfaces/message';
import { observable, action } from 'mobx';
import { API } from 'API';
import { getUserFromUrl } from 'utils/getUserFromUrl';
import { SignalRManager } from 'redux/signalR/signalRManager';

export class MessagesStore {
  @observable entries: Message[] = [];
  @observable connected: boolean = false;
  private cleanup: (() => void) | null = null;

  constructor() {
    this.initialize();
  }

  @action.bound
  public addEntry(message: Message) {
    const { entries } = this;
    entries.push(message);
  }

  @action.bound
  public async initialize() {
    const email: string | null = getUserFromUrl();
    if (email !== null) {
      const now: Date = new Date();
      const midnight: Date = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
      // Query the messages now
      this.entries = await API.getMessagesSnapshot('*', midnight.getTime());
    }
  }

  @action.bound
  public connect(email: string) {
    const signalRManager: SignalRManager = SignalRManager.getInstance();
    const { entries } = this;
    // First cleanup the old listener if it's here
    if (this.cleanup)
      this.cleanup();
    this.connected = true;
    this.cleanup = signalRManager.setMessagesListener(email, (message: Message) => {
      entries.push(message);
    });
  }

  @action.bound
  public disconnect() {
    if (this.cleanup) {
      this.cleanup();
    }
  }
}

export default new MessagesStore();
