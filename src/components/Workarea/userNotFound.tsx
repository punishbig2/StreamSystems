import { WorkareaError } from "components/Workarea/workareaError";
import React, { ReactElement } from "react";

export const UserNotFound: React.FC = (): ReactElement => {
  return (
    <WorkareaError
      title={"Oops, something bad happened during initialization"}
      detail={
        "We cannot find this user in our database, please contact your administrator."
      }
    />
  );
};
