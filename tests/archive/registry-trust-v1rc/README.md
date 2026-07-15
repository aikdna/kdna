# Archived 1.0-rc Registry Trust Harness

This directory records why the former `tests/registry-trust/run.mjs` harness
was removed from the executable KDNA Core test surface.

The harness targeted the superseded 1.0-rc registry and install workflow. It
generated the removed multi-file payload shape, invoked a machine-global
`kdna` executable instead of code owned by this repository, and accepted broad
non-zero exits for several scenarios. After the CLI changed, those assertions
could pass or fail for unrelated command and format errors while still being
reported as registry trust evidence.

KDNA Core does not own registry distribution or install-time registry trust.
Current Core integrity and authorization behavior is covered by the active
Core tests and conformance fixtures. A registry operator or CLI implementation
must maintain its own current-format end-to-end trust suite in the repository
that owns those commands.

The removed harness remains available in Git history before this archive note;
it must not be cited as current release evidence.
