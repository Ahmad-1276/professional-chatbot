# Voice AI Assistant

A real-time voice chatbot: speak into your microphone, watch your words appear, and hear the AI answer back. The backend streams OpenAI responses over a WebSocket; the browser handles speech recognition and speech synthesis.

![Python](https://img.shields.io/badge/Python-3.10%2B-3776AB?logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?logo=fastapi&logoColor=white)
![OpenAI](https://img.shields.io/badge/OpenAI-gpt--4o--mini-412991?logo=openai&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-green)

## Features

- **Voice input** — browser speech recognition turns your speech into text
- **Streaming replies** — tokens arrive over a WebSocket and render as they are generated
- **Spoken answers** — the browser reads responses aloud with speech synthesis
- **Live status UI** — connection state, mic state, and an audio visualizer
- **Single-command run** — FastAPI serves both the API and the frontend

## How it works

```
Browser (Web Speech API)
   │  text
   ▼
WebSocket /ws/chat  ──►  FastAPI  ──►  OpenAI gpt-4o-mini (streaming)
   ▲                                        │
   └──────────── streamed tokens ◄──────────┘
   │
   ▼
SpeechSynthesis (spoken reply)
```

## Tech stack

| Layer | Technology |
| --- | --- |
| Backend | FastAPI, Uvicorn |
| Transport | WebSockets |
| AI | OpenAI `gpt-4o-mini` |
| Voice | Web Speech API (`SpeechRecognition`, `speechSynthesis`) |
| Frontend | HTML, CSS, vanilla JavaScript |

## Project structure

```
.
├── main.py              # FastAPI app, WebSocket endpoint, static serving
├── static/
│   ├── index.html
│   ├── style.css
│   └── script.js
├── requirements.txt
└── .env.example
```

## Getting started

**Prerequisites:** Python 3.10+ and an [OpenAI API key](https://platform.openai.com/api-keys).

```bash
git clone https://github.com/Ahmad-1276/professional-chatbot.git
cd professional-chatbot

python3 -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate

pip install -r requirements.txt

cp .env.example .env
# open .env and set OPENAI_API_KEY=sk-...

uvicorn main:app --reload
```

Open <http://localhost:8000> and click **Start Speaking**.

## Browser support

The Web Speech API is supported in **Chrome** and **Edge**. Firefox does not currently implement `SpeechRecognition`, so voice input will not work there. Microphone access requires `localhost` or HTTPS.

## Configuration

| Variable | Description |
| --- | --- |
| `OPENAI_API_KEY` | OpenAI API key used for chat completions |

The model is set to `gpt-4o-mini` in `main.py`; change it there if you want a different model.

## License

MIT — see [LICENSE](LICENSE).
