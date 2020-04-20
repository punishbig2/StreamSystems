import { Workarea } from 'components/Workarea';

import 'styles/main.scss';

import React from 'react';
import whyDidYouRender from '@welldone-software/why-did-you-render';

Object.defineProperty(MouseEvent.prototype, 'ignore', {
  value: function () {
    this.preventDefault();
    this.stopImmediatePropagation();
  },
});

whyDidYouRender(React);

const FXOptionsUI: React.FC = () => {
  const { classList } = document.body;
  const theme: string | null = localStorage.getItem('theme');
  if (theme === null) {
    classList.add('default-theme');
  } else {
    classList.add(`${theme}-theme`);
  }
  return (
    <Workarea/>
  );
};

export default FXOptionsUI;
