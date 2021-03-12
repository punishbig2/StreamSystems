import { Symbol } from "types/symbol";
import { Message } from "types/message";
import { Product } from "types/product";
import { User, UserPreferences } from "types/user";

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
