# Enterprise KDNA Pilot

A framework for organizations to encode internal expert judgment into private KDNA packages.

## Why Enterprise KDNA

Your company has SOPs. But SOPs encode procedures — what to do, in what order.

KDNA encodes expert judgment — how to decide what kind of situation this is before acting.

| SOPs answer | KDNA answers |
|---|---|
| How to process a customer complaint | Is this a service failure, a product defect, or an expectation gap? |
| How to review a candidate | Is the gap in skill, fit, or our interview process? |
| How to run a project retrospective | Was the delay a planning failure, a dependency failure, or a scope creep failure? |

## Pilot Structure

### Phase 1: Discovery (Week 1-2)
- Identify 2-3 high-frequency judgment scenarios where expert judgment differs from novice judgment
- Collect 5-10 real examples of each scenario
- Document the expert's diagnostic process: what signals they notice, what questions they ask first

### Phase 2: Encoding (Week 3-4)
- For each scenario, create a minimal KDNA package (Core + Patterns)
- Write axioms: the 2-3 principles that guide expert judgment in this scenario
- Write misunderstandings: what novices typically get wrong
- Write self-checks: the yes/no questions the expert asks themselves before deciding
- Validate with `kdna validate`

### Phase 3: Testing (Week 5-6)
- Create 5-10 before/after test cases per package
- Compare agent output without KDNA vs with KDNA
- Score using `kdna eval`
- Iterate based on expert review of agent outputs

### Phase 4: Integration (Week 7-8)
- Deploy packages to team agent runtime
- Train team on how to invoke KDNA-loaded judgment
- Establish update cadence (monthly review of new cases)
- Optionally organize packages into a cluster for complex scenarios

## Private Infrastructure

Enterprise KDNA packages are private assets. They can be:
- Stored in private GitHub repositories
- Loaded from local directories on team machines
- Served through KDNA Runtime with license verification
- Organized into internal clusters for cross-functional judgment

## Contact

For enterprise pilot inquiries: team@aikdna.com
