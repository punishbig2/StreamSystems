import {Tab} from 'components/Tab';
import {TabLabel} from 'components/TabLabel';
import config from 'config';

import React, {ReactElement, useState, useRef} from 'react';
import {Menu, MenuItem} from '@material-ui/core';
import {CurrencyGroups} from 'interfaces/user';

interface Entry {
  name: string;
  id: string;
  isDefaultWorkspace: boolean;
}

interface Props {
  entries: { [key: string]: Entry };
  active: string | null;
  addTab: (group: CurrencyGroups) => void;
  setActiveTab: (name: string) => void;
  onTabClosed: (id: string) => void;
  onTabRenamed: (name: string, id: string) => void;
  onQuit: () => void;
}

const TabBar: React.FC<Props> = (props: Props): ReactElement => {
  const active: string | null = props.active;
  const [isShowingOptions, showOptions] = useState<boolean>(false);
  const ref = useRef<HTMLDivElement>(null);
  // Get the workspace entries
  const entries: [string, Entry][] = Object.entries<Entry>(props.entries);
  const destroyWorkspace = (id: string) => {
    props.onTabClosed(id);
  };
  // Map the entries to an array
  const tabs: ReactElement[] = entries.map<ReactElement>(([id, object]) => {
    const onClosed = (event: React.MouseEvent) => {
      event.stopPropagation();
      event.preventDefault();
      // Remove the tab (with it's contents)
      destroyWorkspace(id);
    };
    const onClick = () => props.setActiveTab(id);
    const onRenamed = (name: string) => props.onTabRenamed(name, id);
    const label = (
      <TabLabel label={object.name} isDefault={object.isDefaultWorkspace} onRenamed={onRenamed} onClosed={onClosed}/>
    );
    return (
      <Tab key={id} id={id} onClick={onClick} active={id === active} label={label}/>
    );
  });
  // Add WorkspaceActions label
  const addWorkspaceLabel: ReactElement = (
    <button className={'new-workspace'}>
      <span>
        <i className={'fa fa-plus-circle'}/>
      </span>
      <span>New Workspace</span>
    </button>
  );

  const getAddWorkspaceMenu = (): ReactElement | null => {
    const groups = Object
      .values(CurrencyGroups)
      .filter((group: CurrencyGroups) => group !== CurrencyGroups.Invalid)
    ;
    const addTab = (group: CurrencyGroups) => {
      props.addTab(group);
      showOptions(false);
    };
    return (
      <Menu anchorEl={ref.current} open={isShowingOptions} onClose={() => showOptions(false)} keepMounted={false}>
        {groups.map((group: CurrencyGroups) => (
          <MenuItem key={group} onClick={() => addTab(group)}>
            {group} Default
          </MenuItem>
        ))}
        <MenuItem onClick={() => addTab(CurrencyGroups.Invalid)}>Empty</MenuItem>
      </Menu>
    );
  };
  // Render the bar
  return (
    <div className={'tab-layout'}>
      {tabs}
      <Tab id={''} onClick={() => showOptions(true)} active={false} label={addWorkspaceLabel} ref={ref}/>
      {getAddWorkspaceMenu()}
      <a className={'sign-out'} href={config.SignOutUrl}>
        <i className={'fa fa-sign-out-alt'}/>
        <span>Logout</span>
      </a>
    </div>
  );
};

export {TabBar};
