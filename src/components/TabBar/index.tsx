import { Menu, MenuItem, Typography } from "@material-ui/core";
import { Tab } from "components/Tab";
import { TabLabel } from "components/TabLabel";
import config from "config";
import workareaStore from "mobx/stores/workareaStore";

import React, { ReactElement, useMemo, useRef, useState } from "react";
import { Role } from "types/role";
import { CurrencyGroups, isCurrencyGroup } from "types/user";
import { Workspace } from "types/workspace";

interface Props {
  readonly entries: { [k: string]: Workspace };
  readonly active: string | null;
  readonly connected: boolean;
  readonly onAddStandardWorkspace: (group: CurrencyGroups) => void;
  readonly onAddMiddleOfficeWorkspace: () => void;
  readonly setActiveTab: (id: string) => void;
  readonly onTabClosed: (id: string) => void;
  readonly onQuit: () => void;
  readonly onWorkspaceRename: (id: string, name: string) => void;
}

enum WorkspaceType {
  MiddleOffice = "MIDDLE_OFFICE",
}

const isWorkspaceType = (value: any): value is WorkspaceType => {
  return value === WorkspaceType.MiddleOffice;
};

const TabBar: React.FC<Props> = (props: Props): ReactElement => {
  const { user } = workareaStore;
  const { active, entries } = props;
  const [isShowingOptions, showOptions] = useState<boolean>(false);
  const ref = useRef<HTMLDivElement>(null);
  const isTrader: boolean = useMemo((): boolean => {
    const { roles } = user;
    return roles.includes(Role.Trader);
  }, [user]);
  const isBroker: boolean = useMemo((): boolean => {
    const { roles } = user;
    return roles.includes(Role.Broker);
  }, [user]);
  const isMiddleOffice: boolean = useMemo((): boolean => {
    const { roles } = user;
    return (
      roles.includes(Role.MiddleOffice) ||
      roles.includes(Role.Admin) ||
      roles.includes(Role.Broker)
    );
  }, [user]);
  // Get the workspace entries
  const destroyWorkspace = (id: string) => {
    props.onTabClosed(id);
  };
  // Map the entries to an array
  const tabs: ReactElement[] = Object.values(entries).map<ReactElement>(
    (workspace: Workspace) => {
      const onClosed = (event: React.MouseEvent) => {
        event.stopPropagation();
        event.preventDefault();
        // Remove the tab (with it's contents)
        destroyWorkspace(workspace.id);
      };
      const onClick = () => props.setActiveTab(workspace.id);
      const label = (
        <TabLabel
          label={workspace.name}
          isDefault={!workspace.modified}
          onRenamed={(name: string) =>
            props.onWorkspaceRename(workspace.id, name)
          }
          onClosed={onClosed}
        />
      );
      return (
        <Tab
          key={workspace.id}
          id={workspace.id}
          onClick={onClick}
          active={workspace.id === active}
          label={label}
        />
      );
    }
  );
  // Add WorkspaceActions label
  const addWorkspaceLabel: ReactElement = (
    <button className={"new-workspace"}>
      <span>
        <i className={"fa fa-plus-circle"} />
      </span>
      <span>New Workspace</span>
    </button>
  );

  const getAddWorkspaceMenu = (): ReactElement | null => {
    const addTab = (type: WorkspaceType | CurrencyGroups) => {
      if (isCurrencyGroup(type)) {
        props.onAddStandardWorkspace(type);
      } else if (isWorkspaceType(type)) {
        if (type === WorkspaceType.MiddleOffice) {
          props.onAddMiddleOfficeWorkspace();
        }
      }
      showOptions(false);
    };

    return (
      <Menu
        anchorEl={ref.current}
        open={isShowingOptions}
        onClose={() => showOptions(false)}
        keepMounted={false}
      >
        {isTrader || isBroker ? (
          <MenuItem onClick={() => addTab(CurrencyGroups.Default)}>
            Empty
          </MenuItem>
        ) : null}
        {isMiddleOffice ? (
          <MenuItem onClick={() => addTab(WorkspaceType.MiddleOffice)}>
            Middle Office
          </MenuItem>
        ) : null}
      </Menu>
    );
  };
  // Render the bar
  return (
    <div className={"tab-layout"}>
      {tabs}
      <Tab
        ref={ref}
        active={false}
        label={addWorkspaceLabel}
        onClick={() => showOptions(true)}
      />
      {getAddWorkspaceMenu()}
      {workareaStore.hasUpdates ? (
        <div
          className={"new-version"}
          onClick={(): void => window.location.reload()}
        >
          <i className={"fa fa-sync"} />
          <Typography>New version available, click to reload!</Typography>
        </div>
      ) : null}
      <div className={"connectivity-indicator"}>
        {props.connected ? (
          <div className={"connected"}>
            <i className={"fa fa-link"} /> Connected
          </div>
        ) : (
          <div className={"disconnected"}>
            <i className={"fa fa-unlink"} />
            Disconnected
          </div>
        )}
      </div>
      <a className={"sign-out"} href={config.SignOutUrl}>
        <i className={"fa fa-sign-out-alt"} />
        <span>Logout</span>
      </a>
    </div>
  );
};

export { TabBar };
