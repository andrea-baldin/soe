/**
 * ObjectEditorPlugin is the public Svelte registration boundary for extensions.
 */

import type {
  ObjectPlugin,
  ResolvedNodeContext
} from '@andrea-baldin/soe-core';
import type { Component } from 'svelte';

export interface ObjectEditorValueEditorProps {
  readonly context: ResolvedNodeContext;
  readonly commit: (value: unknown) => void;
}

export type ObjectEditorValueEditor = Component<ObjectEditorValueEditorProps>;

export interface ObjectEditorNodeProperties {
  readonly description?: string;
  readonly editor?: ObjectEditorValueEditor;
  readonly label?: string;
}

export type ObjectEditorPlugin = ObjectPlugin<ObjectEditorNodeProperties>;
