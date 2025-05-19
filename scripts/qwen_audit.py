#!/usr/bin/env python3
"""Send minimal test prompt to Together AI model and print response."""
import os, sys
from together import Together


def main():
    api_key = os.getenv("TOGETHER_API_KEY")
    if not api_key:
        sys.exit("TOGETHER_API_KEY not set")
    model = os.getenv("MODEL", "Qwen/QwQ-32B")
    client = Together(api_key=api_key)
    resp = client.chat.completions.create(
        model=model,
        messages=[{"role": "user", "content": "What is 2+2?"}],
        temperature=0.3,
        max_tokens=32,
    )
    print(resp.choices[0].message.content)
    print(
        f"Prompt tokens: {resp.usage.prompt_tokens}, Completion tokens: {resp.usage.completion_tokens}"
    )


if __name__ == "__main__":
    main()
