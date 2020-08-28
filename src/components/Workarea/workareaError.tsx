import { Typography } from "@material-ui/core";
import React from "react";

const location = window.location;

interface Props {
  title: string;
  detail: string;
}

export const WorkareaError: React.FC<Props> = (
  props: Props
): React.ReactElement => {
  return (
    <div className={"workarea-error"}>
      <h1>
        <i className={"fa fa-exclamation-triangle"} />
      </h1>
      <Typography color={"textPrimary"} variant={"h4"}>
        {props.title}
      </Typography>
      <Typography variant={"body1"} color={"textPrimary"} component={"p"}>
        {props.detail}
      </Typography>
      <Typography variant={"body1"} color={"textPrimary"} component={"p"}>
        Please try to reload the page
        <button className={"link"} onClick={() => location.reload()}>
          or click here
        </button>
      </Typography>
    </div>
  );
};
