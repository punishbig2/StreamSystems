import { FXSymbol } from 'types/FXSymbol';
import { Message } from 'types/message';
import { Product } from 'types/product';
import { User, UserPreferences } from 'types/user';

export enum WorkareaStatus {
  Starting = 'starting',
  Initializing = 'initializing',
  Welcome = 'welcome',
  Ready = 'ready',
  UserNotFound = 'user-not-found',
  NotAllowedAtThisTime = 'not-allowed-at-this-time',
  Error = 'error',
}

export interface WorkareaState {
  currencies: FXSymbol[];
  tenors: string[];
  strategies: Product[];
  banks: string[];
  activeWorkspace: string | null;
  messages: Message[];
  user?: User;
  originalUser?: User;
  status: WorkareaStatus;
  connected: boolean;
  message?: string;
  recentExecutions: Message[];
  userProfile: UserPreferences;
}
