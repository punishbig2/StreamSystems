import {Currency} from 'interfaces/currency';
import {Strategy} from 'interfaces/strategy';
import {User} from 'interfaces/user';
import {WindowState} from 'redux/stateDefs/windowState';
import {FXOAction} from 'redux/fxo-action';
import {PodTileActions} from 'redux/reducers/podTileReducer';
import {PodTable} from 'interfaces/podTable';

export interface DispatchProps {
  initialize: (workspaceID: string, windowID: string, rows: PodTable) => FXOAction<PodTileActions>;
  setStrategy: (workspaceID: string, windowID: string, strategy: string) => FXOAction<PodTileActions>;
  setSymbol: (workspaceID: string, windowID: string, currency: Currency) => FXOAction<PodTileActions>;
}

export interface OwnProps {
  id: string;
  workspaceID: string;
  user: User;
  tenors: string[];
  products: Strategy[];
  symbols: Currency[];
  connected: boolean;
  autoSize?: boolean;
  personality: string;
  onClose?: () => void;
}

export type Props = OwnProps & WindowState & DispatchProps;
