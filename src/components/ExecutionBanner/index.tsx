import { MessagesStore, MessagesStoreContext } from "mobx/stores/messagesStore";
import React, { ReactElement } from "react";
import { Message } from "types/message";
import { priceFormatter } from "utils/priceFormatter";
import { getMessagePrice } from "utils/messageUtils";
import { observer } from "mobx-react";
import { Sides } from "types/sides";
import { toClassName } from "utils/conditionalClasses";

const ExecutionBanner: React.FC = observer((): ReactElement | null => {
  const messagesStore: MessagesStore =
    React.useContext<MessagesStore>(MessagesStoreContext);
  const { executions } = messagesStore;
  const latest: ReadonlyArray<Message> = executions.slice(0, 5);

  return (
    <div className={"execution-banner"}>
      {latest.map((execution: Message) => {
        const aggressionClass = getAggressionClass(execution);

        return (
          <div
            className={toClassName("execution-banner-item", aggressionClass)}
            key={execution.ExecID}
          >
            {execution.Symbol} {execution.Strategy} {execution.Tenor} @{" "}
            {priceFormatter(getMessagePrice(execution))}
          </div>
        );
      })}
    </div>
  );
});

export { ExecutionBanner };
const getAggressionClass = (execution: Message): string => {
  if (execution.AggressorIndicator === "Y") {
    if (execution.Side === Sides.Buy) {
      return "buy";
    } else {
      return "sell";
    }
  } else {
    if (execution.Side === Sides.Buy) {
      return "sell";
    } else {
      return "buy";
    }
  }
};
