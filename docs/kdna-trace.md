# KDNA Trace Boundary

> Status: pre-release and exact-version dependent. Historical `kdna trace`,
> routing, and evaluation implementations must not be read as the default
> user model.

A trace records technical events around one exact asset and Host request. It
does not discover authority, decide which judgment is correct, or prove that a
model followed the asset.

## Required distinctions

A trustworthy trace keeps these facts separate:

1. user selection or previously approved attachment;
2. exact asset identity, version, digest, and scope;
3. validation and authorization decision;
4. projection and Runtime Capsule digest;
5. delivery to a named Host;
6. Host execution result;
7. any separately observed semantic adoption or behavioral assessment.

Earlier trace designs combined installed-asset discovery, automatic matching,
post-validation scores, and “applied” labels. Those fields cannot establish
user consent or behavioral conformity and are not current integration
guidance.

## Privacy and control

Trace storage is a Host decision. A Host must minimize task content and secrets,
define retention, protect decrypted material, and let the user inspect and
clear local records. Trace generation must not hide whether an asset is active.

Current protocol objects and executable validation live in
[`app-runtime-contract.md`](./app-runtime-contract.md), the `specs/` schemas,
and matching conformance fixtures. Check the exact release coordinate before
claiming command availability or compatibility.
