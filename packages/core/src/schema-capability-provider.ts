/**
 * SchemaCapabilityProvider translates explicit schema policy into operations.
 */

import type {
  Capabilities,
  CapabilityContribution,
  CapabilityProvider
} from './capability-resolver.js';
import { isEditableContainer } from './object-container.js';

type MutableContribution = {
  -readonly [Capability in keyof Capabilities]?: Capabilities[Capability];
};

export const schemaCapabilityProvider: CapabilityProvider = {
  provide(context): CapabilityContribution | undefined {
    const schema = context.schema;
    if (schema?.readonly) {
      return {
        delete: false,
        editValue: false,
        insert: false,
        move: false,
        paste: false,
        renameKey: false
      };
    }

    const contribution: MutableContribution = {};

    if (schema?.removable === false) contribution.delete = false;
    if (schema?.renameable === false) contribution.renameKey = false;

    if (
      isEditableContainer(context.value) &&
      !Array.isArray(context.value) &&
      schema?.additionalProperties === false
    ) {
      contribution.insert = false;
    }

    if (
      Array.isArray(context.value) &&
      isLimit(schema?.maximumItems) &&
      context.value.length >= schema.maximumItems
    ) {
      contribution.insert = false;
    }

    if (
      Array.isArray(context.parent) &&
      isLimit(context.parentSchema?.minimumItems) &&
      context.parent.length <= context.parentSchema.minimumItems
    ) {
      contribution.delete = false;
    }

    return Object.keys(contribution).length ? contribution : undefined;
  }
};

function isLimit(value: number | undefined): value is number {
  return Number.isInteger(value) && Number(value) >= 0;
}
