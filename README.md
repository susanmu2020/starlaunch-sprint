# Starlaunch Sprint

An original retro side-scrolling platformer in plain HTML5 canvas + JavaScript. All art is drawn in code and all sound is synthesized with WebAudio. It uses no external assets and makes no network requests.

**Play:** https://susanmu2020.github.io/starlaunch-sprint/

**Disclaimer:** Starlaunch Sprint is an original game with original characters. Not affiliated with, endorsed, or sponsored by Nintendo or any other company.

The game has no ads, no payments, and no data collection. Only your hero choice and progress are saved, in your own browser's localStorage.

## Controls
- Arrows / WASD: move. Space / Up / W: jump (hold to jump higher). Shift / X: run and boost.
- P / Esc: pause. M: mute. Phones and tablets get on-screen buttons.

## Features
- 6 original preset heroes (Sprocket the Fox, Astro Ava, Bolt-9, Morel the Mushwiz, Pip Kickflip, Captain Whiskers) plus a "Create your own" hero with a custom name, colors, and hat
- 3 worlds plus a boss station. Includes shields, jetpacks, Supernova invincibility, moving platforms, and a rocket goal.

MIT licensed (see LICENSE).

## Team Race 2v2
From the title screen choose **👥 Team Race 2v2**:
- **Create online room** – get a 5-letter room code and an invite link (`?room=CODE`). Your friend opens the link (or types the code) on their own device. Both pick heroes in the two-column picker; the host picks NPC skill (Easy/Normal/Hard) and the course (one level or a 3-level series) and starts.
- **Offline** – you plus an NPC teammate.
Team Blue (2 humans) races Team Red (2 NPC rivals). Scoring: coins 100, stomps 200, finish bonus 1000/600/300/100, time bonus. Falling = short respawn. End screen shows an animated leaderboard; a local all-time Top 10 is kept in localStorage.
Controls on each device: Arrows/WASD move, Space/Up/W jump, Shift/X run (or on-screen touch buttons).

### Privacy
Online play connects the two devices directly with WebRTC (peer-to-peer) via the bundled PeerJS library (`js/peerjs.min.js`, MIT) and the free public PeerJS signaling server plus Google STUN to find each other. No accounts; no game data is stored on any server. High scores stay in your browser's localStorage.

## Support button (optional)

At the very top of `js/game.js` there is a single constant:

```js
const SUPPORT_URL = '';
```

Leave it empty and no Support button is shown anywhere. Set it to your donation page (must start with `http://` or `https://`), e.g. `const SUPPORT_URL = 'https://ko-fi.com/yourname';`, and a small "☕ Support the game" link appears on the title screen, the win screen, the Team Race final results and the Top 10 leaderboard. It opens in a new tab (`rel="noopener"`) and never interrupts gameplay.
