# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |

## Reporting a Vulnerability

KDNA files are static JSON. The primary security surface is the validator tooling.

If you discover a security vulnerability in a KDNA tool, please report it by
opening a GitHub issue. Do not include exploit details in public issues for
unreported vulnerabilities.

We will acknowledge your report within 5 business days and provide an estimated
timeline for a fix.

## Scope

- Security of the KDNA CLI tool and loader library
- Schema validation bypasses that could inject harmful content

## Out of Scope

- The contents of KDNA domain files authored by users
- Upstream dependencies
