import React, { ReactElement } from "react";

const location = window.location;
export const UserNotFound: React.FC = (): ReactElement => {
  return (
    <div className={"workarea-error"}>
      <h1>
        <i className={"fa fa-exclamation-triangle"} />
      </h1>
      <h1>Oops, there was an error while loading</h1>
      <p>
        The user that is currently authenticated does not exist in our database.
      </p>
      <p>
        Please try to reload the page
        <button className={"link"} onClick={() => location.reload()}>
          or click here
        </button>
      </p>
    </div>
  );
};
