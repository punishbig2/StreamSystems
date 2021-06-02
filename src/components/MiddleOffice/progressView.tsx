import { ProgressModalContent } from "components/ProgressModalContent";
import {
  messages,
  MiddleOfficeStore,
  MiddleOfficeStoreContext,
} from "mobx/stores/middleOfficeStore";
import React, { ReactElement } from "react";

export const ProgressView: React.FC = (): ReactElement | null => {
  const store = React.useContext<MiddleOfficeStore>(MiddleOfficeStoreContext);
  const message: string = messages[store.status];
  return (
    <ProgressModalContent
      maximum={-1}
      progress={0}
      message={message}
      startTime={Date.now()}
    />
  );
};
