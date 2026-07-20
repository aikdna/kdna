# Scope Mismatch and Boundary Leakage

A compatible Runtime must not silently project a judgment asset outside its
declared scope or drop the boundaries that constrain its use. Two distinct
failures matter:

- **scope mismatch:** the selected asset does not apply to the current task;
- **boundary leakage:** a relevant asset is projected without the exclusions,
  exceptions, or failure risks needed to interpret its judgment.

These are loading and projection defects. They do not imply that KDNA owns all
judgment or that an unloaded model would necessarily produce a better result.

## Required behavior

Before loading judgment content, a consumer should:

1. inspect the asset identity, version, compatibility, and declared scope;
2. obtain a LoadPlan from the compatible Core;
3. satisfy the declared authorization state;
4. select a projection that retains the judgment and its necessary boundaries;
5. fail closed when the Runtime cannot preserve that minimum semantic unit;
6. keep current facts, user instructions, permissions, and safety policy above
   the loaded asset.

When the current contract cannot establish task fit, the Host should abstain
from applying the asset rather than inventing certainty. A Host may implement
its own routing policy, but that policy must not be confused with Core
validation or described as a universal KDNA quality judgment.

## Diagnosis

A useful incident record identifies:

- the exact asset and judgment version;
- the task and Host;
- the LoadPlan and projection profile;
- the scope or boundary that should have controlled the load;
- whether the failure occurred in asset authoring, routing, authorization,
  projection, or Host behavior.

This evidence supports a bounded fix. It is not a reason to create a new
project-wide benchmark system or an intrinsic asset score.
