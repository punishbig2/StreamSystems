import { Typography } from "@material-ui/core";
import React from "react";
import config from "../../config";

interface Props {
  title: string;
  detail: string;
}

export const WorkareaError: React.FC<Props> = (
  props: Props
): React.ReactElement => {
  const [remainingTime, setRemainingTime] = React.useState<number>(30000);
  React.useEffect((): void => {
    if (remainingTime <= 0) {
      window.location.href = config.SignOutUrl;
    }
  }, [remainingTime]);
  React.useEffect((): (() => void) => {
    const timer = setTimeout(
      (): void =>
        setRemainingTime((previous: number): number => previous - 1000),
      1000
    );
    return (): void => {
      clearTimeout(timer);
    };
  });
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
        <a className={"link"} href={config.SignOutUrl}>
          or click here
        </a>{" "}
        to go to the sign in page
      </Typography>
      <Typography color={"textPrimary"}>
        You will be redirected to the sign in page in {remainingTime / 1000}{" "}
        seconds
      </Typography>
    </div>
  );
};
