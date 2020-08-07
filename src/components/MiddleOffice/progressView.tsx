import { ProgressModalContent } from "components/ProgressModalContent";
import moStore, { messages } from "mobx/stores/moStore";
import React, { ReactElement } from "react";

export const ProgressView: React.FC = (): ReactElement | null => {
  const message: string = messages[moStore.status];
  return (
    <ProgressModalContent
      maximum={-1}
      progress={0}
      message={message}
      startTime={Date.now()}
    />
  );
};
