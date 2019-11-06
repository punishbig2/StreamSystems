import {MessageBlotterEntry} from 'interfaces/messageBlotterEntry';

export interface MessageBlotterState {
  entries: {[id: string]: MessageBlotterEntry};
  connected: boolean;
}
