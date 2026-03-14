'use client';

/**
 * @fileOverview Central Firebase Barrel File
 * This file serves as the single source of truth for all Firebase services and hooks.
 * It remains a pure TypeScript file (no JSX) to prevent build errors.
 */

import { useMemo } from 'react';

export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './errors';
export * from './error-emitter';
export * from './non-blocking-updates';
export * from './non-blocking-login';

/**
 * A hook to memoize Firebase references or queries.
 * Ensures that hooks like useCollection and useDoc don't trigger infinite loops.
 */
export function useMemoFirebase<T>(factory: () => T, deps: any[]): T {
  return useMemo(() => {
    const val: any = factory();
    if (val) (val as any).__memo = true;
    return val;
  }, deps);
}
