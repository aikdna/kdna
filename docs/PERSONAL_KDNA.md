# Personal KDNA

Personal KDNA encodes an individual's explicit judgment system, preferences,
boundaries, taste, and recurring reasoning patterns for AI-assisted use.

It is not a universal domain standard. It is a portable file that lets a person
make their judgment loadable across models, tools, and workflows.

## Proposed Asset Types

The `asset_type` field is optional in v1.0 and proposed for v1.1:

- `domain_judgment`
- `personal_judgment`
- `organization_standard`
- `team_policy`
- `creator_style`
- `risk_guard`

## Proposed Privacy Levels

The `privacy_level` field is optional in v1.0 and proposed for v1.1:

- `public`
- `private`
- `sensitive`
- `regulated`

Public assets MAY enter public registries. Private assets should stay local or
in private registries. Sensitive and regulated assets require stronger policy,
authorization, and possibly encryption.

## Required Boundary

Personal KDNA represents one person's judgment. Validity means the file is
structured, signed, and loadable. It does not mean the person's judgment is
objectively true or appropriate for all users.
