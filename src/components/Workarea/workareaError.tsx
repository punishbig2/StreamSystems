import React from 'react';

const location = window.location;
export const WorkareaError: React.FC = () => {
  return (
    <div className={'workarea-error'}>
      <h1><i className={'fa fa-exclamation-triangle'}/></h1>
      <h1>Oops, there was an error while loading</h1>
      <p>
        We had trouble communicating with the data server. There might be a problem with your connection.
      </p>
      <p>
        Please try to reload the page
        <button className={'link'} onClick={() => location.reload()}>or click here</button>
      </p>
    </div>
  );
};
