import React from 'react';
import ReactDOM from 'react-dom';
import FXOptionsUI from 'main';

it('renders without crashing', () => {
  const div = document.createElement('div');
  ReactDOM.render(<FXOptionsUI/>, div);
  ReactDOM.unmountComponentAtNode(div);
});
