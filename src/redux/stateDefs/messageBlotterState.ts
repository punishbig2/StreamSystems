import {Message} from 'interfaces/message';

export interface MessageBlotterState {
  entries: Message[];
  user: string | null;
}
