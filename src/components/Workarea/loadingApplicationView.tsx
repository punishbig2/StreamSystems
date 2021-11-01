import { ProgressView } from "components/progressView";
import workarea from "mobx/stores/workareaStore";
import React from "react";

export const LoadingApplicationView: React.FC = (): React.ReactElement => {
  return (
    <ProgressView
      value={workarea.loadingProgress}
      message={workarea.loadingMessage ?? ""}
      title={"Loading: Application"}
    />
  );
};
