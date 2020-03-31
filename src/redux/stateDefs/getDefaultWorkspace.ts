import {CurrencyGroups} from 'interfaces/user';
import {defaultLatamWorkspace} from 'defaultWorkspaces/latam';
import {WorkspaceState, defaultWorkspaceState} from 'redux/stateDefs/workspaceState';
import {Currency} from 'interfaces/currency';

export const getDefaultWorkspace = (symbols: Currency[], group: CurrencyGroups): WorkspaceState => {
  switch (group) {
    case CurrencyGroups.Invalid:
      return defaultWorkspaceState;
    case CurrencyGroups.Latam:
      return defaultLatamWorkspace(symbols);
  }
};
