# Saw Spiral

A pulse travels through a spiral of oscillator nodes, Max/MSP-patch style. Each node plays its
number (in Hz) and passes the pulse on after one step. A few forks split the pulse, and the last
node fans out into a chord.

## Run the page

    python3 -m http.server 8000

Then open http://localhost:8000 and press Play. (You can also double-click `index.html`.)

- Click any circle to fire the chain from there.
- Drag a number up or down to retune it.
- Step sets the speed, Sound picks the voice, Shuffle notes picks a new melody.

## Make a video (optional)

Needs Node.js 18+ and ffmpeg (on a Mac: `brew install node ffmpeg`).

    npm install
    npx playwright install chromium
    ./make-video.sh pluck        # or softbell, marimba, saw, square, glass, fm, sine

The video is rendered frame by frame, so it is always smooth, and the audio is rendered offline
with the same synth code as the page.

## Files

- `index.html` – the whole app (HTML, CSS and JS in one file)
- `render.js` – renders frames + a WAV from the page using headless Chromium
- `make-video.sh` – runs render.js and joins the result into an MP4 with ffmpeg
