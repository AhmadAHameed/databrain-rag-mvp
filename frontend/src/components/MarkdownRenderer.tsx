import React from 'react';
import { Box, useTheme, styled } from '@mui/material';
import { marked } from 'marked';
import DOMPurify from 'isomorphic-dompurify';

interface MarkdownRendererProps {
  content: string;
  variant?: 'body1' | 'body2' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  sx?: object;
}

// Custom styled component for markdown content
const StyledMarkdownContainer = styled(Box)(({ theme }) => ({
  '& h1, & h2, & h3, & h4, & h5, & h6': {
    margin: `${theme.spacing(2)} 0 ${theme.spacing(1)} 0`,
    fontWeight: 600,
    lineHeight: 1.3,
    color: theme.palette.text.primary,
  },
  '& h1': {
    fontSize: '2rem',
    borderBottom: `2px solid ${theme.palette.divider}`,
    paddingBottom: theme.spacing(1),
  },
  '& h2': {
    fontSize: '1.5rem',
    borderBottom: `1px solid ${theme.palette.divider}`,
    paddingBottom: theme.spacing(0.5),
  },
  '& h3': {
    fontSize: '1.25rem',
  },
  '& h4': {
    fontSize: '1.125rem',
  },
  '& h5': {
    fontSize: '1rem',
  },
  '& h6': {
    fontSize: '0.875rem',
  },
  '& p': {
    margin: `${theme.spacing(1)} 0`,
    lineHeight: 1.6,
    color: theme.palette.text.primary,
  },
  '& strong, & b': {
    fontWeight: 600,
    color: theme.palette.text.primary,
  },
  '& em, & i': {
    fontStyle: 'italic',
    color: theme.palette.text.secondary,
  },
  '& ul, & ol': {
    margin: `${theme.spacing(1)} 0`,
    paddingLeft: theme.spacing(3),
  },
  '& li': {
    margin: `${theme.spacing(0.5)} 0`,
    lineHeight: 1.5,
  },
  '& li::marker': {
    color: theme.palette.primary.main,
  },
  '& blockquote': {
    margin: `${theme.spacing(2)} 0`,
    padding: `${theme.spacing(1)} ${theme.spacing(2)}`,
    borderLeft: `4px solid ${theme.palette.primary.main}`,
    backgroundColor: theme.palette.action.hover,
    fontStyle: 'italic',
    borderRadius: `0 ${theme.shape.borderRadius}px ${theme.shape.borderRadius}px 0`,
  },
  '& code': {
    fontFamily: 'Consolas, Monaco, "Courier New", monospace',
    fontSize: '0.875em',
    padding: `${theme.spacing(0.25)} ${theme.spacing(0.5)}`,
    backgroundColor: theme.palette.action.hover,
    borderRadius: theme.shape.borderRadius / 2,
    border: `1px solid ${theme.palette.divider}`,
  },
  '& pre': {
    margin: `${theme.spacing(2)} 0`,
    padding: theme.spacing(2),
    backgroundColor: theme.palette.mode === 'dark' ? '#1e1e1e' : '#f5f5f5',
    borderRadius: theme.shape.borderRadius,
    overflow: 'auto',
    border: `1px solid ${theme.palette.divider}`,
    '& code': {
      padding: 0,
      backgroundColor: 'transparent',
      border: 'none',
      fontSize: '0.8rem',
    },
  },
  '& table': {
    width: '100%',
    margin: `${theme.spacing(2)} 0`,
    borderCollapse: 'collapse',
    border: `1px solid ${theme.palette.divider}`,
  },
  '& th, & td': {
    padding: `${theme.spacing(1)} ${theme.spacing(1.5)}`,
    border: `1px solid ${theme.palette.divider}`,
    textAlign: 'left',
  },
  '& th': {
    backgroundColor: theme.palette.action.hover,
    fontWeight: 600,
  },
  '& tr:nth-of-type(even)': {
    backgroundColor: theme.palette.action.hover,
  },
  '& a': {
    color: theme.palette.primary.main,
    textDecoration: 'none',
    '&:hover': {
      textDecoration: 'underline',
    },
  },
  '& hr': {
    margin: `${theme.spacing(3)} 0`,
    border: 'none',
    borderTop: `2px solid ${theme.palette.divider}`,
  },
  // Special styling for inline formatting
  '& .highlight': {
    backgroundColor: theme.palette.warning.light,
    padding: `${theme.spacing(0.25)} ${theme.spacing(0.5)}`,
    borderRadius: theme.shape.borderRadius / 2,
  },
  // Emoji support
  '& .emoji': {
    fontSize: '1.2em',
    verticalAlign: 'middle',
  }
}));

// Configure marked options
marked.setOptions({
  breaks: true,
  gfm: true,
});

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ 
  content, 
  variant = 'body1',
  sx = {} 
}) => {
  const theme = useTheme();
  const parseMarkdown = (text: string): string => {
    try {
      // Parse with marked (it returns a string or Promise<string>, we'll handle both)
      const html = marked(text);
      
      // Handle both string and Promise<string> cases
      if (typeof html === 'string') {
        // Sanitize with DOMPurify
        return DOMPurify.sanitize(html, {
          ALLOWED_TAGS: [
            'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
            'p', 'br', 'strong', 'b', 'em', 'i', 'u',
            'ul', 'ol', 'li',
            'blockquote',
            'code', 'pre',
            'table', 'thead', 'tbody', 'tr', 'th', 'td',
            'a', 'hr',
            'span', 'div'
          ],
          ALLOWED_ATTR: ['href', 'id', 'class', 'title', 'target', 'rel']
        });
      } else {
        // For async cases, return the original content as fallback
        return content;
      }
    } catch (error) {
      console.error('Error parsing markdown:', error);
      return content; // Fallback to plain text
    }
  };

  if (!content) {
    return null;
  }

  const htmlContent = parseMarkdown(content);

  return (
    <StyledMarkdownContainer
      sx={{
        ...sx,
        fontSize: variant === 'body1' ? theme.typography.body1.fontSize : 
                 variant === 'body2' ? theme.typography.body2.fontSize : 
                 theme.typography[variant]?.fontSize || theme.typography.body1.fontSize,
      }}
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  );
};

export default MarkdownRenderer;
