import { Message } from 'interfaces/message';
import { observable } from 'mobx';

export class MessageBlotterStore {
  @observable entries: Message[] = [];
}
