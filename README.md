# Voice lab (not the website)

This branch only finds and renders the narration voice for Human Factory Settings films.
It holds no site code: Vercel deployments are switched off for it (vercel.json).

- `voice/job.json`: what to render on the next push (engines, voices, texts)
- `voice/texts/`: the lines, in spoken form
- `voice/engines/`: one renderer per open-source model
- `voice/qa.py`: checks every clip (speech recogniser word check, naturalness score, pace, pauses)
- `voice/out/<run>/`: results committed back by the workflow
