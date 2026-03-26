import os
from together import Together


def onboarding_agent(user_info):
    api_key = os.environ["TOGETHER_API_KEY"]
    client = Together(api_key=api_key)
    prompt = f"Onboard contractor: {user_info}. List all Okta, Slack, and IT steps."
    response = client.chat.completions.create(
        model="Qwen/Qwen2-VL-72B-Instruct",
        messages=[{"role": "user", "content": prompt}],
    )
    result = response.choices[0].message.content
    print(f"[OnboardingAgent] Result: {result}")
    return result


if __name__ == "__main__":
    user_info = {
        "name": "Jane Doe",
        "email": "jane.doe@example.com",
        "role": "Contractor",
        "manager": "John Smith",
    }
    onboarding_agent(user_info)
