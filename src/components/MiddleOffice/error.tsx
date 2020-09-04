import { Typography } from "@material-ui/core";
import { MessageBox } from "components/MessageBox";
import strings from "locales";
import moStore from "mobx/stores/moStore";
import React, { ReactElement, ReactNode } from "react";
import { MiddleOfficeError } from "types/middleOfficeError";
import { SEFErrorEntry } from "utils/parseSEFError";

interface Props {
  readonly error: MiddleOfficeError | null;
}

const convertToElement = (entries: ReadonlyArray<SEFErrorEntry>): ReactNode => {
  return entries.map(
    (entry: SEFErrorEntry): ReactElement => {
      return (
        <div style={{ marginBottom: 8 }}>
          <Typography variant={"subtitle2"}>{entry.key}</Typography>
          <Typography variant={"subtitle1"}>{entry.value}</Typography>
        </div>
      );
    }
  );
};

export const Error: React.FC<Props> = ({
  error,
}: Props): ReactElement | null => {
  if (error === null) return null;
  const content: ReactNode =
    typeof error.content === "undefined"
      ? error.message
      : typeof error.content === "string"
      ? error.content
      : convertToElement(error.content);
  return (
    <MessageBox
      title={strings.ErrorModalTitle}
      message={() => {
        return (
          <div className={"pricer-error"}>
            <p className={"message"}>{content}</p>
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
