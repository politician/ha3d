# Install HA3D skill in GitHub Copilot

Set up a reusable prompt in Copilot Chat so generation is consistent.

## Quick install

1. Open VS Code with Copilot Chat enabled.
2. Create a prompt file at `.github/prompts/ha3d.prompt.md` in your working repo.
3. Paste the prompt from `/tmp/workspace/politician/ha3d/docs/ai_skill_prompt.md` into that file.
4. In Copilot Chat, attach your room photos (or describe them), dimensions, and entity list.
5. Ask Copilot to answer using the prompt file guidance and return JSON only.

## Suggested Copilot request

`Using .github/prompts/ha3d.prompt.md, generate valid HA3D v1.0 plan JSON from this photo set. Return JSON only.`
