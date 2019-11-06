import {Strategy} from 'interfaces/strategy';
import {User} from 'interfaces/user';
import {IWorkspace} from 'interfaces/workspace';

export interface WorkareaState {
  symbols: string[];
  tenors: string[];
  products: Strategy[];
  activeWorkspace: string | null;
  workspaces: {[id: string]: IWorkspace},
  user: User;
}
