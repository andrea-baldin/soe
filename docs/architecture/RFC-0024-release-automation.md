# RFC-0024 — Release automation

Status: Accepted

## Context

The first SOE release proved the package artifacts but required several manual
registry decisions: scope ownership, two-factor authentication, provenance,
publication order, and tag coordination. Repeating those decisions for every
release would make an otherwise verified process fragile.

Long-lived npm tokens would automate the process at the cost of creating a
secret that can be copied, leaked, or forgotten. npm Trusted Publishing can
instead exchange a GitHub Actions identity for a short-lived publishing
credential.

## Decision

- Publishing starts only when a maintainer publishes a GitHub Release.
- The release tag must point to a commit reachable from `main`.
- The tag, both package versions, the Svelte-to-Core dependency, and the dated
  changelog heading must agree before publication.
- CI runs static checks, tests, and the isolated tarball consumer before
  publishing.
- pnpm creates both tarballs so workspace dependencies become exact published
  versions.
- npm publishes those exact tarballs using Trusted Publishing and automatic
  provenance.
- Core is always published before Svelte.
- No npm write token is stored in GitHub.

Each npm package trusts only `.github/workflows/publish.yml` in the
`andrea-baldin/soe` GitHub repository.

## Consequences

A GitHub Release becomes an intentional deployment action rather than
documentation added after publication. Version errors fail before any registry
write. A failure after Core publication can be retried only after diagnosing
the partial release; published npm versions remain immutable.

The first `0.1.0` release remains a documented manual release. This workflow
governs subsequent versions.
