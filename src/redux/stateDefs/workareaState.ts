import {Currency} from 'interfaces/currency';
import {Message} from 'interfaces/message';
import {Strategy} from 'interfaces/strategy';
import {User, UserWorkspace} from 'interfaces/user';
import {WorkspaceState} from 'redux/stateDefs/workspaceState';

export enum WorkareaStatus {
  Starting,
  Initializing,
  Ready,
  UserNotFound,
  Error
}

export interface WorkareaState {
  symbols: Currency[];
  tenors: string[];
  products: Strategy[];
  banks: string[];
  activeWorkspace: string | null;
  workspaces: { [id: string]: WorkspaceState };
  messages: Message[];
  user?: User;
  originalUser?: User;
  status: WorkareaStatus;
  connected: boolean;
  message?: string;
  recentExecutions: Message[];
  userProfile: UserWorkspace;
}
