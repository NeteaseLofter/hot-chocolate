import { timeoutPlugin } from './timeout';
import { windowListenerPlugin } from './window-listener';
import { createElementPlugin } from './create-element';
import { getElementPlugin } from './get-element';
import { documentEventPlugin } from './document-event';
import { replaceCSSStringPlugin } from './replace-css-string';

export const defaultPlugins = [
  timeoutPlugin,
  windowListenerPlugin,
  createElementPlugin,
  getElementPlugin,
  documentEventPlugin,
  replaceCSSStringPlugin
];
