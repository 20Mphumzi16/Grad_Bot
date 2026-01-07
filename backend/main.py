from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from vector import retriever

load_dotenv()

model = ChatOpenAI(model="gpt-4o-mini")

template = """
You are an expert assistant that answers questions about a graduate programme.

Use ONLY the information provided in the retrieved documents.
Do NOT invent information — reply with:
"I don’t have that information in my knowledge base."
if the answer isn’t in the documents.

Here are some relevant answers: {answers}

Here is the question to answer: {question}
"""
prompt = ChatPromptTemplate.from_template(template)
chain = prompt | model

MAX_SNIPPET_CHARS = 400        # industry standard: 200–500 chars
MAX_SOURCES = 3               # industry standard: 2–5 chunks


def ask_grad_question(question: str) -> dict:
    docs = retriever.invoke(question)[:MAX_SOURCES]

    # ✅ Convert docs to text context
    context_text = "\n\n".join(
        doc.page_content for doc in docs
    )

    result = chain.invoke({
        "answers": context_text,
        "question": question
    })

    answer_text = (
        result.content
        if hasattr(result, "content")
        else str(result)
    )

    # ✅ Build evidence snippets
    sources = []
    for idx, doc in enumerate(docs):
        sources.append({
            "chunk_id": doc.metadata.get("chunk_id", f"chunk_{idx}"),
            "text": doc.page_content[:MAX_SNIPPET_CHARS],
            "source": str(doc.metadata.get("source", "unknown")),
            "page": str(doc.metadata.get("page", "")),
        })

    return {
        "answer": answer_text,
        "sources": sources
    }

# Optional CLI usage
if __name__ == "__main__":
    while True:
        print("\n\n-------------------------------")
        question = input("Ask your question (q to quit): ")
        print("\n\n")
        if question == "q":
            break

        answer = ask_grad_question(question)
        print(answer)