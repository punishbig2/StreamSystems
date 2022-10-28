import { WorkareaError } from "components/Workarea/workareaError";
import React, { ReactElement } from "react";

export const GenericError: React.FC = (): ReactElement => {
  return (
    <WorkareaError
      title="Oops, there was an error while loading"
      detail={
        "We had trouble communicating with the data server. There might be a problem with your connection."
      }
    />
  );
};
