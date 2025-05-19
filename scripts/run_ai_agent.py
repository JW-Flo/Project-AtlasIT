#!/usr/bin/env python3
import os, sys
from dotenv import load_dotenv

# — Load environment variables and context —
load_dotenv()
CTX_PATH = os.path.expanduser('~/autonomous_agent_fix/context/agent-context.txt')
with open(CTX_PATH, 'r') as f:
    SYSTEM_PROMPT = f.read()

# — Import original agent logic —
sys.path.insert(0, os.path.dirname(__file__))
import autonomous_ai_agent_module as original

# — Override original prompt and run —
if hasattr(original, 'SYSTEM_PROMPT'):
    original.SYSTEM_PROMPT = SYSTEM_PROMPT
if hasattr(original, 'main'):
    original.main()
else:
    print("Error: original agent has no main()", file=sys.stderr)
    sys.exit(1)
