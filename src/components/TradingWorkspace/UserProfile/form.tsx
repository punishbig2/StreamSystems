import {
  FormControl,
  FormLabel,
  Input,
  MenuItem,
  Select,
  Typography,
} from "@material-ui/core";
import Grid from "@material-ui/core/Grid";
import { SoundsList } from "components/TradingWorkspace/UserProfile/soundsList";
import timezones, { TimezoneInfo } from "data/timezones";
import deepEqual from "deep-equal";
import strings from "locales";
import workareaStore from "mobx/stores/workareaStore";
import React, { ChangeEvent, FormEvent, ReactNode, useMemo } from "react";
import { Role } from "types/role";
import { OCOModes, User, UserPreferences } from "types/user";

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
  const isBroker: boolean = useMemo((): boolean => {
    const { roles } = user;
    return roles.includes(Role.Broker);
  }, [user]);
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

  const userType: string = isBroker ? "Broker" : "Bank";
  const regions: ReadonlyArray<string> = user.regions;
  return (
    <>
      <div className={"modal-title"}>
        <div className={"user-preferences-modal-title"}>
          <div className={"user"}>
            <div className={"avatar"}>
              <i className={"fa fa-user"} />
            </div>
            <div className={"name"}>
              <Typography
                color={"textPrimary"}
                variant={"subtitle1"}
                className={"title"}
              >
                {user.email}
              </Typography>
            </div>
          </div>
          <div className={"fx-options"}>
            <Typography variant={"subtitle1"}>{strings.UserProfile}</Typography>
            <Typography variant={"subtitle2"}>
              FX Options {GlobalApplicationVersion}
            </Typography>
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
              <FormControl margin={"dense"} fullWidth>
                <FormLabel>User Type</FormLabel>
                <Input value={userType} readOnly={true} />
              </FormControl>
            </Grid>
            <Grid item xs={4}>
              <FormControl margin={"dense"} fullWidth>
                <FormLabel>MPID</FormLabel>
                <Input value={user.firm} readOnly={true} />
              </FormControl>
            </Grid>
            <Grid item xs={4}>
              <FormControl margin={"dense"} fullWidth>
                <FormLabel htmlFor={"oco"}>OCM</FormLabel>
                <Select
                  id={"oco"}
                  disabled={!workareaStore.connected}
                  name={"oco"}
                  value={profile.oco}
                  onChange={onChangeWrapper}
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
              <FormControl margin={"dense"} fullWidth>
                <FormLabel htmlFor={"font"}>Font</FormLabel>
                <Select
                  id={"font"}
                  disabled={!workareaStore.connected}
                  name={"font"}
                  value={profile.font}
                  onChange={onChangeWrapper}
                >
                  <MenuItem value={"default"}>Default</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={4}>
              <FormControl margin={"dense"} fullWidth>
                <FormLabel htmlFor={"font-size"}>Font Size</FormLabel>
                <Select
                  id={"font-size"}
                  disabled={!workareaStore.connected}
                  name={"fontSize"}
                  value={profile.fontSize}
                  onChange={onChangeWrapper}
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
              <FormControl fullWidth margin={"dense"}>
                <FormLabel htmlFor={"theme"}>Theme</FormLabel>
                <Select
                  id={"theme"}
                  disabled={!workareaStore.connected}
                  name={"theme"}
                  value={profile.theme}
                  onChange={onChangeWrapper}
                >
                  <MenuItem value={"light"}>Light</MenuItem>
                  <MenuItem value={"dark"}>Dark</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          <Grid item container spacing={2} direction={"row"}>
            <Grid item xs={4}>
              <FormControl margin={"dense"} fullWidth>
                <FormLabel htmlFor={"exec-sound"}>Dark Sound</FormLabel>
                <SoundsList
                  name={"darkPoolExecSound"}
                  value={profile.darkPoolExecSound}
                  onChange={props.onChange}
                />
              </FormControl>
            </Grid>
            <Grid item xs={4}>
              <FormControl margin={"dense"} fullWidth>
                <FormLabel htmlFor={"exec-sound"}>Exec Sound</FormLabel>
                <SoundsList
                  name={"execSound"}
                  value={profile.execSound}
                  onChange={props.onChange}
                />
              </FormControl>
            </Grid>
            <Grid item xs={4} />
          </Grid>

          <Grid item>
            <FormControl margin={"dense"} fullWidth>
              <FormLabel htmlFor={"ccy-group"}>CCY Group</FormLabel>
              <Select
                id={"ccy-group"}
                disabled={!workareaStore.connected}
                name={"ccyGroup"}
                value={profile.ccyGroup}
                displayEmpty={true}
                renderValue={renderCCYGroup}
                onChange={onChangeWrapper}
              >
                {regions.map((region: string) => (
                  <MenuItem key={region} value={region}>
                    {region}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item>
            <FormControl margin={"dense"} fullWidth>
              <FormLabel htmlFor={"time-zone"}>Time Zone</FormLabel>
              <Select
                id={"time-zone"}
                disabled={!workareaStore.connected}
                name={"timezone"}
                value={profile.timezone}
                displayEmpty
                renderValue={renderTimezone}
                onChange={onChangeWrapper}
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
