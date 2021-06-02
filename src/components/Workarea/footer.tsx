import strings from "locales";
import { ModalWindow } from "components/ModalWindow";
import { QuestionBox } from "components/QuestionBox";
import { TabBar } from "components/TabBar";
import { observer } from "mobx-react";
import store from "mobx/stores/workareaStore";
import React from "react";

export const Footer: React.FC = observer(
  (): React.ReactElement => {
    const [selectedToClose, setSelectedToClose] = React.useState<string | null>(
      null
    );
    const cancelCloseWorkspace = () => setSelectedToClose(null);
    const closeWorkspace = () => {
      store.closeWorkspace(selectedToClose as string).then(() => {});
      // Close the modal window
      setSelectedToClose(null);
    };
    const renderCloseQuestion = () => (
      <QuestionBox
        {...strings.CloseWorkspace}
        onYes={closeWorkspace}
        onNo={cancelCloseWorkspace}
      />
    );
    return (
      <div className={"footer"}>
        <TabBar
          entries={store.workspaces}
          active={store.currentWorkspaceID}
          connected={store.connected}
          setActiveTab={store.setWorkspace}
          onAddStandardWorkspace={store.addStandardWorkspace}
          onAddMiddleOfficeWorkspace={store.addMiddleOffice}
          onTabClosed={setSelectedToClose}
          onQuit={() => null}
          onWorkspaceRename={store.setWorkspaceName}
        />
        <ModalWindow render={renderCloseQuestion} isOpen={!!selectedToClose} />
      </div>
    );
  }
);
