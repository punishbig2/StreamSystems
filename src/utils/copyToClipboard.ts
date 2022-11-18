import React from 'react';

export const copyToClipboard = (event: React.MouseEvent<HTMLDivElement>, value: string): void => {
  const input: HTMLInputElement = document.createElement('input');
  const { body } = document;
  const { style } = input;
  // Make it invisible
  style.position = 'absolute';
  style.top = '-1';
  style.left = '-1';
  style.height = '1';
  style.width = '1';
  // Flash it ...
  const target: HTMLDivElement = event.target as HTMLDivElement;
  const html: string = target.innerHTML;
  target.innerHTML = 'Copied...';
  setTimeout(() => {
    target.innerHTML = html;
  }, 600);
  // Attach it
  body.appendChild(input);
  input.value = value;
  input.select();
  document.execCommand('copy');
  body.removeChild(input);
};
