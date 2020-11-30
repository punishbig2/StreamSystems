import { OutlinedInput } from "@material-ui/core";
import { Adornment } from "components/FormField/adornment";
import { NotApplicableField } from "components/FormField/notApplicableField";
import React, { useCallback } from "react";
import { coalesce } from "utils/commonUtils";
import { copyToClipboard } from "utils/copyToClipboard";

interface Props {
  readonly name: string;
  readonly value: string;
  readonly disabled?: boolean;
  readonly startAdornment?: string;
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
      labelWidth={0}
      startAdornment={
        <Adornment position={"start"} value={props.startAdornment} />
      }
      endAdornment={<Adornment position={"end"} value={props.endAdornment} />}
      inputProps={{
        tabIndex: -1,
      }}
      classes={{
        notchedOutline: "borderless",
      }}
      readOnly={true}
      disabled={props.disabled}
      title={"Click to copy!"}
      value={coalesce(value, "")}
      onClick={onCopy}
    />
  );
};
