import { MessagesStore, MessagesStoreContext } from "mobx/stores/messagesStore";
import React, { ReactElement } from "react";
import { Message } from "types/message";
import { priceFormatter } from "utils/priceFormatter";
import { getMessagePrice } from "utils/messageUtils";
import { observer } from "mobx-react";

const ExecutionBanner: React.FC = observer((): ReactElement | null => {
  const messagesStore: MessagesStore =
    React.useContext<MessagesStore>(MessagesStoreContext);
  const { executions } = messagesStore;
  const latest: ReadonlyArray<Message> = executions.slice(0, 5);
  return (
    <div className={"execution-banner"}>
      {latest.map((execution: Message) => (
        <div className={"execution-banner-item"} key={execution.ExecID}>
          {execution.Symbol} {execution.Strategy} {execution.Tenor} @{" "}
          {priceFormatter(getMessagePrice(execution))}
        </div>
      ))}
    </div>
  );
});

export { ExecutionBanner };
