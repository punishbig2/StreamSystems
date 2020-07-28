import React, { ReactElement } from "react";
import { Message } from "types/message";
import { priceFormatter } from "utils/priceFormatter";
import store from "mobx/stores/messagesStore";
import { getMessagePrice } from "utils/messageUtils";
import { observer } from "mobx-react";

const ExecutionBanner: React.FC<{}> = observer((): ReactElement | null => {
  const { executions } = store;
  const last5: Message[] = executions.slice(0, 5);
  return (
    <div className={"execution-banner"}>
      {last5.map((execution: Message) => (
        <div className={"execution-banner-item"} key={execution.ExecID}>
          {execution.Symbol} {execution.Strategy} {execution.Tenor} @{" "}
          {priceFormatter(getMessagePrice(execution))}
        </div>
      ))}
    </div>
  );
});

export { ExecutionBanner };
