import os, sys

try:
    from together import Together
except ImportError:
    print(
        "[ERROR] Missing required module: together. Please install with `pip install together`.",
        file=sys.stderr,
    )
    exit(1)

api_key = os.getenv("TOGETHER_API_KEY")
if not api_key:
    print("[ERROR] TOGETHER_API_KEY must be set in environment.", file=sys.stderr)
    exit(1)

client = Together(api_key=api_key)

try:
    response = client.code_interpreter.run(
        code='print("Welcome to Together Code Interpreter!")', language="python"
    )
    print(f"Status: {response.data.status}")
    for output in response.data.outputs:
        print(f"{output.type}: {output.data}")
except Exception as e:
    print(f"[ERROR] {e}", file=sys.stderr)
    exit(1)
