// Mock Data for Development and Testing
// This file contains realistic mock data that simulates backend responses

export interface MockGenerationResponse {
    response: string;
    sources: string[];
    chunks_used: number;
    processing_time: number;
}

export interface MockDocument {
    id: string;
    title: string;
    author: string;
    date: string;
    department: string;
    division: string;
    document_nature: string;
    document_type: string;
    content_preview: string;
}

// Mock responses for different query types
export const MOCK_RESPONSES: Record<string, MockGenerationResponse> = {
    default: {
        response: `# DataBrain AI Assistant Response

Thank you for your query! Based on the documents in our database, I can provide you with the following information:

## Key Findings

1. **Document Analysis**: Our system has analyzed multiple documents related to your query
2. **Data Insights**: The information shows relevant patterns and trends
3. **Recommendations**: Based on the analysis, here are some actionable insights

## Detailed Information

The documents contain comprehensive information about your topic. The analysis reveals several important aspects that should be considered for decision-making purposes.

### Technical Details
- **Processing Method**: Advanced natural language processing
- **Confidence Score**: High confidence in the results
- **Data Sources**: Multiple verified documents

## Conclusion

This analysis provides a solid foundation for understanding the topic. For more specific information, please refine your query or ask follow-up questions.

*Note: This is a mock response for development purposes.*`,
        sources: [
            'Technical_Specification_v2.1.pdf',
            'Project_Guidelines_2024.docx',
            'Implementation_Manual.pdf'
        ],
        chunks_used: 3,
        processing_time: 1.245
    },

    technical: {
        response: `# Technical Analysis Report

## Executive Summary

Based on your technical query, I've analyzed the relevant documentation and compiled the following comprehensive response:

## Technical Specifications

### System Requirements
- **Performance**: High-throughput processing capabilities
- **Scalability**: Designed for enterprise-level deployment
- **Security**: Industry-standard encryption and access controls

### Implementation Details
\`\`\`json
{
  "configuration": {
    "database": "PostgreSQL 14+",
    "backend": "FastAPI with Python 3.11",
    "frontend": "React 18 with TypeScript",
    "deployment": "Docker containers"
  }
}
\`\`\`

## Architecture Overview

The system follows a microservices architecture with the following components:

1. **API Gateway**: Handles routing and authentication
2. **Processing Engine**: Core business logic and data processing
3. **Database Layer**: Persistent storage and data management
4. **User Interface**: Modern web-based frontend

## Best Practices

- Follow established coding standards
- Implement comprehensive testing
- Use continuous integration/deployment
- Monitor system performance

*This is a mock technical response for development testing.*`,
        sources: [
            'System_Architecture_v3.2.pdf',
            'API_Documentation.md',
            'Deployment_Guide.docx',
            'Performance_Benchmarks.xlsx'
        ],
        chunks_used: 4,
        processing_time: 2.156
    },

    business: {
        response: `# Business Intelligence Report

## Market Analysis

Your business query has been processed against our comprehensive database of business documents and reports.

## Key Business Insights

### Financial Overview
- **Revenue Trends**: Positive growth trajectory observed
- **Cost Analysis**: Optimization opportunities identified
- **ROI Metrics**: Above industry benchmarks

### Strategic Recommendations

1. **Short-term Actions**
   - Implement process improvements
   - Enhance customer engagement
   - Optimize resource allocation

2. **Long-term Strategy**
   - Market expansion opportunities
   - Technology investment priorities
   - Talent development programs

## Risk Assessment

| Risk Factor | Impact | Probability | Mitigation |
|-------------|--------|-------------|------------|
| Market volatility | Medium | Low | Diversification |
| Technology changes | High | Medium | Continuous learning |
| Competition | Medium | High | Innovation focus |

## Conclusion

The analysis indicates strong potential for growth with proper strategic planning and execution.

*This is a mock business analysis for development purposes.*`,
        sources: [
            'Business_Plan_2024.pdf',
            'Market_Research_Report.docx',
            'Financial_Analysis_Q4.xlsx',
            'Strategic_Planning_Document.pdf'
        ],
        chunks_used: 5,
        processing_time: 1.834
    }
};

// Mock documents database
export const MOCK_DOCUMENTS: MockDocument[] = [
    {
        id: '1',
        title: 'Technical Specification Document',
        author: 'John Engineer',
        date: '2024-03-15',
        department: 'Engineering',
        division: 'Software Development',
        document_nature: 'Technical',
        document_type: 'PDF',
        content_preview: 'This document outlines the technical specifications for the new system architecture...'
    },
    {
        id: '2',
        title: 'Project Implementation Guidelines',
        author: 'Sarah Manager',
        date: '2024-03-10',
        department: 'Project Management',
        division: 'Operations',
        document_nature: 'Procedural',
        document_type: 'DOCX',
        content_preview: 'Guidelines for implementing projects following company standards and best practices...'
    },
    {
        id: '3',
        title: 'Business Analysis Report Q1 2024',
        author: 'Michael Analyst',
        date: '2024-04-01',
        department: 'Business Intelligence',
        division: 'Analytics',
        document_nature: 'Report',
        document_type: 'PDF',
        content_preview: 'Comprehensive analysis of business performance during the first quarter...'
    },
    {
        id: '4',
        title: 'Security Policy Update',
        author: 'Lisa Security',
        date: '2024-02-28',
        department: 'IT Security',
        division: 'Information Technology',
        document_nature: 'Policy',
        document_type: 'PDF',
        content_preview: 'Updated security policies and procedures for all company systems...'
    },
    {
        id: '5',
        title: 'Performance Benchmarks',
        author: 'David Performance',
        date: '2024-03-20',
        department: 'Quality Assurance',
        division: 'Engineering',
        document_nature: 'Data',
        document_type: 'XLSX',
        content_preview: 'Performance benchmarking results for system optimization...'
    }
];

// Mock filter options
export const MOCK_FILTER_OPTIONS = {
    authors: ['John Engineer', 'Sarah Manager', 'Michael Analyst', 'Lisa Security', 'David Performance'],
    departments: ['Engineering', 'Project Management', 'Business Intelligence', 'IT Security', 'Quality Assurance'],
    divisions: ['Software Development', 'Operations', 'Analytics', 'Information Technology'],
    documentNatures: ['Technical', 'Procedural', 'Report', 'Policy', 'Data'],
    documentTypes: ['PDF', 'DOCX', 'XLSX', 'TXT']
};

// Helper function to get appropriate mock response based on query
export const getMockResponseForQuery = (query: string): MockGenerationResponse => {
    const lowerQuery = query.toLowerCase();

    if (lowerQuery.includes('technical') || lowerQuery.includes('system') || lowerQuery.includes('architecture')) {
        return MOCK_RESPONSES.technical;
    }

    if (lowerQuery.includes('business') || lowerQuery.includes('financial') || lowerQuery.includes('market')) {
        return MOCK_RESPONSES.business;
    }

    return MOCK_RESPONSES.default;
};
