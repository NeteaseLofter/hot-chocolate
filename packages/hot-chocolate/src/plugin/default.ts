import { timeoutPlugin } from './timeout';
import { windowListenerPlugin } from './window-listener';
import { createElementPlugin } from './create-element';
import { getElementPlugin } from './get-element';
import { documentEventPlugin } from './document-event';

export const defaultPlugins = [
  timeoutPlugin,
  windowListenerPlugin,
  createElementPlugin,
  getElementPlugin,
  documentEventPlugin
];
