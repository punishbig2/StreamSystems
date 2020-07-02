import React, { ReactElement } from "react";

interface Props {
  title: string;
  message: string | (() => ReactElement);
  icon: "exclamation-triangle" | "question-circle" | "check-circle" | "spinner";
  buttons: () => ReactElement | null;
  color: "good" | "bad" | "neutral";
}

export const MessageBox: React.FC<Props> = (props: Props): ReactElement => {
  const getIcon = (): ReactElement => {
    const classes: string[] = ["icon", props.color];
    if (props.icon === "spinner") {
      return (
        <div className={classes.join(" ")}>
          <i className={"spinner"} />
        </div>
      );
    } else if (props.icon === "exclamation-triangle") {
      return (
        <div className={classes.join(" ")}>
          <i className={`fa fa-exclamation-circle`} />
        </div>
      );
    } else {
      return (
        <div className={classes.join(" ")}>
          <i className={`fa fa-${props.icon}`} />
        </div>
      );
    }
  };
  return (
    <div className={"message-box"}>
      <div className={"box-title"}>
        {getIcon()}
        <div className={"text"}>
          <h1>{props.title}</h1>
        </div>
      </div>
      <div className={"content"}>
        {typeof props.message === "string" ? (
          <p>{props.message}</p>
        ) : (
          props.message()
        )}
      </div>
      <div className={"message-box-footer"}>
        <div className={"modal-buttons"}>{props.buttons()}</div>
      </div>
    </div>
  );
};
