Place the final full-game music file here as one of:

- `game-theme.mp3`
- `game-theme.m4a`
- `game-theme.ogg`
- `game-theme.wav`

The game loops this file for the whole run after the first click or key press, because browsers block autoplay before player interaction. Jumpscares use the configured hit windows in `src/audio/GameMusic.js` to land on louder moments in the track.
