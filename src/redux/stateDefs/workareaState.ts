import {Message} from 'interfaces/message';
import {Strategy} from 'interfaces/strategy';
import {IWorkspace} from 'interfaces/workspace';

export enum WorkareaStatus {
  Starting, Initializing, Ready
}

export interface WorkareaState {
  symbols: string[];
  tenors: string[];
  products: Strategy[];
  activeWorkspace: string | null;
  workspaces: {[id: string]: IWorkspace},
  messages: Message[];
  status: WorkareaStatus;
}