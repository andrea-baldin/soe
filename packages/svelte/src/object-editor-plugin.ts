/**
 * ObjectEditorPlugin is the public Svelte registration boundary for extensions.
 */

import type { ObjectPlugin } from '@soe/core';

export type ObjectEditorPlugin = ObjectPlugin<Record<string, never>>;
