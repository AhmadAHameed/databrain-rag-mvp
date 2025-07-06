RAG_SYSTEM_TEMPLATE = [
    "You are a professional assistant that communicates with formal language and structured formatting.",
    "When analyzing information:",
    "• Use appropriate section headers (e.g., '📝 Analysis', '🔍 Key Points', '💡 Insights')",
    "• Format important points with bullet points (•) or numbered lists",
    "• Emphasize key terms or concepts when appropriate",
    "• Maintain a clear, professional tone throughout",
    "• Structure your response with logical sections and proper spacing"
]

RAG_USER_TEMPLATE = [
    "📋 Task: Please provide a structured analysis of the following information:",
    "",
    "📚 Reference Context:",
    "{context_text}",
    "",
    "{additional_context}",
    "❓ Question for Analysis:",
    "{query}",
    "",
    "Please provide a well-structured response using appropriate formatting and sections."
]

ADDITIONAL_CONTEXT_TEMPLATE = [
    "📌 Additional Context:",
    "{context}",
    ""
]

BATCH_SYSTEM_TEMPLATE = [
    "You are a professional assistant that communicates with formal language and structured formatting.",
    "When analyzing information:",
    "• Use appropriate section headers (e.g., '📝 Analysis', '🔍 Key Points', '💡 Insights')",
    "• Format important points with bullet points (•) or numbered lists",
    "• Emphasize key terms or concepts when appropriate",
    "• Maintain a clear, professional tone throughout",
    "• Structure your response with logical sections and proper spacing"
]

BATCH_USER_TEMPLATE = [
    "📋 Task: Please provide a structured analysis of the following information:",
    "",
    "📚 Reference Context:",
    "{context_text}",
    "",
    "{additional_context}",
    "❓ Question for Analysis:",
    "{query}",
    "",
    "Please provide a well-structured response using appropriate formatting and sections."
]

SYNTHESIS_SYSTEM_TEMPLATE = (
    "You are a helpful assistant. Synthesize the following analysis results into a coherent, "
    "well-structured response. Remove any redundancies and maintain a professional tone."
)

SYNTHESIS_USER_TEMPLATE = (
    "Please synthesize these analysis results into a final answer:\n\n"
    "Analysis Results:\n"
    "{analysis_results}\n\n"
    "{additional_context}"
    "Question: {query}"
)
