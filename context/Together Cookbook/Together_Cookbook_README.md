Serial Chain Agent 	Chain multiple LLM calls sequentially to process complex tasks. 	Colab
Conditional Router Agent Workflow 	Create an agent that routes tasks to specialized models. 	Colab
Parallel Agent Workflow 	Run multiple LLMs in parallel and aggregate their solutions. 	Colab
Orchestrator Subtask Agent Workflow 	Break down tasks into parallel subtasks to be executed by LLMs. 	Colab
Looping Agent Workflow 	Build an agent that iteratively improves responses 	Colab
Together Open Deep Research 	An Open Source Deep-Research Implementation with Multi-Step Web Search 	Colab
Fine-tuning 		
End-to-end Fine-tuning Guide 	Fine-tuning basics and best practices. 	Colab
LoRA Inference and Fine-tuning 	Perform LoRA fine-tuning and inference on Together AI. 	Colab
Preference Tuning - DPO 	Fine-tuning LLMs with preference data using DPO. 	Colab
Continual Fine-tuning 	Continuously fine-tuning model checkpoints on new data. 	Colab
Long Context Finetuning For Repetition 	Fine-tuning LLMs to repeat back words in long sequences. 	Colab
Summarization Long Context Finetuning 	Long context fine-tuning to improve summarization capabilities. 	Colab
Conversation Finetuning 	Fine-tuning LLMs on multi-step conversations. 	Colab
Retrieval-augmented generation 		
RAG_with_Reasoning_Models 	RAG + source citations with DeepSeek R1. 	Colab
MultiModal_RAG_with_Nvidia_Deck 	Multimodal RAG using Nvidia investor slides 	Colab
Open_Contextual_RAG 	An implementation of Contextual Retrieval using open models. 	Colab
Text_RAG 	Implement text-based Retrieval-Augmented Generation 	Colab
Search 		
Multimodal Search and Conditional Image Generation 	Text-to-image and image-to-image search and condtional image generation. 	Colab
Embedding_Visualization 	Visualize vector embeddings 	Colab
Search_with_Reranking 	Improve search results with rerankers 	Colab
Semantic_Search 	Implement vector search with embedding models 	Colab
Miscellaneous 		
Together_Code_Interpreter 	Execute code using Together Code Interpreter (TCI) 	Colab
Thinking_Augmented_Generation 	Give R1 thinking tokens to small models 	Colab
Flux LoRA Inference 	Generate images with fine-tuned Flux LoRA's 	Colab
Structured_Text_Extraction_from_Images 	Extract structured text from images 	Colab
Summarization Evaluation 	Summarizing and evaluating outputs with LLMs. 	Colab
PDF_to_Podcast 	Generate a podcast from PDF content NotebookLM style! 	Colab
Knowledge_Graphs_with_Structured_Outputs 	Get LLMs to generate knowledge graphs 	Colab

## API Key Usage

- Set your Together API key as an environment variable named `TOGETHER_API_KEY`.
- Never hard-code secrets in code or commit them to version control.
- In Python, access it with `os.environ['TOGETHER_API_KEY']`.
- In Node.js, use `process.env.TOGETHER_API_KEY`.