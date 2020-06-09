import React, { ChangeEvent, FormEvent, ReactNode } from "react";
import strings from "locales";
import Grid from "@material-ui/core/Grid";
import {
  FormControl,
  FormLabel,
  Select,
  MenuItem,
  Input,
} from "@material-ui/core";
import { UserPreferences, OCOModes, User } from "interfaces/user";
import timezones, { TimezoneInfo } from "data/timezones";
import deepEqual from "deep-equal";
import { SoundsList } from "components/Workspace/UserProfile/soundsList";
import workareaStore from "mobx/stores/workareaStore";

interface OwnProps {
  profile: UserPreferences;
  original: UserPreferences | null;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
  onChange: (name: string, value: any) => void;
}

declare var GlobalApplicationVersion: string;
if (GlobalApplicationVersion === undefined)
  GlobalApplicationVersion = "Unknown";

const renderTimezone = (value: unknown): ReactNode => {
  if (value === "")
    return <span className={"disabled-item"}>{strings.TimezoneUnset}</span>;
  return value as string;
};

const renderCCYGroup = (value: unknown): ReactNode => {
  if (value === "")
    return <span className={"disabled-item"}>{strings.CCYGroupUnset}</span>;
  return value as string;
};

export const UserProfileForm: React.FC<OwnProps> = (props: OwnProps) => {
  const { profile } = props;
  const user: User = workareaStore.user;
  const onChangeWrapper = ({ target }: ChangeEvent<any>) => {
    const { name } = target;
    const value: any = (() => {
      if (target.type === "checkbox") {
        return target.checked;
      } else {
        return target.value;
      }
    })();
    props.onChange(name, value);
  };

  const hasNotChanged = () => {
    if (props.original === null) return false;
    return deepEqual(profile, props.original);
  };

  const formatTimezone = (text: string): string => {
    return text.replace(/_/g, " ");
  };

  const userType: string = user.isbroker ? "Broker" : "Bank";
  const regions: string[] = user.regions || [];
  if (!regions.includes("LATAM")) regions.push("LATAM");
  return (
    <>
      <div className={"modal-title"}>
        <div className={"user-preferences-modal-title"}>
          <div className={"user"}>
            <div className={"avatar"}>
              <i className={"fa fa-user"} />
            </div>
            <div className={"name"}>
              <div className={"title"}>{user.email}</div>
            </div>
          </div>
          <div className={"fx-options"}>
            <div>{strings.UserProfile}</div>
            <small>FX Options {GlobalApplicationVersion}</small>
          </div>
        </div>
      </div>
      <form
        className={"user-profile-form"}
        name={"user-profile"}
        onSubmit={props.onSubmit}
        autoComplete={"off"}
        noValidate
      >
        <Grid container direction={"column"}>
          <Grid item container spacing={2} direction={"row"}>
            <Grid item xs={4}>
              <FormControl margin={"normal"} fullWidth>
                <FormLabel htmlFor={"user-type"}>User Type</FormLabel>
                <Input value={userType} readOnly={true} />
              </FormControl>
            </Grid>
            <Grid item xs={4}>
              <FormControl margin={"normal"} fullWidth>
                <FormLabel htmlFor={"mpid"}>MPID</FormLabel>
                <Input value={user.firm} readOnly={true} />
              </FormControl>
            </Grid>
            <Grid item xs={4}>
              <FormControl margin={"normal"} fullWidth>
                <FormLabel htmlFor={"oco"}>OCO</FormLabel>
                <Select
                  id={"oco"}
                  onChange={onChangeWrapper}
                  name={"oco"}
                  value={profile.oco}
                >
                  <MenuItem value={OCOModes.Disabled}>Disabled</MenuItem>
                  <MenuItem value={OCOModes.PartialEx}>Partial Ex.</MenuItem>
                  <MenuItem value={OCOModes.FullEx}>Full Ex.</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          <Grid item container spacing={2} direction={"row"}>
            <Grid item xs={4}>
              <FormControl margin={"normal"} fullWidth>
                <FormLabel htmlFor={"font"}>Font</FormLabel>
                <Select
                  id={"font"}
                  onChange={onChangeWrapper}
                  name={"font"}
                  value={profile.font}
                >
                  <MenuItem value={"default"}>Default</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={4}>
              <FormControl margin={"normal"} fullWidth>
                <FormLabel htmlFor={"font-size"}>Font Size</FormLabel>
                <Select
                  id={"font-size"}
                  onChange={onChangeWrapper}
                  name={"fontSize"}
                  value={profile.fontSize}
                >
                  <MenuItem value={"smaller"}>Smaller</MenuItem>
                  <MenuItem value={"small"}>Small</MenuItem>
                  <MenuItem value={"medium"}>Medium</MenuItem>
                  <MenuItem value={"large"}>Large</MenuItem>
                  <MenuItem value={"larger"}>Larger</MenuItem>
                  <MenuItem value={"huge"}>Huge</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={4}>
              <FormControl fullWidth margin={"normal"}>
                <FormLabel htmlFor={"theme"}>Theme</FormLabel>
                <Select
                  id={"theme"}
                  onChange={onChangeWrapper}
                  name={"theme"}
                  value={profile.theme}
                >
                  <MenuItem value={"default"}>Default</MenuItem>
                  <MenuItem value={"dark"}>Dark</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          <Grid item container spacing={2} direction={"row"}>
            <Grid item xs={4}>
              <FormControl fullWidth margin={"normal"}>
                <FormLabel htmlFor={"colorScheme"}>Color Scheme</FormLabel>
                <Select
                  id={"colorScheme"}
                  onChange={onChangeWrapper}
                  name={"colorScheme"}
                  value={profile.colorScheme}
                >
                  <MenuItem value={"default"}>Default</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={4}>
              <FormControl margin={"normal"} fullWidth>
                <FormLabel htmlFor={"exec-sound"}>
                  Dark pool exec sound
                </FormLabel>
                <SoundsList
                  name={"darkPoolExecSound"}
                  value={profile.darkPoolExecSound}
                  onChange={props.onChange}
                />
              </FormControl>
            </Grid>
            <Grid item xs={4}>
              <FormControl margin={"normal"} fullWidth>
                <FormLabel htmlFor={"exec-sound"}>Exec Sound</FormLabel>
                <SoundsList
                  name={"execSound"}
                  value={profile.execSound}
                  onChange={props.onChange}
                />
              </FormControl>
            </Grid>
          </Grid>

          <Grid item>
            <FormControl margin={"normal"} fullWidth>
              <FormLabel htmlFor={"ccy-group"}>CCY Group</FormLabel>
              <Select
                id={"ccy-group"}
                onChange={onChangeWrapper}
                name={"ccyGroup"}
                value={profile.ccyGroup}
                displayEmpty={true}
                renderValue={renderCCYGroup}
              >
                {regions.map((region: string) => (
                  <MenuItem value={region}>{region}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item>
            <FormControl margin={"normal"} fullWidth>
              <FormLabel htmlFor={"time-zone"}>Time Zone</FormLabel>
              <Select
                id={"time-zone"}
                onChange={onChangeWrapper}
                name={"timezone"}
                value={profile.timezone}
                displayEmpty
                renderValue={renderTimezone}
              >
                {timezones.map((zone: TimezoneInfo) => (
                  <MenuItem key={zone.text} value={zone.text}>
                    {formatTimezone(zone.text)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
        <div className={"modal-buttons"}>
          <button className={"cancel"} onClick={props.onCancel} type={"button"}>
            {strings.Cancel}
          </button>
          <button
            className={"success"}
            type={"submit"}
            disabled={hasNotChanged()}
          >
            {strings.Save}
          </button>
        </div>
      </form>
    </>
  );
};
