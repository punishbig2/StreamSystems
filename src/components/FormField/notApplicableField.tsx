import React from "react";
import { OutlinedInput } from "@material-ui/core";

export const NotApplicableField: React.FC = (): React.ReactElement => {
  return (
    <OutlinedInput
      labelWidth={0}
      classes={{
        root: "not-applicable",
        notchedOutline: "borderless",
      }}
      readOnly={true}
      tabIndex={-1}
      value={"N/A"}
    />
  );
};
