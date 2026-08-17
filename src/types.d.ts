import type { Chain, ChainController } from './src/index.js';

/**
 * Task function that receives the previous result and a chain controller.
 */
export type Task<U = any, T extends Record<string, any> = Record<string, any>> = (
    previousResult: any,
    chainController: ChainController<U, T>
) => any;

/**
 * Details object passed to event listeners.
 */
export interface Details<U = any, T extends Record<string, any> = Record<string, any>> {
    chain: Chain<U, T>;
    lastTaskIndex: number;
    error: Error | null;
}
