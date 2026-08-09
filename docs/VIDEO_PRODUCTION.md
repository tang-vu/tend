# Demo video production

TEND's submission video is a 1080p, 1.5–2 minute English walkthrough assembled from the committed product captures. It uses Xiaomi MiMo for narration and speech-to-text verification, then FFmpeg for motion, burned-in captions, audio leveling, and final H.264/AAC delivery.

## Security first

Never paste an API key into chat, source files, command arguments, screenshots, or committed configuration. If a key has been exposed, revoke it before doing anything else.

Put the replacement key only in the ignored root `.env` file:

```dotenv
MIMO_API_KEY=replace-with-a-new-key
```

The build script reads the value in-process and sends it only as the MiMo `api-key` request header. It does not print or persist the key.

## Build

```bash
# Fast 24-second, credential-free visual proof
pnpm video:preview

# Final MiMo TTS + ASR verified submission video
pnpm video:build
```

Outputs are intentionally ignored under `artifacts/video/`:

- `tend-demo-preview.mp4`: short visual pipeline check.
- `tend-creative-minds-jam-demo.mp4`: final submission deliverable.
- `mimo-asr-verification.json`: per-scene transcription and word-coverage evidence.

The final build uses `mimo-v2.5-tts` with the built-in `Milo` voice and a restrained documentary direction. Each generated WAV is sent back through `mimo-v2.5-asr` in English mode before composition. Narration is paced at 1.25× to stay inside the submission window while preserving natural delivery. Captions are burned from the approved script, so accessibility does not depend on a video player's subtitle support.

MiMo API references:

- [Speech Synthesis](https://mimo.mi.com/docs/en-US/api/audio/tts)
- [Speech Recognition](https://mimo.mi.com/docs/en-US/api/audio/Speech-Recognition)

## Acceptance checks

- Duration is between 90 and 120 seconds.
- Resolution is 1920×1080 at 30 fps.
- Video is H.264 with `yuv420p`; audio is AAC at 48 kHz.
- Narration targets approximately -16 LUFS with a -1.5 dB true-peak ceiling.
- Every spoken scene has burned-in English captions.
- Product mode labels remain visible and the narration does not present seeded demo evidence as a live Minds or Discord call.
