from together import Together

client = Together()

# Run a simple print statement in the code interpreter
response = client.code_interpreter.run(code='print("Welcome to Together Code Interpreter!")', language="python")


print(f"Status: {response.data.status}")


for output in response.data.outputs:
    print(f"{output.type}: {output.data}")

