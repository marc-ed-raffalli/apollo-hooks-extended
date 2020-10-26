import {DependencyList, useEffect} from 'react';

/**
 * Helper function monitoring the component unmount.
 * The status object is passed by reference and the active property is set to false when the component is unmounted.
 * Useful to prevent state update after component unmount.
 */
export function useActiveEffect(
  cb: (p: {active: boolean}) => Promise<any>,
  deps?: DependencyList
): void {
  useEffect(() => {
    const status = {active: true};

    cb(status);

    return () => {
      status.active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
