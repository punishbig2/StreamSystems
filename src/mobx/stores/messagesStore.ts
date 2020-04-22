import { Message, ExecTypes } from 'interfaces/message';
import { observable, action } from 'mobx';
import { API } from 'API';
import { SignalRManager } from 'signalR/signalRManager';
import moment from 'moment';
import workareaStore from 'mobx/stores/workareaStore';
import { User } from 'interfaces/user';
import { getUserFromUrl } from 'utils/getUserFromUrl';

const MESSAGE_TIME_FORMAT: string = 'YYYYMMDD-HH:mm:ss';
const sortByTimeDescending = (m1: Message, m2: Message): number => {
  const M1: moment.Moment = moment(m1.TransactTime, MESSAGE_TIME_FORMAT);
  const M2: moment.Moment = moment(m2.TransactTime, MESSAGE_TIME_FORMAT);
  return -M1.diff(M2);
};

const isFill = (item: Message): boolean => {
  return item.ExecType === ExecTypes.PartiallyFilled
    || item.ExecType === ExecTypes.Filled
    || item.OrdStatus === ExecTypes.PartiallyFilled
    || item.OrdStatus === ExecTypes.Filled;
};

const hasLink = (messages: Message[], item: Message): boolean => {
  const getOrderLinkID = (message: any): string => {
    if (message.hasOwnProperty('ClOrdLinkID')) {
      return message.ClOrdLinkID;
    } else {
      return message['583'];
    }
  };
  const link: number = messages.findIndex((each: Message) => {
    return getOrderLinkID(each) === item.ClOrdID;
  });
  return link !== -1;
};

const isAcceptableFill = (message: Message, index: number, all: Message[]): boolean => {
  const user: User = workareaStore.user;
  if (!isFill(message))
    return false;
  const linkFound: boolean = hasLink(all, message);
  if (!linkFound)
    return true;
  if ((message.Username !== user.email) && (message.ContraTrader !== user.email))
    return message.Side === '1';
  return message.Username === user.email;
};

const applyFilter = (messages: Message[]): Message[] => {
  return messages.filter(isAcceptableFill);
};

export class MessagesStore {
  @observable.ref entries: Message[] = [];
  @observable.ref executions: Message[] = [];
  @observable connected: boolean = false;
  private cleanup: (() => void) | null = null;

  constructor() {
    this.initialize();
  }

  @action.bound
  public addEntry(message: Message) {
    const user: User = workareaStore.user;
    if (message.Username === user.email) {
      this.entries = [message, ...this.entries];
    }
    if (isAcceptableFill(message, 0, this.executions)) {
      this.executions = [message, ...this.executions];
    }
  }

  @action.bound
  public async initialize() {
    const now: Date = new Date();
    const midnight: Date = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const entries: Message[] = await API.getMessagesSnapshot('*', midnight.getTime());

    entries.sort(sortByTimeDescending);
    this.executions = applyFilter(entries);
    // Query the messages now
    this.entries = entries.filter((entry: Message) => entry.Username === getUserFromUrl());
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
