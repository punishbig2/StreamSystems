import { Typography } from "@material-ui/core";
import React from "react";

interface Props {
  readonly onClose: () => void;
}

export const AccessDeniedView: React.FC<Props> = (
  props: Props
): React.ReactElement => {
  return (
    <div className="workarea-error">
      <h1>
        <i className="fa fa-user-lock" />
      </h1>
      <Typography color="textPrimary" variant="h4">
        Access Denied
      </Typography>
      <Typography variant="body1" color="textPrimary" component="p">
        According to our user authorization and privileges data base you do not
        have access to this view. If you think this is an error please contact
        your administrator
      </Typography>
      <button onClick={props.onClose}>Please click here to go back</button>
    </div>
  );
};
