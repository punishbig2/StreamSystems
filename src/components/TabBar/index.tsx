import { Tab } from "components/Tab";
import { TabLabel } from "components/TabLabel";
import config from "config";

import React, { ReactElement, useState, useRef } from "react";
import { Menu, MenuItem } from "@material-ui/core";
import { CurrencyGroups, isCurrencyGroup } from "types/user";
import { WorkspaceDef } from "mobx/stores/workareaStore";

interface Props {
  readonly entries: { [k: string]: WorkspaceDef };
  readonly active: string | null;
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
  const { active, entries } = props;
  const [isShowingOptions, showOptions] = useState<boolean>(false);
  const ref = useRef<HTMLDivElement>(null);
  // Get the workspace entries
  const destroyWorkspace = (id: string) => {
    props.onTabClosed(id);
  };
  // Map the entries to an array
  const tabs: ReactElement[] = Object.values(entries).map<ReactElement>(
    (workspace: WorkspaceDef) => {
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
          isDefault={workspace.isDefault}
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
    const groups = Object.values(CurrencyGroups).filter(
      (group: CurrencyGroups) => group !== CurrencyGroups.Default
    );

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
        {groups.map((group: CurrencyGroups) => (
          <MenuItem key={group} onClick={() => addTab(group)}>
            {group} Default
          </MenuItem>
        ))}
        <MenuItem onClick={() => addTab(CurrencyGroups.Default)}>
          Empty
        </MenuItem>
        <MenuItem onClick={() => addTab(WorkspaceType.MiddleOffice)}>
          Middle Office
        </MenuItem>
      </Menu>
    );
  };
  // Render the bar
  return (
    <div className={"tab-layout"}>
      {tabs}
      <Tab
        id={""}
        onClick={() => showOptions(true)}
        active={false}
        label={addWorkspaceLabel}
        ref={ref}
      />
      {getAddWorkspaceMenu()}
      <a className={"sign-out"} href={config.SignOutUrl}>
        <i className={"fa fa-sign-out-alt"} />
        <span>Logout</span>
      </a>
    </div>
  );
};

export { TabBar };
