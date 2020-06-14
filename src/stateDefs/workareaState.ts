import { Symbol } from "interfaces/symbol";
import { Message } from "interfaces/message";
import { Strategy } from "interfaces/strategy";
import { User, UserPreferences } from "interfaces/user";

export enum WorkareaStatus {
  Starting,
  Initializing,
  Welcome,
  Ready,
  UserNotFound,
  Error,
}

export interface WorkareaState {
  currencies: Symbol[];
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
  userProfile: UserPreferences;
}
