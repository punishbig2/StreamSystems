import {Currency} from 'interfaces/currency';
import {Message} from 'interfaces/message';
import {Strategy} from 'interfaces/strategy';
import {User} from 'interfaces/user';
import {IWorkspace} from 'interfaces/workspace';

export enum WorkareaStatus {
  Starting, Initializing, Ready, UserNotFound, Error
}

export interface WorkareaState {
  symbols: Currency[];
  tenors: string[];
  products: Strategy[];
  banks: string[];
  activeWorkspace: string | null;
  workspaces: { [id: string]: IWorkspace },
  messages: Message[];
  user?: User;
  status: WorkareaStatus;
  connected: boolean;
  message?: string;
  lastExecution: Message | null;
}
