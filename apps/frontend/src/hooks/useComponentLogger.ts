import { useEffect, useRef } from 'react';
import { logger } from '@/lib/logger';

/**
 * Market Scout - Component Lifecycle Observer
 * Tracks mounts, unmounts, and re-render performance.
 */
export const useComponentLogger = (name: string, props?: any) => {
    const renderCount = useRef(0);
    const startTime = useRef(performance.now());

    useEffect(() => {
        const mountTime = performance.now();
        const duration = mountTime - startTime.current;
        
        logger.debug(`LIFECYCLE | MOUNT | ${name}`, {
            component: name,
            event: 'MOUNT',
            duration,
            metadata: props
        });

        return () => {
            logger.debug(`LIFECYCLE | UNMOUNT | ${name}`, {
                component: name,
                event: 'UNMOUNT'
            });
        };
    }, []);

    useEffect(() => {
        renderCount.current += 1;
        if (renderCount.current > 1) {
            logger.debug(`LIFECYCLE | RE-RENDER | ${name} (#${renderCount.current})`, {
                component: name,
                event: 'RE_RENDER',
                metadata: props
            });
        }
    });
};
