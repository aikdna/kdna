# KDNA vs RAG

RAG and KDNA solve different problems.

RAG retrieves relevant information from a large corpus. It answers: what information should the model see right now?

KDNA encodes stable domain judgment. It answers: how should the model interpret and judge what it sees?

## Use Together

RAG can retrieve documents. KDNA can guide how those documents are interpreted.

Example:

```text
RAG retrieves a customer complaint history.
KDNA helps the agent avoid treating the complaint as merely a script-writing task and instead checks intent, emotional state, risk, and next-step clarity.
```
