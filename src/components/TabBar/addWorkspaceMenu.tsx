import { Menu, MenuItem } from '@material-ui/core';
import React from 'react';
import { CurrencyGroups, isCurrencyGroup } from 'types/user';

interface MenuProps {
  readonly onAddTradingWorkspace: (group: CurrencyGroups) => void;
  readonly onAddMiddleOfficeWorkspace: () => void;
  readonly showOptions: (value: boolean) => void;
  readonly isShowingOptions: boolean;
  readonly isTrader: boolean;
  readonly isBroker: boolean;
  readonly isMiddleOffice: boolean;
  readonly anchorEl: HTMLElement | null;
}

export const AddWorkspaceMenu: React.FC<MenuProps> = (props: MenuProps): React.ReactElement => {
  const addTab = (type?: CurrencyGroups): void => {
    if (isCurrencyGroup(type)) {
      props.onAddTradingWorkspace(type);
    } else {
      props.onAddMiddleOfficeWorkspace();
    }
    props.showOptions(false);
  };

  return (
    <Menu
      anchorEl={props.anchorEl}
      open={props.isShowingOptions}
      onClose={(): void => props.showOptions(false)}
      keepMounted={false}
    >
      {props.isTrader || props.isBroker ? (
        <MenuItem onClick={() => addTab(CurrencyGroups.Default)}>Empty</MenuItem>
      ) : null}
      {props.isMiddleOffice ? <MenuItem onClick={() => addTab()}>Middle Office</MenuItem> : null}
    </Menu>
  );
};
