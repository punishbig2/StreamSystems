import {MessageBlotterEntry} from 'interfaces/messageBlotterEntry';

export interface MessageBlotterState {
  entries: MessageBlotterEntry[];
  connected: boolean;
}
