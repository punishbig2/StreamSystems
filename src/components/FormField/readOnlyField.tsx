import { OutlinedInput } from "@material-ui/core";
import { NotApplicableField } from "components/FormField/notApplicableField";
import React, { useCallback } from "react";
import { coalesce } from "utils";
import { copyToClipboard } from "utils/copyToClipboard";

interface Props {
  readonly name: string;
  readonly value: string;
  readonly endAdornment?: string;
  readonly disabled?: boolean;
}

export const ReadOnlyField: React.FC<Props> = (
  props: Props
): React.ReactElement => {
  const { value } = props;
  const onCopy = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => copyToClipboard(event, value),
    [value]
  );
  if (value === "N/A") return <NotApplicableField />;
  return (
    <OutlinedInput
      labelWidth={0}
      classes={{
        notchedOutline: "borderless",
      }}
      inputProps={{
        tabIndex: -1,
      }}
      readOnly={true}
      disabled={props.disabled}
      title={"Click to copy!"}
      value={coalesce(value, "")}
      onClick={onCopy}
    />
  );
};
