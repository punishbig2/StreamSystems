import { Grid, MenuItem, Select } from "@material-ui/core";
import { SelectItem } from "forms/fieldDef";
import moment from "moment";
import React, { ReactElement, ReactNode, useState } from "react";
import { tenorToDuration } from "utils/dataGenerators";

interface Props {
  data: SelectItem[];
  value: string;
  className: string;
  readOnly: boolean;
  onChange: (
    event: React.ChangeEvent<{ name?: string; value: unknown }>,
    child: ReactNode
  ) => void;
}

export const TenorDropdown: React.FC<Props> = (props: Props): ReactElement => {
  const { data } = props;
  const [formatter] = useState<Intl.DateTimeFormat>(
    new Intl.DateTimeFormat(undefined, {
      day: "numeric",
      month: "numeric",
      year: "numeric",
    })
  );
  const date: Date = moment().add(tenorToDuration(props.value)).toDate();
  return (
    <Grid className={"MuiInputBase-root"} container>
      <Grid xs={3} item>
        <Select
          value={props.value}
          className={props.className}
          displayEmpty={true}
          readOnly={props.readOnly}
          fullWidth={true}
          onChange={props.onChange}
        >
          {data.map((item: SelectItem) => (
            <MenuItem key={item.value} value={item.value}>
              {item.value}
            </MenuItem>
          ))}
        </Select>
      </Grid>
      <Grid xs={9} item>
        <div className={"expiry-date"}>{formatter.format(date)}</div>
      </Grid>
    </Grid>
  );
};
