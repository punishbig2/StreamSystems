import { observable } from 'mobx';
import { Message } from 'interfaces/message';

export class ExecutionBannerStore {
  @observable executions: Message[] = [];
}
