import { ModalWindow } from 'components/ModalWindow';
import { QuestionBox } from 'components/QuestionBox';
import { TabBar } from 'components/TabBar';
import strings from 'locales';
import store from 'mobx/stores/workareaStore';
import { observer } from 'mobx-react';
import React from 'react';

export const Footer: React.FC = observer((): React.ReactElement => {
  const [selectedToClose, setSelectedToClose] = React.useState<number | null>(null);

  const cancelCloseWorkspace = (): void => setSelectedToClose(null);
  const closeWorkspace = (): void => {
    if (selectedToClose) {
      void store.closeWorkspace(selectedToClose);
      // Close the modal window
      setSelectedToClose(null);
    }
  };

  const renderCloseQuestion = (): React.ReactElement => (
    <QuestionBox {...strings.CloseWorkspace} onYes={closeWorkspace} onNo={cancelCloseWorkspace} />
  );

  return (
    <div className="footer">
      <TabBar
        items={store.workspaces}
        active={store.currentWorkspaceIndex}
        connected={store.connected}
        setActiveTab={store.setWorkspace}
        onAddStandardWorkspace={store.addStandardWorkspace}
        onAddMiddleOfficeWorkspace={store.addMiddleOffice}
        onTabClosed={setSelectedToClose}
        onQuit={(): null => null}
        onWorkspaceRename={store.setWorkspaceName}
      />
      <ModalWindow render={renderCloseQuestion} isOpen={selectedToClose !== null} />
    </div>
  );
});
