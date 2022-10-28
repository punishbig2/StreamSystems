import { Tab } from "components/Tab";
import { AddWorkspaceMenu } from "components/TabBar/addWorkspaceMenu";
import { TabLabel } from "components/TabLabel";
import config from "config";
import workareaStore from "mobx/stores/workareaStore";

import React, { ReactElement, useMemo, useRef, useState } from "react";
import { hasRole, Role } from "types/role";
import { CurrencyGroups } from "types/user";
import { Workspace } from "types/workspace";

interface Props {
  readonly items: ReadonlyArray<Workspace>;
  readonly active: number | null;
  readonly connected: boolean;
  readonly onAddStandardWorkspace: (group: CurrencyGroups) => void;
  readonly onAddMiddleOfficeWorkspace: () => void;
  readonly setActiveTab: (index: number) => void;
  readonly onTabClosed: (index: number) => void;
  readonly onQuit: () => void;
  readonly onWorkspaceRename: (index: number, name: string) => void;
}

const TabBar: React.FC<Props> = (props: Props): ReactElement => {
  const { user } = workareaStore;
  const { active, items } = props;
  const [isShowingOptions, showOptions] = useState<boolean>(false);
  const ref = useRef<HTMLDivElement>(null);
  const isTrader: boolean = useMemo((): boolean => {
    const { roles } = user;
    return hasRole(roles, Role.Trader);
  }, [user]);
  const isBroker: boolean = useMemo((): boolean => {
    const { roles } = user;
    return hasRole(roles, Role.Broker);
  }, [user]);
  const isMiddleOffice: boolean = useMemo((): boolean => {
    const { roles } = user;
    return (
      hasRole(roles, Role.MiddleOffice) ||
      hasRole(roles, Role.Admin) ||
      hasRole(roles, Role.Broker)
    );
  }, [user]);
  // Get the workspace entries
  const destroyWorkspace = (index: number) => {
    props.onTabClosed(index);
  };
  return (
    <div className="tab-layout">
      {items.map<ReactElement>((workspace: Workspace, index: number) => {
        const onClosed = (event: React.MouseEvent) => {
          event.stopPropagation();
          event.preventDefault();
          // Remove the tab (with it's contents)
          destroyWorkspace(index);
        };
        const onClick = () => props.setActiveTab(index);
        const label = (
          <TabLabel
            label={workspace.name}
            isDefault={!workspace.modified}
            onRenamed={(name: string) => props.onWorkspaceRename(index, name)}
            onClosed={onClosed}
          />
        );
        return (
          <Tab
            key={index}
            onClick={onClick}
            active={index === active}
            label={label}
          />
        );
      })}
      <Tab
        ref={ref}
        active={false}
        label={
          <button className="new-workspace">
            <span>
              <i className="fa fa-plus-circle" />
            </span>
            <span>New Workspace</span>
          </button>
        }
        onClick={() => showOptions(true)}
      />
      <AddWorkspaceMenu
        onAddTradingWorkspace={props.onAddStandardWorkspace}
        onAddMiddleOfficeWorkspace={props.onAddMiddleOfficeWorkspace}
        showOptions={showOptions}
        isShowingOptions={isShowingOptions}
        isTrader={isTrader}
        isBroker={isBroker}
        isMiddleOffice={isMiddleOffice}
        anchorEl={ref.current}
      />
      <div className="connectivity-indicator">
        {props.connected ? (
          <div className="connected">
            <i className="fa fa-link" />
            Live
          </div>
        ) : (
          <div className="disconnected">
            <i className="fa fa-unlink" />
            Refresh
          </div>
        )}
      </div>
      <a className="sign-out" href={config.SignOutUrl}>
        <i className="fa fa-sign-out-alt" />
        <span>Logout</span>
      </a>
    </div>
  );
};

export { TabBar };
