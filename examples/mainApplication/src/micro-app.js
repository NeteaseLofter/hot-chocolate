import React, {
  useEffect,
  useRef
} from 'react';
import { useParams } from 'react-router-dom';

import {
  manager
} from './manager';

export const MicroApplication = () => {
  const containerRef = useRef();
  const params = useParams();
  const { appName } = params;

  useEffect(() => {
    manager.deactivateAll();
    if (appName === 'all') {
      manager.activateAndMount(
        'app1',
        containerRef.current
      );
      manager.activateAndMount(
        'app2',
        containerRef.current
      );
      manager.activateAndMount(
        'app3',
        containerRef.current
      );
    } else {
      manager.activateAndMount(
        appName,
        containerRef.current
      );
    }
  }, [appName])

  return (
    <div
      className="micro-app-box"
      ref={containerRef}
    />
  );
}
