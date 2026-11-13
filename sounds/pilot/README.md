# Pilot narration slot

`pilot/js/app.js` looks here for an optional per-exercise narration file,
`sounds/pilot/<question-id>.mp3`, and checks for it with a HEAD request first.
When a file is missing, the narration button stays hidden, so the pilot works
without any audio. Put recorded clips in this folder to turn them on.
