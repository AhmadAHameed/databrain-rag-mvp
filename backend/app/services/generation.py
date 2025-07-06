from typing import Any, Dict, List, Optional
from app.services.retrieval import RetrievalService
from app.infrastructure.llm.ollama import OllamaService
from app.utils.logging_setup import create_logger
from app.core.config.vector_store import get_vector_store_settings
from app.models.schemas.requests import DocumentFilter
from app.models.schemas.retrieved_context import (
    RetrievedContext,
    RetrievedContextCollection,
    RetrievedContextMetadata,
)
from app.core.config.prompt_templates import (
    RAG_SYSTEM_TEMPLATE,
    RAG_USER_TEMPLATE,
    ADDITIONAL_CONTEXT_TEMPLATE,
    BATCH_SYSTEM_TEMPLATE,
    BATCH_USER_TEMPLATE,
    SYNTHESIS_SYSTEM_TEMPLATE,
    SYNTHESIS_USER_TEMPLATE,
)

logger = create_logger(__name__)


class GenerationService:
    def __init__(self):
        # Provider-agnostic LLM service, defaults to OllamaService
        self.llm_service = OllamaService()
        self.retrieval_service = RetrievalService()
        self.batch_size = 3  # Process 3 chunks at a time
        self.settings = get_vector_store_settings()

    def _validate_input(self, query: str, num_chunks: int, temperature: float) -> None:
        """Validate input parameters for generation."""
        if not query or not query.strip():
            raise ValueError("Query cannot be empty")

        if num_chunks < 1 or num_chunks > 20:
            raise ValueError("num_chunks must be between 1 and 20")

        if temperature < 0.0 or temperature > 2.0:
            raise ValueError("temperature must be between 0.0 and 2.0")

    def _build_rag_prompt(
        self,
        retrieved_context_collection: RetrievedContextCollection,
        query: str,
        additional_context: Optional[str] = None,
    ) -> List[Dict[str, str]]:
        """Build the RAG prompt using the configured templates."""
        context_text = "\n\n---\n\n".join(
            f"[Score: {ctx.metadata.relevance_score:.2f}]\n{ctx.text}"
            for ctx in retrieved_context_collection.contexts
        )

        # Handle additional additional_context if provided
        user_additional_context = ""
        if additional_context:
            user_additional_context = "\n".join(
                line.format(context=additional_context)
                for line in ADDITIONAL_CONTEXT_TEMPLATE
            )

        # Build user content from template
        user_content = "\n".join(RAG_USER_TEMPLATE).format(
            context_text=context_text,
            additional_context=user_additional_context,
            query=query,
        )

        return [
            {"role": "system", "content": " ".join(RAG_SYSTEM_TEMPLATE)},
            {"role": "user", "content": user_content},
        ]

    async def _process_context_batches(
        self,
        retrieved_context_collection: RetrievedContextCollection,
        query: str,
        context: Optional[str],
        temperature: float,
    ) -> List[str]:
        """Process context batches and generate intermediate responses."""
        all_responses = []
        for i in range(0, len(retrieved_context_collection.contexts), self.batch_size):
            batch = retrieved_context_collection.contexts[i: i +
                                                          self.batch_size]
            logger.debug(f"Processing batch {i//self.batch_size + 1}")

            context_text = "\n\n---\n\n".join(
                f"[Score: {ctx.metadata.relevance_score:.2f}]\n{ctx.text}"
                for ctx in batch
            )

            additional_context = ""
            if context:
                additional_context = "\n".join(
                    line.format(context=context) for line in ADDITIONAL_CONTEXT_TEMPLATE
                )

            user_content = "\n".join(BATCH_USER_TEMPLATE).format(
                context_text=context_text,
                additional_context=additional_context,
                query=query,
            )

            prompt = [
                {"role": "system", "content": " ".join(BATCH_SYSTEM_TEMPLATE)},
                {"role": "user", "content": user_content},
            ]

            try:
                batch_response = await self.llm_service.chat(
                    messages=prompt, temperature=temperature
                )
                all_responses.append(batch_response["message"]["content"])
            except Exception as e:
                logger.error(f"Error in batch generation: {str(e)}")
                raise Exception(
                    f"Failed to generate response for batch: {str(e)}")

        return all_responses

    async def _generate_final_synthesis(
        self,
        all_responses: List[str],
        query: str,
        context: Optional[str],
        temperature: float,
    ) -> str:
        """Generate final synthesized response from all batch responses."""
        additional_context = f"Additional Context:\n{context}\n\n" if context else ""

        synthesis_prompt = [
            {"role": "system", "content": SYNTHESIS_SYSTEM_TEMPLATE},
            {
                "role": "user",
                "content": SYNTHESIS_USER_TEMPLATE.format(
                    analysis_results="\n\n".join(all_responses),
                    additional_context=additional_context,
                    query=query,
                ),
            },
        ]

        try:
            final_response = await self.llm_service.chat(
                messages=synthesis_prompt, temperature=temperature
            )
            logger.info("Successfully generated final response")
            return final_response["message"]["content"]
        except Exception as e:
            logger.error(f"Error in final synthesis: {str(e)}")
            raise Exception(f"Failed to generate final response: {str(e)}")

    async def _retrieve_and_process_contexts(
        self,
        query: str,
        num_chunks: int,
        min_score: float,
        filters: Optional[DocumentFilter] = None,
    ) -> RetrievedContextCollection:
        """Retrieve and process context chunks."""
        logger.debug(
            f"Retrieving {num_chunks} chunks for query with filters: {filters}"
        )
        chunks = await self.retrieval_service.retrieve_similar(
            query=query, limit=num_chunks, min_score=min_score, filters=filters
        )

        contexts = RetrievedContextCollection()
        for chunk in chunks:
            if chunk.score >= min_score:
                context = RetrievedContext(
                    text=chunk.content,
                    metadata=RetrievedContextMetadata(
                        chunk_id=str(chunk.payload.get("chunk_id")),
                        document_type=chunk.payload.get("document_type"),
                        relevance_score=chunk.score,
                        # Handle both old and new field names for backward compatibility
                        document_page_no=chunk.payload.get("document_page_no") or chunk.payload.get("document_page"),
                        document_name=chunk.payload.get("document_name"),
                        division=chunk.payload.get("division"),
                        department=chunk.payload.get("department"),
                        created_at=chunk.payload.get("created_at"),
                        processed_by=chunk.payload.get("processed_by"),
                        extraction_method=chunk.payload.get("extraction_method"),
                    ),
                )
                contexts.contexts.append(context)

        contexts.total_contexts = len(contexts.contexts)
        contexts.contexts.sort(
            key=lambda x: x.metadata.relevance_score, reverse=True)

        if contexts.contexts:
            logger.debug(f"Found {len(contexts.contexts)} relevant contexts")

        return contexts

    async def _handle_empty_contexts(self, query: str):
        """Handle the case when no relevant contexts are found."""
        logger.info("No relevant contexts found above similarity threshold")
        yield {"type": "contexts", "contexts": [], "query": query}
        yield {
            "type": "answer",
            "content": "I could not find any relevant information to answer your question with sufficient confidence.",
        }

    async def _stream_response(
        self,
        prompt: List[Dict[str, str]],
        retrieved_context_collection: RetrievedContextCollection,
        query: str,
        temperature: float,
    ):
        """Stream the response from the LLM. First yields contexts, then streams the generated response."""
        # First yield the contexts and query for sources display
        serializable_contexts = [
            ctx.to_dict() for ctx in retrieved_context_collection.contexts
        ]
        yield {
            "type": "contexts",
            "contexts": serializable_contexts,
            "query": query,
        }

        # Then stream the LLM response
        async for chunk in self.llm_service.chat_stream(
            messages=prompt, temperature=temperature
        ):
            yield {"type": "answer", "content": chunk}

    async def generate_response_stream(
        self,
        query: str,
        num_chunks: int = 5,
        additional_context: Optional[str] = None,
        temperature: float = 0.7,
        min_score: float = 0.3,
        filters: Optional[DocumentFilter] = None,
    ):
        """Stream a response using RAG and Ollama streaming for real-time SSE."""
        try:
            logger.info(f"Starting streaming generation for query: {query}")
            self._validate_input(query, num_chunks, temperature)

            contexts = await self._retrieve_and_process_contexts(
                query, num_chunks, min_score, filters
            )

            if not contexts:
                async for event in self._handle_empty_contexts(query):
                    yield event
                return

            # Build prompt using the helper method
            prompt = self._build_rag_prompt(
                contexts, query, additional_context)

            # Stream the response
            async for event in self._stream_response(
                prompt, contexts, query, temperature
            ):
                yield event

        except ValueError as e:
            logger.warning(f"Invalid input parameters: {str(e)}")
            yield {"type": "error", "content": str(e)}
        except Exception as e:
            logger.error(f"Error generating response: {str(e)}", exc_info=True)
            yield {
                "type": "error",
                "content": "Failed to generate response. Please try again later.",
            }

    async def generate_response(
        self,
        query: str,
        num_chunks: int = 5,
        context: Optional[str] = None,
        temperature: float = 0.7,
        min_score: float = 0.0,
        filters: Optional[DocumentFilter] = None,
    ) -> Dict[str, Any]:
        """
        Generate a response using RAG (Retrieval Augmented Generation)
        """
        try:
            logger.info(f"Starting generation for query: {query}")
            self._validate_input(query, num_chunks, temperature)

            # Retrieve relevant chunks with filters
            logger.debug(
                f"Retrieving {num_chunks} chunks for query with filters: {filters}"
            )
            chunks = await self.retrieval_service.retrieve_similar(
                query=query, limit=num_chunks, min_score=min_score, filters=filters
            )

            # Extract content from chunks and sort by relevance score
            contexts = [
                {
                    "content": chunk.content,
                    "score": chunk.score,
                    "metadata": {
                        k: v for k, v in chunk.payload.items() if k != "chunk_metadata"
                    },
                }
                for chunk in chunks
                if chunk.score >= min_score
            ]

            if not contexts:
                logger.info(
                    "No relevant contexts found above similarity threshold")
                return {
                    "answer": "I could not find any relevant information to answer your question with sufficient confidence.",
                    "contexts": [],
                    "query": query,
                }

            # Sort by score in descending order
            contexts.sort(key=lambda x: x["score"], reverse=True)
            logger.debug(f"Found {len(contexts)} relevant contexts")

            # Process batches and generate final response
            all_responses = await self._process_context_batches(
                contexts, query, context, temperature
            )
            final_answer = await self._generate_final_synthesis(
                all_responses, query, context, temperature
            )

            return {
                "answer": final_answer,
                "contexts": contexts,
                "query": query,
            }

        except ValueError as e:
            logger.warning(f"Invalid input parameters: {str(e)}")
            raise
        except Exception as e:
            logger.error(f"Error generating response: {str(e)}", exc_info=True)
            raise
