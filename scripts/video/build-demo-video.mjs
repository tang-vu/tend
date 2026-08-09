import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, join, resolve } from "node:path";
import process from "node:process";

const ROOT = resolve(import.meta.dirname, "../..");
const OUTPUT_DIR = join(ROOT, "artifacts", "video");
const WORK_DIR = join(OUTPUT_DIR, "work");
const API_URL = "https://api.xiaomimimo.com/v1/chat/completions";
const visualOnly = process.argv.includes("--visual-only");
const preview = process.argv.includes("--preview");
const skipAsr = process.argv.includes("--skip-asr");
const width = preview ? 1280 : 1920;
const height = preview ? 720 : 1080;
const fps = 30;
const narrationSpeed = 1.25;

const voiceDirection =
  "Confident, warm English documentary narrator. Premium technology film, calm authority, crisp diction, emotionally intelligent, never salesy. Medium pace with deliberate pauses and a subtle lift on the final sentence.";

const scenes = [
  {
    id: "thesis",
    image: "landing-desktop.png",
    kicker: "TEND  /  PERSISTENT COMMUNITY STEWARDSHIP",
    title: "Moderation should not reset with every message.",
    seconds: 14,
    narration:
      "AutoMod sees one message. TEND remembers the relationships and values that give it meaning. Built around one persistent Mind, it helps independent creators protect community culture without turning every mistake into punishment.",
  },
  {
    id: "memory",
    image: "demo-learned-desktop.png",
    kicker: "ACT 1  /  MEMORY",
    title: "Teach the culture, not just the rules.",
    seconds: 22,
    narration:
      "The creator teaches TEND what ordinary moderation tools forget: roasting is usually welcome, Kai has a voice boundary, new members deserve a gentle first reminder, and bans are never automatic. The Mind carries continuity across sessions. TEND turns creator-approved facts into inspectable receipts that can be corrected or archived.",
  },
  {
    id: "judgment",
    image: "demo-incident-desktop.png",
    kicker: "ACT 2  /  CONTEXTUAL JUDGMENT",
    title: "The sentence is mild. The history is not.",
    seconds: 27,
    narration:
      "In a new session, Jules writes an ambiguous joke. A keyword filter might call it harmless. TEND remembers Kai's earlier request, so context changes the judgment. It recommends a private, gentle reminder, with no ban and no timeout, then shows the exact memory that mattered. This is not generic toxicity scoring. It is proportional, explainable stewardship.",
  },
  {
    id: "authority",
    image: "demo-incident-desktop.png",
    kicker: "HUMAN AUTHORITY  /  SAFETY BY DESIGN",
    title: "Autonomy begins after explicit approval.",
    seconds: 16,
    narration:
      "Contacting a member requires explicit human approval. In the public demo, delivery is recorded locally and clearly labeled. Approval creates a real persisted due job, protected by idempotency, rather than a decorative animation.",
  },
  {
    id: "autonomy",
    image: "demo-countdown-desktop.png",
    kicker: "ACT 3  /  AUTONOMOUS FOLLOW-UP",
    title: "TEND waits, so the creator does not have to.",
    seconds: 21,
    narration:
      "Now the creator can leave. Without another prompt, the worker atomically claims the due job and checks whether repair held. The public walkthrough uses a deterministic seeded observation; the scheduler, claim, audit trail, and persisted state transition are real. Live Minds persistence and the authenticated Skill path are verified separately.",
  },
  {
    id: "resolution",
    image: "demo-resolved-desktop.png",
    kicker: "THE OUTCOME  /  REPAIR OVER PUNISHMENT",
    title: "A healthier community, not merely a cleaner server.",
    seconds: 13,
    narration:
      "No renewed conflict. TEND closes the case, records that repair held, and prepares a positive community prompt. AutoMod keeps a server clean. TEND helps keep a community healthy.",
  },
];

function loadRootEnv() {
  const envPath = join(ROOT, ".env");
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const match = line.match(/^([A-Z][A-Z0-9_]*)=(.*)$/);
    if (!match || process.env[match[1]]) continue;
    let value = match[2].trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    process.env[match[1]] = value;
  }
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: ROOT,
    encoding: "utf8",
    stdio: options.capture ? "pipe" : "inherit",
  });
  if (result.status !== 0) {
    const detail = options.capture ? result.stderr?.trim() : "";
    throw new Error(`${command} failed${detail ? `: ${detail}` : ""}`);
  }
  return result.stdout?.trim() ?? "";
}

function assertTools() {
  run("ffmpeg", ["-version"], { capture: true });
  run("ffprobe", ["-version"], { capture: true });
}

function ffmpegPath(path) {
  return resolve(path)
    .replaceAll("\\", "/")
    .replace(/^([A-Za-z]):/, "$1\\:");
}

function writeText(name, value) {
  const path = join(WORK_DIR, name);
  writeFileSync(path, value, "utf8");
  return ffmpegPath(path);
}

function audioDuration(path) {
  return Number(
    run(
      "ffprobe",
      [
        "-v",
        "error",
        "-show_entries",
        "format=duration",
        "-of",
        "default=noprint_wrappers=1:nokey=1",
        path,
      ],
      { capture: true },
    ),
  );
}

async function mimoRequest(apiKey, body) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 180_000);
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "content-type": "application/json", "api-key": apiKey },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (!response.ok) {
      const bodyText = (await response.text()).slice(0, 600);
      throw new Error(`MiMo API returned HTTP ${response.status}: ${bodyText}`);
    }
    return await response.json();
  } finally {
    clearTimeout(timeout);
  }
}

async function generateNarration(scene, apiKey) {
  const audioPath = join(WORK_DIR, `${scene.id}.wav`);
  if (existsSync(audioPath)) return audioPath;
  process.stdout.write(`MiMo TTS: ${scene.id}... `);
  const response = await mimoRequest(apiKey, {
    model: "mimo-v2.5-tts",
    messages: [
      { role: "user", content: voiceDirection },
      { role: "assistant", content: scene.narration },
    ],
    audio: { format: "wav", voice: "Milo" },
  });
  const encoded = response?.choices?.[0]?.message?.audio?.data;
  if (typeof encoded !== "string" || encoded.length < 100) {
    throw new Error(`MiMo TTS did not return audio for ${scene.id}.`);
  }
  writeFileSync(audioPath, Buffer.from(encoded, "base64"));
  process.stdout.write("done\n");
  return audioPath;
}

async function verifyNarration(scene, audioPath, apiKey) {
  process.stdout.write(`MiMo ASR: ${scene.id}... `);
  const encoded = readFileSync(audioPath).toString("base64");
  const response = await mimoRequest(apiKey, {
    model: "mimo-v2.5-asr",
    messages: [
      {
        role: "user",
        content: [
          {
            type: "input_audio",
            input_audio: { data: `data:audio/wav;base64,${encoded}` },
          },
        ],
      },
    ],
    asr_options: { language: "en" },
  });
  const transcript = response?.choices?.[0]?.message?.content;
  if (typeof transcript !== "string" || transcript.trim().length === 0) {
    throw new Error(`MiMo ASR did not return a transcript for ${scene.id}.`);
  }
  const expected = new Set(normalizeWords(scene.narration));
  const actual = new Set(normalizeWords(transcript));
  const matched = [...expected].filter((word) => actual.has(word)).length;
  const coverage = expected.size === 0 ? 0 : matched / expected.size;
  process.stdout.write(`${Math.round(coverage * 100)}% word coverage\n`);
  return { scene: scene.id, transcript, wordCoverage: coverage };
}

function normalizeWords(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9' ]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

function captionChunks(text) {
  const sentences = text.match(/[^.!?]+[.!?]+|[^.!?]+$/g) ?? [text];
  return sentences.map((sentence) => sentence.trim());
}

function wrapCaption(text, max = 52) {
  const words = text.split(/\s+/);
  const lines = [];
  let line = "";
  for (const word of words) {
    if (line && `${line} ${word}`.length > max) {
      lines.push(line);
      line = word;
    } else {
      line = line ? `${line} ${word}` : word;
    }
  }
  if (line) lines.push(line);
  return lines.slice(0, 2).join("\n");
}

function createSceneVideo(scene, audioPath, duration, index) {
  const output = join(
    WORK_DIR,
    `${String(index).padStart(2, "0")}-${scene.id}.mp4`,
  );
  const image = join(ROOT, "docs", "screenshots", scene.image);
  if (!existsSync(image)) throw new Error(`Missing screenshot: ${image}`);
  const kicker = writeText(`${scene.id}-kicker.txt`, scene.kicker);
  const title = writeText(`${scene.id}-title.txt`, scene.title);
  const font = ffmpegPath("C:/Windows/Fonts/segoeui.ttf");
  const fontBold = ffmpegPath("C:/Windows/Fonts/seguisb.ttf");
  const fadeOut = Math.max(0, duration - 0.45).toFixed(3);
  const captionFilters = [];
  const captions = captionChunks(scene.narration);
  const weights = captions.map((caption) => normalizeWords(caption).length);
  const totalWeight = weights.reduce((sum, value) => sum + value, 0);
  let cursor = 0.2;
  captions.forEach((caption, captionIndex) => {
    const slot = Math.max(
      1.2,
      ((duration - 0.6) * weights[captionIndex]) / totalWeight,
    );
    const end = Math.min(duration - 0.2, cursor + slot);
    const text = writeText(
      `${scene.id}-caption-${captionIndex}.txt`,
      wrapCaption(caption),
    );
    captionFilters.push(
      `drawtext=fontfile='${font}':textfile='${text}':fontcolor=white:fontsize=${preview ? 25 : 38}:line_spacing=10:x=(w-text_w)/2:y=h-${preview ? 105 : 158}:shadowcolor=black@0.9:shadowx=2:shadowy=2:enable='between(t,${cursor.toFixed(3)},${end.toFixed(3)})'`,
    );
    cursor = end;
  });
  const videoFilter = [
    `scale=${width}:${height}:force_original_aspect_ratio=increase`,
    `crop=${width}:${height}:0:${scene.id === "thesis" ? "0" : "(ih-oh)/2"}`,
    `zoompan=z='min(zoom+0.00018,1.035)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s=${width}x${height}:fps=${fps}`,
    "eq=brightness=-0.035:saturation=0.92:contrast=1.03",
    `drawbox=x=0:y=0:w=iw:h=${preview ? 122 : 182}:color=0x08140f@0.76:t=fill`,
    `drawbox=x=0:y=ih-${preview ? 138 : 205}:w=iw:h=${preview ? 138 : 205}:color=black@0.64:t=fill`,
    `drawbox=x=${preview ? 54 : 82}:y=${preview ? 43 : 63}:w=${preview ? 42 : 64}:h=3:color=0x9FE870@1:t=fill`,
    `drawtext=fontfile='${fontBold}':textfile='${kicker}':fontcolor=0x9FE870:fontsize=${preview ? 15 : 22}:x=${preview ? 108 : 164}:y=${preview ? 30 : 45}`,
    `drawtext=fontfile='${fontBold}':textfile='${title}':fontcolor=white:fontsize=${preview ? 28 : 43}:x=${preview ? 54 : 82}:y=${preview ? 68 : 103}:shadowcolor=black@0.7:shadowx=2:shadowy=2`,
    ...captionFilters,
    "fade=t=in:st=0:d=0.35",
    `fade=t=out:st=${fadeOut}:d=0.45`,
    "format=yuv420p",
  ].join(",");
  const audioFilter = `atempo=${narrationSpeed},loudnorm=I=-16:TP=-1.5:LRA=7,apad,afade=t=in:st=0:d=0.18,afade=t=out:st=${fadeOut}:d=0.4`;
  run("ffmpeg", [
    "-y",
    "-hide_banner",
    "-loglevel",
    "warning",
    "-loop",
    "1",
    "-framerate",
    String(fps),
    "-i",
    image,
    "-i",
    audioPath,
    "-t",
    duration.toFixed(3),
    "-vf",
    videoFilter,
    "-af",
    audioFilter,
    "-c:v",
    "libx264",
    "-preset",
    preview ? "veryfast" : "medium",
    "-crf",
    preview ? "24" : "18",
    "-c:a",
    "aac",
    "-b:a",
    "192k",
    "-ar",
    "48000",
    "-movflags",
    "+faststart",
    output,
  ]);
  return output;
}

function makeSilence(scene) {
  const path = join(WORK_DIR, `${scene.id}-silence.wav`);
  const seconds = preview ? 4 : scene.seconds;
  run("ffmpeg", [
    "-y",
    "-hide_banner",
    "-loglevel",
    "error",
    "-f",
    "lavfi",
    "-i",
    "anullsrc=r=48000:cl=mono",
    "-t",
    String(seconds),
    path,
  ]);
  return path;
}

function concatScenes(paths) {
  const listPath = join(WORK_DIR, "scenes.txt");
  writeFileSync(
    listPath,
    paths.map((path) => `file '${path.replaceAll("'", "'\\''")}'`).join("\n"),
    "utf8",
  );
  const output = join(WORK_DIR, "tend-demo-concat.mp4");
  run("ffmpeg", [
    "-y",
    "-hide_banner",
    "-loglevel",
    "warning",
    "-f",
    "concat",
    "-safe",
    "0",
    "-i",
    listPath,
    "-fflags",
    "+genpts",
    "-c:v",
    "copy",
    "-af",
    "aresample=async=1:first_pts=0",
    "-c:a",
    "aac",
    "-b:a",
    "192k",
    output,
  ]);
  return output;
}

function finishVideo(concatPath) {
  const output = join(
    OUTPUT_DIR,
    preview ? "tend-demo-preview.mp4" : "tend-creative-minds-jam-demo.mp4",
  );
  const duration = audioDuration(concatPath);
  run("ffmpeg", [
    "-y",
    "-hide_banner",
    "-loglevel",
    "warning",
    "-i",
    concatPath,
    "-f",
    "lavfi",
    "-t",
    duration.toFixed(3),
    "-i",
    "anoisesrc=color=pink:amplitude=0.025:r=48000",
    "-filter_complex",
    "[1:a]highpass=f=80,lowpass=f=850,volume=0.10[bed];[0:a][bed]amix=inputs=2:duration=first:weights='1 0.18':normalize=0,loudnorm=I=-16:TP=-1.5:LRA=8[a]",
    "-map",
    "0:v",
    "-map",
    "[a]",
    "-c:v",
    "copy",
    "-c:a",
    "aac",
    "-b:a",
    "192k",
    "-ar",
    "48000",
    "-movflags",
    "+faststart",
    output,
  ]);
  return output;
}

async function main() {
  mkdirSync(WORK_DIR, { recursive: true });
  assertTools();
  loadRootEnv();
  const apiKey = process.env.MIMO_API_KEY;
  if (!visualOnly && !apiKey) {
    throw new Error(
      "MIMO_API_KEY is missing. Revoke the key exposed in chat, create a new one, and place it in the ignored root .env file.",
    );
  }

  const reports = [];
  const sceneVideos = [];
  for (const [index, scene] of scenes.entries()) {
    const audioPath = visualOnly
      ? makeSilence(scene)
      : await generateNarration(scene, apiKey);
    if (!visualOnly && !skipAsr)
      reports.push(await verifyNarration(scene, audioPath, apiKey));
    const duration = visualOnly
      ? preview
        ? 4
        : scene.seconds
      : audioDuration(audioPath) / narrationSpeed + 0.5;
    process.stdout.write(
      `Rendering ${scene.id} (${duration.toFixed(1)}s)...\n`,
    );
    sceneVideos.push(createSceneVideo(scene, audioPath, duration, index));
  }

  if (reports.length > 0) {
    writeFileSync(
      join(OUTPUT_DIR, "mimo-asr-verification.json"),
      `${JSON.stringify({ generatedAt: new Date().toISOString(), reports }, null, 2)}\n`,
      "utf8",
    );
  }
  const output = finishVideo(concatScenes(sceneVideos));
  const duration = audioDuration(output);
  process.stdout.write(
    `\nCreated ${basename(output)} (${duration.toFixed(1)}s, ${width}x${height}).\n`,
  );
  if (!preview && (duration < 90 || duration > 120)) {
    throw new Error(
      `Final duration ${duration.toFixed(1)}s is outside the 90-120s submission window.`,
    );
  }
}

await main();
