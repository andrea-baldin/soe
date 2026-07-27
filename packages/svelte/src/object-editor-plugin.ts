/**
 * ObjectEditorPlugin is the public Svelte registration boundary for extensions.
 */

import type { ObjectPlugin } from '@soe/core';

export interface ObjectEditorNodeProperties {
  readonly description?: string;
  readonly label?: string;
}

export type ObjectEditorPlugin = ObjectPlugin<ObjectEditorNodeProperties>;
