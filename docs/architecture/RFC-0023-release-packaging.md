# RFC-0023 — Release packaging

Status: Accepted

Supersedes the package names recorded in RFC-0001 and RFC-0002.

## Context

SOE has reached its first release candidate. Workspace imports and successful
monorepo builds do not prove that npm consumers can install and bundle the
published artifacts. The public package identity must also fit Andrea Baldin's
existing family of Core projects without making the Svelte API less clear.

## Decision

- The framework-independent package is published as
  `@andrea-baldin/soe-core`.
- The Svelte package is published as `@andrea-baldin/soe-svelte`.
- Both packages use the same semantic version.
- The Svelte package declares the matching core package as a production
  dependency and Svelte 5 as a peer dependency.
- Every release candidate is packed into the exact npm tarballs and installed
  into an isolated Svelte consumer.
- The isolated consumer must import the core API and build an application using
  `ObjectEditor`.
- Package metadata, README, license, exports, and declarations are part of the
  release contract.

The repository root and demo remain private workspace packages.

## Consequences

The source keeps a small two-package public surface while each package remains
independently discoverable. A passing workspace test is no longer sufficient
for release: the packed consumer test is authoritative for installability.

Changing either public package name or publishing mismatched versions requires
a superseding RFC.
