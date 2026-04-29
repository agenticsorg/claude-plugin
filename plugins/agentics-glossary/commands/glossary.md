---
name: glossary
description: Look up an Agentics, MCP, or agentic AI term
---

Look up a glossary term.

Usage:
- `/glossary` — list all defined terms
- `/glossary <term>` — define a specific term

Load the `agentics-glossary` skill and find the matching term. Output: definition, example, one related term. Keep it tight — three sentences total unless the user asks for more.

If the term isn't in the glossary, search the `agentics-org` MCP server for the term, then say "not in the glossary, but agentics.org mentions it here:" with citation.

ARGUMENTS: $ARGUMENTS
