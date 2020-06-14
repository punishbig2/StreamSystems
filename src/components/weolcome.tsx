import React, { ReactElement } from "react";

export const Welcome: React.FC = (): ReactElement => {
  return (
    <div className={"welcome"}>
      <h3>Welcome!</h3>
      <h5>We are loading your workspaces in a moment</h5>
    </div>
  );
};
