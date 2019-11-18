import {Message} from 'interfaces/message';

export interface MessageBlotterState {
  entries: Message[];
  connected: boolean;
  lastEntry: Message | null;
}
