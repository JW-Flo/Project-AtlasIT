## Secure API Key Usage

- Use the environment variable `TOGETHER_API_KEY` for Together API access.
- Do not hard-code API keys in code or commit them to version control.
- Example (Python):
  ```python
  import os
  api_key = os.environ['TOGETHER_API_KEY']
  ``` 