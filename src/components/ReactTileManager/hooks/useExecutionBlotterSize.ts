import messageBlotterColumns, { BlotterTypes } from 'columns/messageBlotter';
import { TableColumn } from 'components/Table/tableColumn';
import { themeStore } from 'mobx/stores/themeStore';
import workareaStore from 'mobx/stores/workareaStore';
import React, { useMemo } from 'react';
import { NONE } from 'stateDefs/workspaceState';
import { hasRole, Role } from 'types/role';
import { User } from 'types/user';
import { getOptimalWidthFromColumnsSpec } from 'utils/getOptimalWidthFromColumnsSpec';
import { idealBlotterHeight } from 'utils/idealBlotterHeight';
import { Size } from 'utils/windowUtils';

export const useExecutionBlotterSize = (): Size => {
  const user: User = workareaStore.user;
  const personality: string = workareaStore.personality;
  const brokerMode: boolean = useMemo((): boolean => {
    const { roles } = user;
    if (!hasRole(roles, Role.Broker)) return false;
    return personality === NONE;
  }, [personality, user]);
  const type: 'normal' | 'broker' = React.useMemo(
    (): 'normal' | 'broker' => (brokerMode ? 'broker' : 'normal'),
    [brokerMode]
  );
  const columns = React.useMemo(
    (): readonly TableColumn[] => messageBlotterColumns(BlotterTypes.Executions)[type],
    [type]
  );
  return React.useMemo(
    () => ({
      width: getOptimalWidthFromColumnsSpec(
        themeStore.fontFamily,
        themeStore.fontSize + 2,
        columns
      ),
      // Compute the ideal height
      height: idealBlotterHeight(),
    }),
    [columns]
  );
};
