import os
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

app = FastAPI()

# CORS for your frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

client = OpenAI(api_key=OPENAI_API_KEY)


@app.websocket("/ws/chat")
async def chat_socket(websocket: WebSocket):
    await websocket.accept()

    try:
        while True:

            # Receive text message from frontend
            user_message = await websocket.receive_text()

            # Stream OpenAI response
            stream = client.chat.completions.create(
                model="gpt-04-mini",
                messages=[{"role": "user", "content": user_message}],
                stream=True,
            )

            # Send chunks to frontend
            async def send_stream():
                for event in stream:
                    delta = event.choices[0].delta
                    content = delta.content

                    if content:  # Only send non-empty chunks
                        await websocket.send_text(content)

                # signal end of message
                await websocket.send_text("[END]")

            await send_stream()

    except WebSocketDisconnect:
        print("Client disconnected")
