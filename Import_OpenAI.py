from openai import OpenAI
import os

# Create an explicit OpenAI client instance
client = OpenAI(api_key=os.environ['OPENAI_API_KEY'])

def autonomous_evaluate_and_fix():
    response = client.chat.completions.create(
        model="gpt-4",  # Specify the model
        messages=[
            {"role": "system", "content": "You are a helpful assistant."},
            {"role": "user", "content": "Your prompt here."}
        ]
    )
    # Use the new response handling method
    reply = response.choices[0].message.content
