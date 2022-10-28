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
import { hasRole, Role } from "types/role";
import { OCOModes, User, UserPreferences } from "types/user";
import fonts from "fonts.json";
import { themeStore } from "mobx/stores/themeStore";

interface OwnProps {
  profile: UserPreferences;
  original: UserPreferences | null;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
  onChange: (name: string, value: any) => void;
}

const renderTimezone = (value: unknown): ReactNode => {
  if (value === "")
    return <span className="disabled-item">{strings.TimezoneUnset}</span>;
  return value as string;
};

export const UserProfileForm: React.FC<OwnProps> = (props: OwnProps) => {
  const { profile } = props;

  const user: User = workareaStore.user;
  const isBroker: boolean = useMemo((): boolean => {
    const { roles } = user;
    return hasRole(roles, Role.Broker);
  }, [user]);

  React.useEffect((): void => {
    themeStore.setFontFamily(profile.fontFamily);
    themeStore.setFontSize(profile.fontSize);
    themeStore.setTheme(profile.theme);
  }, [profile.fontFamily, profile.fontSize, profile.theme]);

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

  const onCancelWrapper = (): void => {
    workareaStore.loadTheme();
    props.onCancel();
  };

  const userType: string = isBroker ? "Broker" : "Bank";
  const regions: ReadonlyArray<string> = user.regions;

  return (
    <>
      <div className="modal-title">
        <div className="user-preferences-modal-title">
          <div className="user">
            <div className="avatar">
              <i className="fa fa-user" />
            </div>
            <div className="name">
              <Typography
                color="textPrimary"
                variant="subtitle1"
                className="title"
              >
                {user.email}
              </Typography>
            </div>
          </div>
          <div className="fx-options">
            <Typography variant="subtitle1">{strings.UserProfile}</Typography>
            <Typography variant="subtitle2">
              FX Options {window.GlobalApplicationVersion ?? "unknown"}
            </Typography>
          </div>
        </div>
      </div>
      <form
        className="user-profile-form"
        name="user-profile"
        onSubmit={props.onSubmit}
        autoComplete="off"
        noValidate
      >
        <Grid container direction="column">
          <fieldset>
            <legend>User Information</legend>
            <Grid item container spacing={2} direction="row">
              <Grid item xs={4}>
                <FormControl margin="dense" fullWidth>
                  <FormLabel>User Type</FormLabel>
                  <Input value={userType} readOnly={true} />
                </FormControl>
              </Grid>
              <Grid item xs={4}>
                <FormControl margin="dense" fullWidth>
                  <FormLabel>MPID</FormLabel>
                  <Input value={user.firm} readOnly={true} />
                </FormControl>
              </Grid>
              <Grid item xs={4}>
                <FormControl margin="dense" fullWidth>
                  <FormLabel htmlFor="oco">OCM</FormLabel>
                  <Select
                    id="oco"
                    disabled={!workareaStore.connected}
                    name="oco"
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
          </fieldset>

          <fieldset>
            <legend>Display Settings</legend>
            <Grid item container spacing={2} direction="row">
              <Grid item xs={4}>
                <FormControl margin="dense" fullWidth>
                  <FormLabel htmlFor="fontFamily">Font</FormLabel>
                  <Select
                    id="fontFamily"
                    disabled={!workareaStore.connected}
                    name="fontFamily"
                    value={profile.fontFamily}
                    onChange={onChangeWrapper}
                  >
                    <MenuItem value="default">Default</MenuItem>
                    {fonts.map(
                      (font: string): React.ReactElement => (
                        <MenuItem key={font} value={font}>
                          {font}
                        </MenuItem>
                      )
                    )}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={4}>
                <FormControl margin="dense" fullWidth>
                  <FormLabel htmlFor="font-size">Font Size</FormLabel>
                  <Select
                    id="font-size"
                    disabled={!workareaStore.connected}
                    name="fontSize"
                    value={profile.fontSize}
                    onChange={onChangeWrapper}
                  >
                    <MenuItem value="smaller">Smaller</MenuItem>
                    <MenuItem value="small">Small</MenuItem>
                    <MenuItem value="normal">Normal</MenuItem>
                    <MenuItem value="medium">Medium</MenuItem>
                    <MenuItem value="large">Large</MenuItem>
                    <MenuItem value="larger">Larger</MenuItem>
                    <MenuItem value="huge">Huge</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={4}>
                <FormControl fullWidth margin="dense">
                  <FormLabel htmlFor="theme">Theme</FormLabel>
                  <Select
                    id="theme"
                    disabled={!workareaStore.connected}
                    name="theme"
                    value={profile.theme}
                    onChange={onChangeWrapper}
                  >
                    <MenuItem value="light">Light</MenuItem>
                    <MenuItem value="dark">Dark</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </fieldset>

          <fieldset>
            <legend>Alerts & Sound Settings</legend>
            <Grid item container spacing={2} direction="row">
              <Grid item xs={6}>
                <FormControl margin="dense" fullWidth>
                  <FormLabel htmlFor="exec-sound">Dark Sound</FormLabel>
                  <SoundsList
                    name="darkPoolExecSound"
                    value={profile.darkPoolExecSound}
                    onChange={props.onChange}
                  />
                </FormControl>
              </Grid>
              <Grid item xs={6}>
                <FormControl margin="dense" fullWidth>
                  <FormLabel htmlFor="exec-sound">Exec Sound</FormLabel>
                  <SoundsList
                    name="execSound"
                    value={profile.execSound}
                    onChange={props.onChange}
                  />
                </FormControl>
              </Grid>
              <Grid item xs={4} />
            </Grid>
          </fieldset>

          <fieldset>
            <legend>Currency Groups & Timezone</legend>
            <Grid spacing={2} item container>
              <Grid item xs={6}>
                <FormControl margin="dense" fullWidth>
                  <FormLabel htmlFor="ccy-group">CCY Group</FormLabel>
                  <Input value={regions.join(",")} readOnly={true} />
                </FormControl>
              </Grid>
              <Grid item xs={6}>
                <FormControl margin="dense" fullWidth>
                  <FormLabel htmlFor="time-zone">Time Zone</FormLabel>
                  <Select
                    id="time-zone"
                    disabled={!workareaStore.connected}
                    name="timezone"
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
          </fieldset>
        </Grid>

        <div className="modal-buttons">
          <button className="cancel" onClick={onCancelWrapper} type="button">
            {strings.Cancel}
          </button>
          <button className="success" type="submit" disabled={hasNotChanged()}>
            {strings.Save}
          </button>
        </div>
      </form>
    </>
  );
};
