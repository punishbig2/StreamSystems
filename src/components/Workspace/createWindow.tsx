import { Currency } from 'interfaces/currency';
import { Strategy } from 'interfaces/strategy';
import { User } from 'interfaces/user';
import { WindowTypes } from 'redux/constants/workareaConstants';
import { PodTile } from 'components/PodTile';
import { MessageBlotter } from 'components/MessageBlotter';
import { BlotterTypes } from 'redux/constants/messageBlotterConstants';
import React from 'react';
import { PodTileStore } from 'mobx/stores/podTile';

export const createWindow = (wID: string, type: WindowTypes, workspaceID: string, currencies: Currency[], strategies: Strategy[], tenors: string[], connected: boolean, user: User | null, personality: string) => {
  /*if (user === null)
    return null;
  switch (type) {
    case WindowTypes.Empty:
      return null;
    case WindowTypes.PodTile:
      const store: PodTileStore = new PodTileStore(wID);
      return (
        <PodTile
          id={wID}
          workspaceID={workspaceID}
          currencies={currencies}
          strategies={strategies}
          tenors={tenors}
          store={store}
          user={user}
          connected={connected}
          personality={personality}/>
      );
    case WindowTypes.MessageBlotter:
      return (
        <MessageBlotter
          id={wID}
          connected={connected}
          personality={personality}
          blotterType={BlotterTypes.Regular}
          user={user}/>
      );
    default:
      throw new Error(`invalid tile type ${type}`);
  }*/
  return null;
};
