import {Tab} from 'components/Tab';
import {TabLabel} from 'components/TabLabel';

import React, {ReactElement} from 'react';

interface Entry {
  name: string;
  id: string;
}

interface Props {
  entries: { [key: string]: Entry };
  active: string | null;
  // Methods
  addTab: () => void;
  setActiveTab: (name: string) => void;
  // Close workspace
  onTabClosed: (id: string) => void;
  onTabRenamed: (name: string, id: string) => void;
}

const TabBar: React.FC<Props> = (props: Props): ReactElement => {
  const active: string | null = props.active;
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
      <TabLabel label={object.name} onRenamed={onRenamed} onClosed={onClosed}/>
    );
    return (
      <Tab key={id} id={id} onClick={onClick} active={id === active} label={label}/>
    );
  });
  // Add WorkspaceActions label
  const addWorkspaceLabel: ReactElement = (
    <button className={'new-workspace'}>
      <span><i className={'fa fa-plus-circle'}/></span><span>New Workspace</span>
    </button>
  );
  // Render the bar
  return (
    <div className={'tab-layout'}>
      {tabs}
      {/* Add button */}
      <Tab id={''} onClick={props.addTab} active={false} label={addWorkspaceLabel}/>
    </div>
  );
};

export {TabBar};
