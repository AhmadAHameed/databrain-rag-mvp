import re
from typing import List


class ParagraphTextSplitter:
    def __init__(self, chunk_size: int = 2, chunk_overlap: int = 1):
        """
        Initialize ParagraphTextSplitter

        Args:
            chunk_size (int): Number of paragraphs per chunk
            chunk_overlap (int): Number of overlapping paragraphs between chunks
        """
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap

    def split_text(self, text: str) -> List[str]:
        # Split text into paragraphs
        paragraphs = self.split_text_by_paragraph(text)

        return paragraphs

    def split_text_by_paragraph(self, text: str) -> List[str]:
        # Split text into paragraphs
        paragraphs = [p.strip()
                      for p in re.split(r"\n\s*\n", text) if p.strip()]

        return paragraphs
