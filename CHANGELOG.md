# Changelog

All notable changes to SOE are documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and the project follows [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added

- Trusted npm publishing through GitHub Actions and OpenID Connect.
- Release contract validation for package names, versions, tags, dependencies,
  and changelog entries.

## [0.1.0] - 2026-07-28

### Added

- Recursive editing of plain objects and arrays with immutable structural
  operations.
- Undo and redo history for value and structural changes.
- Recursive schemas, required fields, synchronous validation, and navigable
  whole-object validation reports.
- Capability, property, context, and plugin composition.
- Safe copy and paste, special-value inspection, custom value editors, and
  search navigation.
- Schema-driven editing policies.
- Framework-independent `@andreabaldin/soe-core` package.
- Svelte 5 `@andreabaldin/soe-svelte` package with a standard-CSS interface.
- Tailwind CSS integration demo without a runtime Tailwind dependency.

[Unreleased]: https://github.com/andrea-baldin/soe/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/andrea-baldin/soe/releases/tag/v0.1.0
