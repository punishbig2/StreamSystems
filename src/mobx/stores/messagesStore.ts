import { Message } from 'interfaces/message';
import { observable, action } from 'mobx';
import { API } from 'API';
import { getUserFromUrl } from 'utils/getUserFromUrl';
import { SignalRManager } from 'signalR/signalRManager';
import moment from 'moment';

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
    entries.unshift(message);
  }

  @action.bound
  public async initialize() {
    const email: string | null = getUserFromUrl();
    if (email !== null) {
      const now: Date = new Date();
      const midnight: Date = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
      const entries: Message[] = await API.getMessagesSnapshot('*', midnight.getTime());
      const format: string = 'YYYYMMDD-HH:mm:ss';
      entries.sort((m1: Message, m2: Message): number => {
        const M1: moment.Moment = moment(m1.TransactTime, format);
        const M2: moment.Moment = moment(m2.TransactTime, format);
        return -M1.diff(M2);
      });
      // Query the messages now
      this.entries = entries;
    }
  }

  @action.bound
  public connect(email: string) {
    const signalRManager: SignalRManager = SignalRManager.getInstance();
    // First cleanup the old listener if it's here
    if (this.cleanup)
      this.cleanup();
    this.connected = true;
    this.cleanup = signalRManager.setMessagesListener(email, (message: Message) => {
      this.addEntry(message);
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
