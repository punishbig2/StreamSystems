import {Product} from 'interfaces/product';
import {User} from 'interfaces/user';
import {IWorkspace} from 'interfaces/workspace';

export interface WorkareaState {
  symbols: string[];
  tenors: string[];
  products: Product[];
  activeWorkspace: string | null;
  workspaces: {[id: string]: IWorkspace},
  user: User;
}
