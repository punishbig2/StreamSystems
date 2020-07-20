import { MessageBox } from "components/MessageBox";
import strings from "locales";
import moStore, { MOError } from "mobx/stores/moStore";
import React, { ReactElement } from "react";

interface Props {
  error: MOError | null;
}

export const Error: React.FC<Props> = ({
  error,
}: Props): ReactElement | null => {
  if (error === null) return null;
  return (
    <MessageBox
      title={strings.ErrorModalTitle}
      message={() => {
        return (
          <div className={"pricer-error"}>
            <p className={"message"}>{error.message}</p>
            <p className={"tag"}>
              error code: {error.status} ({error.error})
            </p>
          </div>
        );
      }}
      icon={"exclamation-triangle"}
      buttons={() => {
        return (
          <>
            <button className={"cancel"} onClick={() => moStore.setError(null)}>
              {strings.Close}
            </button>
          </>
        );
      }}
      color={"bad"}
    />
  );
};
