import { Typography } from "@material-ui/core";
import React from "react";
import config from "config";

interface Props {
  readonly shouldReload?: boolean;
  readonly title: string;
  readonly detail: string;
}

export const WorkareaError: React.FC<Props> = (
  props: Props
): React.ReactElement => {
  const [remainingTime = 30000, setRemainingTime] = React.useState<number>(
    config.RedirectTimeout
  );
  const { shouldReload = true } = props;
  React.useEffect((): void => {
    const { location } = window;
    if (config.RedirectTimeout < 0) return;
    if (remainingTime <= 0) {
      location.href = config.SignOutUrl;
    }
  }, [remainingTime]);
  React.useEffect((): (() => void) | void => {
    if (remainingTime < 0 || shouldReload) return;
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
      {shouldReload ? (
        <>
          <Typography variant={"body1"} color={"textPrimary"} component={"p"}>
            Please try to reload the page
            <a className={"link"} href={config.SignOutUrl}>
              or click here
            </a>{" "}
            to go to the sign in page
          </Typography>
          {remainingTime <= 0 ? null : (
            <Typography color={"textPrimary"}>
              You will be redirected to the sign in page in{" "}
              {remainingTime / 1000} seconds
            </Typography>
          )}
        </>
      ) : null}
    </div>
  );
};
