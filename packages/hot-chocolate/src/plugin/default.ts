import { timeoutPlugin } from './timeout';
import { dynamicImportPlugin } from './dynamic-import';
import { windowListenerPlugin } from './window-listener';
import { createElementPlugin } from './create-element';
import { getElementPlugin } from './get-element';
import { documentEventPlugin } from './document-event';
import { replaceCSSStringPlugin } from './replace-css-string';

export const defaultPlugins = [
  timeoutPlugin,
  dynamicImportPlugin,
  windowListenerPlugin,
  createElementPlugin,
  getElementPlugin,
  documentEventPlugin,
  replaceCSSStringPlugin
];
