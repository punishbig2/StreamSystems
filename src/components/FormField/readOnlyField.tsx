import { OutlinedInput } from "@material-ui/core";
import { NotApplicableField } from "components/FormField/notApplicableField";
import React, { useCallback } from "react";
import { copyToClipboard } from "utils/copyToClipboard";

interface Props {
  readonly name: string;
  readonly value: string;
  readonly endAdornment?: string;
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
      id={props.name}
      labelWidth={0}
      classes={{
        notchedOutline: "borderless",
      }}
      tabIndex={-1}
      readOnly={true}
      title={"Click to copy!"}
      value={value}
      onClick={onCopy}
    />
  );
};
