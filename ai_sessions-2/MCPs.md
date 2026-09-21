# Working example of creating a Model Context Protocol (**MCP**) server in Python using `FastMCP`

### 1. The MCP Server (`mcp_server.py`)

The server exposes tools to an LLM over a standardized protocol. `FastMCP` automatically generates the JSON-RPC schemas based on function type hints and docstrings.

```python
# mcp_server.py
from fastmcp import FastMCP

# Initialize the MCP Server
mcp = FastMCP("Database & Math Server")

@mcp.tool()
def add_numbers(a: int, b: int) -> int:
    """Adds two integers together."""
    return a + b

@mcp.tool()
def get_user_email(user_id: str) -> str:
    """Fetches user email from the database by user ID."""
    # Simulated database lookup
    db = {
        "usr_101": "alex@example.com",
        "usr_102": "sam@example.com"
    }
    return db.get(user_id, "User not found")

if __name__ == "__main__":
    # Runs the server using standard input/output (stdio) transport
    mcp.run(transport="stdio")

```

### 2. The MCP Client (`mcp_client.py`)

The client connects to the MCP server process, discovers its tools dynamically, and executes them.

```python
# mcp_client.py
import asyncio
from fastmcp import Client

async def main():
    # 1. Connect to the local MCP server process over stdio
    # (Matches launching 'python mcp_server.py')
    client = Client("mcp_server.py")
    
    async with client:
        # 2. Automatically discover available tools from the server
        tools = await client.list_tools()
        print("Discovered MCP Tools:")
        for t in tools:
            print(f" - {t.name}: {t.description}")
        
        print("\n--- Invoking Tool via MCP ---")
        
        # 3. Call 'get_user_email' tool via MCP JSON-RPC protocol
        result = await client.call_tool("get_user_email", {"user_id": "usr_101"})
        print("Result from MCP Server:", result)

if __name__ == "__main__":
    asyncio.run(main())

```

### 3. How to Run It

1. **Install dependencies:**
```bash
pip install fastmcp
```


2. **Execute the Client:**
```bash
python mcp_client.py
```


3. **Output:**
```text
Discovered MCP Tools:
 - add_numbers: Adds two integers together.
 - get_user_email: Fetches user email from the database by user ID.

--- Invoking Tool via MCP ---
Result from MCP Server: alex@example.com
```

### Connecting the MCP Server to Claude Desktop or Cursor

Because MCP is a standardized host protocol, you can attach this exact `mcp_server.py` to applications like **Claude Desktop**, **Cursor IDE**, or **VS Code** without changing any server code.

Add the configuration to your editor's `mcpServers` file (e.g., `claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "my_local_tools": {
      "command": "python",
      "args": ["/absolute/path/to/mcp_server.py"]
    }
  }
}

```

Once saved, the desktop application directly detects `add_numbers` and `get_user_email` and lets the model call them during chats.

**Note**: It is very easy to look at MCP as "just another abstraction layer" or useless boilerplate—especially in simple apps where wrapping a Python function in a `FastAPI` endpoint or a `@tool` decorator already works fine.

However, MCP solves a specific **architectural problem**: the **$M \times N$ Integration Bottleneck**.

### The Problem MCP Solves ($M \times N$ Complexity)

Without MCP, every AI framework, application, and IDE handles tool integrations differently.

If you build **3 tools** (e.g., PostgreSQL, GitHub, Slack) and want to use them across **4 host systems** (e.g., Claude Desktop, Cursor IDE, a LangChain backend, and an AutoGen agent), you have to write **12 custom integrations** ($3 \times 4$):

```
       WITHOUT MCP: $M \times N$ Integrations

  [ PostgreSQL ] ---> LangChain Tool Wrapper
                 ---> Claude Desktop Extension
                 ---> Cursor Extension
                 ---> AutoGen Plugin

  [ GitHub ]     ---> LangChain Tool Wrapper
                 ---> Claude Desktop Extension
                 ... (repeats for every tool and host)

```

With MCP, you write the integration **once** as an MCP server. Any MCP-compatible host can immediately use it without custom glue code:

```
        WITH MCP: $M + N$ Integrations

  [ PostgreSQL ] --\
  [ GitHub ]     ---> [ MCP Protocol ] ---> [ Claude Desktop ]
  [ Slack ]      --/                    ---> [ Cursor IDE ]
                                        ---> [ LangChain / Custom App ]

```

### The 4 Real Concrete Advantages

Beyond solving the integration matrix, MCP introduces capabilities that traditional in-process tool calling cannot provide:

#### 1. Decoupled Process Isolation & Security

In standard tool calling, your AI framework runs the tool code directly inside your backend application process.

* With MCP, the tool server runs as an independent process (or remote container).
* If a database tool crashes, hangs, or experiences a memory leak, your main AI agent application remains unaffected.
* You can run tool servers inside secure, locked-down environments (e.g., restricted VPCs or sandboxed containers) without giving the main LLM client direct network access.

#### 2. Dynamic Tool Discovery

Standard tool calling requires hardcoding tool schemas into your LLM prompt payload before execution. MCP servers allow **runtime discovery**:

* The host application queries the MCP server: *"What tools or data resources do you have right now?"*
* The server responds with its current schema. If new database tables, API routes, or tools are added to the MCP server, the host app picks them up automatically without re-deploying or restarting the main application.

#### 3. Standardized Context Beyond Tools (Resources & Prompts)

Traditional function calling *only* handles action triggers (e.g., `execute_sql()`). MCP standardizes three distinct capabilities:

* **Tools:** Actions the model can execute.
* **Resources:** Passive data sources (file contents, live logs, database schemas) that the host can read and attach directly as context.
* **Prompts:** Pre-configured prompt templates managed server-side so prompt engineering updates don't require updating client-side code.

#### 4. Shared Local Development Environment

If you write a complex internal debugging tool, you don't have to choose between putting it in your backend agent OR giving your team access in Cursor/Claude Desktop. Building it as an MCP server lets developers use it interactively in their editor while your production agents run against it simultaneously.

---

### When MCP *Is* Overkill

If your scenario is simple, MCP **is** just unnecessary friction:

* You are building a single monolithic agent using a single framework (e.g., pure LangChain or AutoGen).
* Your tools are simple helper functions (`add()`, `parse_json()`, `get_current_time()`).
* You have no plans to expose those tools to other applications, IDEs, or client interfaces.

**Rule of thumb:** If your tools are tightly coupled to one app, use standard Python/JS function calls. If your tools interface with external systems/data and need to be reused across multiple AI interfaces, MCP provides immense value.