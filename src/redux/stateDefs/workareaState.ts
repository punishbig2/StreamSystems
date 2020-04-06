import { Currency } from 'interfaces/currency';
import { Message } from 'interfaces/message';
import { Strategy } from 'interfaces/strategy';
import { User, UserWorkspace } from 'interfaces/user';

export enum WorkareaStatus {
  Starting,
  Initializing,
  Ready,
  UserNotFound,
  Error
}

export interface WorkareaState {
  currencies: Currency[];
  tenors: string[];
  strategies: Strategy[];
  banks: string[];
  activeWorkspace: string | null;
  messages: Message[];
  user?: User;
  originalUser?: User;
  status: WorkareaStatus;
  connected: boolean;
  message?: string;
  recentExecutions: Message[];
  userProfile: UserWorkspace;
}
