import os
import asyncio
from dotenv import load_dotenv
from fastapi import FastAPI, Query
from fastapi.responses import StreamingResponse, HTMLResponse
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate

load_dotenv()

ai_model = os.getenv("AI_MODEL", "openai:gpt-5-mini")  # Default to gpt-5-mini if not set

app = FastAPI(title="LangChain Streaming App")

# Initialize the Chat Model
llm = ChatOpenAI(
    model=ai_model,
    temperature=0.7,
    streaming=True  # Enables token streaming
)
# Define prompt template
prompt = ChatPromptTemplate.from_messages([
    ("system", "You are a helpful assistant."),
    ("user", "{input}")
])

# Chain using LCEL (LangChain Expression Language)
chain = prompt | llm

async def generate_token_stream(user_input: str):
    """
    Async generator function that streams tokens from LangChain
    in Server-Sent Events (SSE) format.
    """
    try:
        # astream yields AIMessageChunk objects step by step
        async for chunk in chain.astream({"input": user_input}):
            if chunk.content:
                # Format output as SSE: "data: <content>\n\n"
                # Replacing newlines with an escaped format to avoid breaking SSE frames
                safe_content = chunk.content.replace("\n", "\\n")
                yield f"data: {safe_content}\n\n"
                
                # Small yield pause to allow smooth network transfer
                await asyncio.sleep(0.01)
                
    except Exception as e:
        yield f"data: [Error: {str(e)}]\n\n"
    finally:
        # Signal completion to client
        yield "data: [DONE]\n\n"

@app.get("/stream")
async def stream_response(prompt: str = Query(..., description="The prompt to send to LLM")):
    """Endpoint returning an SSE token stream."""
    return StreamingResponse(
        generate_token_stream(prompt),
        media_type="text/event-stream"
    )

@app.get("/", response_class=HTMLResponse)
async def serve_index():
    """Serves the front-end user interface."""
    with open("index.html", "r", encoding="utf-8") as f:
        return f.read()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="127.0.0.1", port=8000, reload=True)