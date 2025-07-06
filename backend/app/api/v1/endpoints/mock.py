from typing import Dict, Any, Optional, List
from fastapi import APIRouter, HTTPException, BackgroundTasks
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
import asyncio
import json
import time
import uuid
from datetime import datetime, date
from app.models.schemas.requests import (
    GenerationRequest,
    RetrievalRequest,
    DocumentFilter,
)
from app.models.schemas.search_response import (
    SearchResponse,
    SearchResultItem,
    ChunkMetadata,
)
from app.api.v1.schemas.document import DocumentResponse, DocumentChunkResponse
from app.utils.logging_setup import create_logger

router = APIRouter()
logger = create_logger(__name__)

# Mock data for simulation
MOCK_DOCUMENTS = [
    {
        "id": 1,
        "title": "PIPING BASIS OF DESIGN",
        "content": "Guidelines for The Avoidance of Vibration Induced Fatigue Failure in Process Pipework. (HSE & MTD Issue). EI 1, 1 = Model Code of Safe Practice, Part 1, 8th edition, June 2010. EI 15, 1 = Model Code of Safe Practice, Part 15, 4th edition, June 2015. EI 19, 1 = Model Code of Safe Practice - Part 19: Fire Precautions at Petroleum",
        "department": "design",
        "document_type": "PDF",
        "division": "piping",
        "document_nature": "Technical",
        "author": "COMPANY_NAME",
        "created_at": "2024-01-15",
        "page": 119,
    },
    {
        "id": 2,
        "title": "PIPING BASIS OF DESIGN",
        "content": "Extra precautions shall be taken for two-phase flow. Particularly if the flow pattern is intermittent (slug or plug flow), the piping system shall be subjected to dynamic excitation forces. The piping system including the smallbore piping subjected to two phase flow shall be stress analysed and adequately supported against intermittent slug loads based on the recommendations of the stress calculations. Piping upstream and downstream of devices which may imply excessive vibration (such as anti-surge valves, choke valves, etc.,) shall comprise straight length on each side if the device of at least two diameters or 0.6 m whichever is the greater. Supports shall be installed on each side and as close as possible of such device and shall be verified with appropriate stress/vibration analysis. The Contractor's procedure for the identification and treatment of lines subject to vibration shall be based on the Energy Institute's 'Guidelines for The Avoidance of Vibration Induced Fatigue Failure in Process Pipework'.",
        "department": "design",
        "document_type": "PDF",
        "division": "piping",
        "document_nature": "Technical",
        "author": "COMPANY_NAME",
        "created_at": "2024-02-20",
        "page": 11,
    },
    {
        "id": 3,
        "title": "PIPING BASIS OF DESIGN",
        "content": "a) Safety valves shall be accessible. Wherever feasible, they should be located at platforms which are designed for other purposes. Safety valves with a centreline elevation over 2m above high point of finished surface shall be accessible from a platform. b) Pressure safety valves shall be mounted as close as possible to the equipment or pressure systems being protected. c) For safety valves where the outlet line connected to the flare header, the safety valve outlet shall be self-draining into the flare header. All branch connections shall be connected to the top of the main header. The upstream side of safety valves shall be free draining to the process side d) The low point of outlet piping of safety valve discharging to atmosphere (applicable for nonhydrocarbon service) shall be provided with a weep hole of 10mm diameter to ensure complete removal of all liquids accumulated in the discharge piping system. e) Safety valve discharge piping shall be designed to withstand the dead loads and the blowoff loads. Blow-off design loads shall consider the most severe case, such as possible flashing conditions and liquid entrainment in vapour flows. f) Inlet lines to safety valves and de-pressuring valves shall be self-draining to the process equipment. g) Spring-loaded and pilot-operated or assisted safety valves as well as thermal expansion valves shall always be installed in the upright position. Liquid shall be drained from the valve both at the valve inlet and outlet. h) The requirement of interlocking (castle or equivalent type lock and key arrangement) of inlet and outlet block valves to prevent accidental violation of valve operation shall be as specified in P & IDs.",
        "department": "design",
        "document_type": "PDF",
        "division": "piping",
        "document_nature": "Standard",
        "author": "COMPANY_NAME",
        "created_at": "2024-03-10",
        "page": 71,
    },
    {
        "id": 4,
        "title": "Environmental Compliance Report",
        "content": "Environmental impact assessment and compliance report covering waste management, emission controls, and sustainability measures.",
        "department": "Environmental",
        "document_type": "PDF",
        "division": "HSE",
        "document_nature": "Report",
        "author": "COMPANY_NAME",
        "created_at": "2024-04-05",
        "page": 3,
    },
    {
        "id": 5,
        "title": "Project Management Guidelines",
        "content": "Comprehensive project management guidelines including planning methodologies, resource allocation, and milestone tracking procedures.",
        "department": "Project Management",
        "document_type": "PDF",
        "division": "PM Office",
        "document_nature": "Guideline",
        "author": "COMPANY_NAME",
        "created_at": "2024-05-12",
        "page": 1,
    },
]


class MockProcessStatus(BaseModel):
    task_id: str = Field(..., description="Unique task identifier")
    status: str = Field(..., description="Current status of the task")
    progress: int = Field(..., description="Progress percentage (0-100)")
    message: str = Field(..., description="Current status message")
    created_at: datetime = Field(..., description="Task creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")


class MockUploadResponse(BaseModel):
    document_id: int = Field(..., description="Generated document ID")
    filename: str = Field(..., description="Original filename")
    task_id: str = Field(..., description="Background processing task ID")
    status: str = Field(..., description="Initial status")
    message: str = Field(..., description="Status message")


# In-memory storage for mock tasks
mock_tasks: Dict[str, MockProcessStatus] = {}


def create_mock_search_results(
    query: str, request: RetrievalRequest
) -> List[SearchResultItem]:
    """Create mock search results based on query"""
    results = []

    # Simple keyword matching for demonstration
    query_lower = query.lower()
    query_words = query_lower.split()

    for doc in MOCK_DOCUMENTS:
        score = 0.0

        # Calculate mock similarity score based on content relevance
        # Be more generous with scoring to ensure we get results
        if "safety" in query_lower and (
            "safety" in doc["content"].lower() or "valve" in doc["content"].lower()
        ):
            score += 0.8
        if "pipeline" in query_lower and (
            "piping" in doc["content"].lower() or "pipeline" in doc["content"].lower()
        ):
            score += 0.8
        if "vibration" in query_lower and "vibration" in doc["content"].lower():
            score += 0.9
        if "maintenance" in query_lower and (
            "maintenance" in doc["content"].lower()
            or "procedure" in doc["content"].lower()
        ):
            score += 0.8

        # General keyword matching with more generous scoring
        if query_lower in doc["title"].lower():
            score += 0.6
        if query_lower in doc["content"].lower():
            score += 0.5
        
        # Check for any word matches
        word_matches = sum(1 for word in query_words if word in doc["content"].lower() or word in doc["title"].lower())
        if word_matches > 0:
            score += 0.3 + (word_matches * 0.1)

        # Always give at least some base score for variety
        score += 0.2

        # Add some randomness for realistic scores
        import random
        score += random.uniform(0.05, 0.15)
        score = min(score, 1.0)
        
        # Apply filters if provided
        if request.filters:
            if (
                request.filters.department
                and doc["department"] != request.filters.department
            ):
                continue
            if (
                request.filters.document_type
                and doc["document_type"] != request.filters.document_type
            ):
                continue
            if request.filters.division and doc["division"] != request.filters.division:
                continue
            if (
                request.filters.document_nature
                and doc["document_nature"] != request.filters.document_nature
            ):
                continue
            if request.filters.date_from:
                doc_date = datetime.strptime(doc["created_at"], "%Y-%m-%d").date()
                if doc_date < request.filters.date_from:
                    continue
            if request.filters.date_to:
                doc_date = datetime.strptime(doc["created_at"], "%Y-%m-%d").date()
                if doc_date > request.filters.date_to:
                    continue

        if score >= request.min_score:
            results.append(
                SearchResultItem(
                    score=score,
                    content=doc["content"],
                    metadata=ChunkMetadata(
                        chunk_id=4000
                        + doc["id"] * 100
                        + random.randint(1, 99),  # Generate realistic chunk IDs
                        document_id=doc["id"],
                        document_page=doc["page"],
                        uuid=str(uuid.uuid4()),
                        document_type=doc["document_type"],
                        department=doc["department"],
                        division=doc["division"],
                        document_nature=doc["document_nature"],
                        created_at=datetime.strptime(doc["created_at"], "%Y-%m-%d"),
                    ),
                )
            )

    # Sort by score descending
    results.sort(key=lambda x: x.score, reverse=True)
    return results


async def simulate_generation_stream_v2(query: str, contexts: List[Dict]):
    """Enhanced streaming generation response with more realistic formatting and timing"""

    # First, send all contexts at once in the exact format the real backend uses
    contexts_data = {"type": "contexts", "contexts": contexts, "query": query}
    yield f"data: {json.dumps(contexts_data)}\n\n"

    # Add delay before starting answer generation
    await asyncio.sleep(0.3)

    # Enhanced mock generated responses with professional technical formatting
    base_responses = {
        "safety": "## Safety Analysis Based on Retrieved Documentation\n\nBased on the safety procedures manual and technical specifications, the following key safety protocols apply:\n\n### Essential Safety Requirements\n\n**Equipment Inspection Protocols:**\n- Pre-operation visual inspections following standardized checklists\n- Functional testing of all safety systems before startup\n- Documentation of inspection results in maintenance logs\n\n**Lockout/Tagout (LOTO) Procedures:**\n- Mandatory energy isolation before any maintenance work\n- Multi-person verification of isolation points\n- Personal locks and tags for each maintenance worker\n\n**Personal Protective Equipment (PPE):**\n- Hard hats, safety glasses, and steel-toed boots are mandatory\n- Chemical-resistant gloves for hazardous material handling\n- Fall protection harnesses for work at heights\n\n**Communication and Emergency Protocols:**\n- Clear radio communication procedures during operations\n- Visual signaling systems for noisy environments\n- Established evacuation routes and muster points\n- Emergency response team contact information\n\n### Regulatory Compliance\n\nAll safety procedures must comply with HSE guidelines, OSHA standards, and local regulatory requirements. Regular safety audits and training updates ensure continued compliance.",
        
        "pipeline": "## Pipeline Maintenance and Safety Procedures\n\nPipeline maintenance operations require strict adherence to safety and technical procedures:\n\n### System Preparation\n\n**Isolation and Depressurization:**\n- Complete system depressurization following established procedures\n- Installation of blind flanges at isolation points\n- Verification of zero energy state using calibrated instruments\n\n**Testing and Verification:**\n- Hydrostatic testing at 1.5x design pressure per ASME B31.3\n- Pressure hold tests for minimum 4-hour duration\n- Documentation of all test results and certifications\n\n### Work Execution\n\n**Confined Space Entry:**\n- Continuous atmospheric monitoring for H2S, LEL, and oxygen levels\n- Forced ventilation systems with backup power\n- Emergency rescue equipment and trained personnel on standby\n\n**Welding and NDT:**\n- Only qualified welders using approved WPS procedures\n- Radiographic or ultrasonic inspection of critical welds\n- Third-party inspection and certification where required\n\n### Documentation and Compliance\n\nAll work must follow Energy Institute guidelines for vibration-induced fatigue failure prevention. Complete maintenance records, test certificates, and as-built drawings must be maintained.",
        
        "technical": "## Technical Specifications and Installation Requirements\n\nEngineering documentation establishes the following technical standards:\n\n### Instrumentation and Calibration\n\n**Accuracy Requirements:**\n- All process instruments calibrated to ±0.1% accuracy\n- Traceability to NIST standards through certified calibration labs\n- Calibration certificates valid for maximum 12 months\n\n**Installation Standards:**\n- Equipment mounted per NEMA 4X/IEC IP66 ratings for outdoor service\n- Proper environmental protection including weatherproof enclosures\n- Seismic mounting per local building codes where applicable\n\n### Maintenance and Quality Assurance\n\n**Preventive Maintenance:**\n- Critical equipment: Monthly inspections and quarterly maintenance\n- Non-critical equipment: Quarterly inspections and semi-annual maintenance\n- Predictive maintenance using vibration analysis and thermography\n\n**Testing and Commissioning:**\n- Factory Acceptance Testing (FAT) witnessed by owner representatives\n- Site Acceptance Testing (SAT) following approved test procedures\n- Performance testing under actual operating conditions\n\n### Code Compliance\n\nAll installations must meet applicable standards including ASME, API, IEEE, ISA, and local electrical codes. Design calculations and certifications must be sealed by licensed professional engineers.",
        
        "vibration": "## Vibration Analysis and Monitoring Systems\n\nVibration monitoring procedures based on Energy Institute guidelines and ISO standards:\n\n### Baseline Establishment\n\n**Initial Measurements:**\n- Comprehensive vibration signature recording for all rotating equipment\n- Three-axis measurements at bearing locations\n- Frequency spectrum analysis to establish baseline characteristics\n\n**Equipment Classification:**\n- Critical equipment: Continuous online monitoring\n- Essential equipment: Weekly portable measurements\n- General equipment: Monthly vibration surveys\n\n### Monitoring Thresholds\n\n**Alarm Settings per ISO 10816:**\n- Alert level: 4.5mm/s RMS velocity\n- Alarm level: 7.1mm/s RMS velocity\n- Trip level: 11.2mm/s RMS velocity\n\n**Analysis Techniques:**\n- FFT analysis for bearing defect identification\n- Phase analysis for unbalance and misalignment detection\n- Trend analysis for degradation monitoring\n\n### Corrective Actions\n\n**Response Procedures:**\n- Immediate investigation of alert level exceedances\n- Controlled shutdown for alarm level conditions\n- Emergency shutdown for trip level vibrations\n- Root cause analysis and corrective action implementation\n\n**Documentation Requirements:**\n- Monthly trend analysis reports\n- Corrective action records with root cause analysis\n- Equipment history files with all vibration data",
        
        "valve": "## Safety Valve Installation and Maintenance Standards\n\nSafety valve procedures per ASME Section I/VIII and API standards:\n\n### Installation Requirements\n\n**Accessibility and Mounting:**\n- Safety valves with centerline elevation >2m must have platform access\n- Platforms designed for maintenance activities with proper guardrails\n- Valves mounted as close as possible to protected equipment\n\n**Piping Configuration:**\n- Outlet lines must be self-draining to flare header systems\n- Branch connections made from top of main header only\n- Upstream piping designed for free drainage to process equipment\n\n### Drainage and Environmental Protection\n\n**Weep Hole Requirements:**\n- 10mm diameter weep holes at low points for non-hydrocarbon service\n- Strategic placement to prevent liquid accumulation\n- Regular inspection and cleaning to prevent blockage\n\n**Structural Design:**\n- Discharge piping designed for dead loads and dynamic blow-off forces\n- Consideration of flashing conditions and liquid entrainment\n- Adequate support and anchoring per piping stress analysis\n\n### Operational Requirements\n\n**Valve Orientation:**\n- Spring-loaded and pilot-operated valves installed in upright position\n- Proper drainage from both inlet and outlet connections\n- Thermal expansion provisions per manufacturer recommendations\n\n**Safety Interlocks:**\n- Castle-type locks on inlet and outlet block valves\n- Key exchange systems to prevent simultaneous valve operation\n- Clear procedural requirements per P&ID specifications",
        
        "environmental": "## Environmental Compliance and Sustainability Management\n\nEnvironmental management procedures and regulatory compliance requirements:\n\n### Waste Management Systems\n\n**Waste Classification and Handling:**\n- Segregated collection systems with proper labeling\n- Hazardous waste storage in compliant facilities\n- Licensed disposal through certified waste management contractors\n\n**Documentation and Tracking:**\n- Waste manifests and chain of custody records\n- Annual waste generation reports\n- Waste minimization and recycling program metrics\n\n### Emission Monitoring and Control\n\n**Continuous Monitoring:**\n- Real-time data logging systems for stack emissions\n- Opacity monitors for particulate emissions\n- CEMS calibration and QA/QC procedures per EPA requirements\n\n**Reporting and Compliance:**\n- Quarterly emission reports to regulatory agencies\n- Annual compliance certifications\n- Exceedance notifications within required timeframes\n\n### Water Management\n\n**Effluent Quality Control:**\n- Continuous monitoring per NPDES permit conditions\n- Laboratory analysis using EPA-approved methods\n- pH, BOD, TSS, and specific pollutant monitoring\n\n**Spill Prevention:**\n- Secondary containment systems for storage tanks\n- Spill response equipment and trained personnel\n- Regular inspection and maintenance of containment systems\n\n### Sustainability Initiatives\n\n**Energy Efficiency:**\n- Energy audits and efficiency improvement programs\n- Carbon footprint monitoring and reduction targets\n- Renewable energy integration where feasible",
        
        "project": "## Project Management Best Practices and Standards\n\nProject management guidelines following PMI standards and industry best practices:\n\n### Project Planning and Initiation\n\n**Work Breakdown Structure (WBS):**\n- Detailed decomposition of project deliverables\n- Resource allocation and responsibility assignment\n- Critical path analysis using CPM/PERT techniques\n\n**Risk Management:**\n- Comprehensive risk register with probability/impact assessment\n- Risk mitigation strategies and contingency planning\n- Regular risk review meetings with stakeholder involvement\n\n### Resource Management\n\n**Resource Optimization:**\n- Resource leveling to minimize peak demand\n- Skills matrix and training needs assessment\n- Subcontractor qualification and performance monitoring\n\n**Budget and Schedule Control:**\n- Earned value management (EVM) for progress tracking\n- Regular variance analysis and corrective action\n- Change control procedures with impact assessment\n\n### Quality Assurance\n\n**Quality Control Checkpoints:**\n- Gate reviews at each major project milestone\n- Independent quality audits and assessments\n- Lessons learned documentation and knowledge transfer\n\n**Communication Management:**\n- Weekly progress reports to all stakeholders\n- Monthly steering committee meetings\n- Project dashboard with key performance indicators\n\n### Project Closeout\n\n**Documentation and Handover:**\n- Complete project deliverable documentation\n- As-built drawings and O&M manuals\n- Warranty and maintenance information transfer\n- Post-project evaluation and lessons learned sessions"
    }

    # Determine response based on query keywords with enhanced matching
    response_text = None
    query_lower = query.lower()

    # Multi-keyword matching with priority scoring
    keyword_scores = {}
    for keyword, response in base_responses.items():
        score = 0
        if keyword in query_lower:
            score += 10
        # Check for related terms
        related_terms = {
            "safety": ["safe", "hazard", "risk", "protection", "emergency"],
            "pipeline": ["pipe", "piping", "line", "flow", "pressure"],
            "technical": ["specification", "standard", "requirement", "design"],
            "vibration": ["vibrate", "oscillation", "resonance", "dynamic"],
            "valve": ["safety valve", "relief", "pressure", "control"],
            "environmental": ["environment", "emission", "waste", "compliance"],
            "project": ["management", "planning", "schedule", "milestone"]
        }
        
        if keyword in related_terms:
            for term in related_terms[keyword]:
                if term in query_lower:
                    score += 2
        
        if score > 0:
            keyword_scores[keyword] = score
    
    if keyword_scores:
        # Use the highest scoring keyword's response
        best_keyword = max(keyword_scores.keys(), key=lambda k: keyword_scores[k])
        response_text = base_responses[best_keyword]
    else:
        # Enhanced default response based on available contexts
        if contexts and len(contexts) > 0:
            response_text = f"## Analysis Based on Retrieved Documentation\n\nBased on the {len(contexts)} relevant document sections retrieved from the technical knowledge base, here's the analysis for your query: **'{query}'**\n\n### Key Findings\n\n"
            
            # Extract key information from contexts
            for i, ctx in enumerate(contexts[:3], 1):
                content = ctx.get('content', '')[:200]
                dept = ctx.get('metadata', {}).get('department', 'Unknown')
                doc_type = ctx.get('metadata', {}).get('document_type', 'Document')
                
                response_text += f"**Source {i} ({dept} - {doc_type}):**\n{content}...\n\n"
            
            response_text += "### Technical Assessment\n\nThe retrieved documents contain detailed technical specifications, procedural guidelines, and safety requirements that directly address your query. The information includes:\n\n- Specific implementation details and step-by-step procedures\n- Regulatory compliance requirements and industry standards\n- Best practices from established engineering and safety protocols\n- Quality assurance and testing methodologies\n\n### Recommendations\n\nBased on the document analysis, ensure all procedures follow the established guidelines and maintain proper documentation for compliance and audit purposes."
        else:
            response_text = f"## Query Analysis: '{query}'\n\n### Search Results\n\nNo specific documents were found matching your exact query terms. However, our technical knowledge base contains comprehensive information on related topics including:\n\n- Safety procedures and risk management protocols\n- Technical specifications and design standards\n- Maintenance guidelines and best practices\n- Regulatory compliance requirements\n\n### Suggestions\n\nTry refining your search with more specific technical terms or browse our document categories for related information."

    # Add metadata about the analysis if contexts are available
    if contexts:
        avg_score = sum(ctx.get('score', 0) for ctx in contexts) / len(contexts)
        response_text += f"\n\n### Source Analysis Summary\n\n- **Documents Retrieved:** {len(contexts)} relevant sections\n- **Average Relevance Score:** {avg_score:.1%}\n- **Source Types:** Technical specifications, safety procedures, and maintenance guidelines\n- **Quality Assessment:** High relevance match with comprehensive technical detail"

    # Simulate realistic streaming with natural text flow
    # Split intelligently at sentence boundaries and logical breaks
    import re
    
    # Split on various natural break points while preserving structure
    patterns = [
        r'(\n#{1,3}\s)',  # Headers
        r'(\n\*\*[^*]+\*\*\n)',  # Bold section titles
        r'([.!?]\s+)',  # Sentence ends
        r'(\n-\s)',  # List items
        r'(\n\n)',  # Paragraph breaks
    ]
    
    chunks = [response_text]
    for pattern in patterns:
        new_chunks = []
        for chunk in chunks:
            parts = re.split(pattern, chunk)
            new_chunks.extend([part for part in parts if part.strip()])
        chunks = new_chunks
    
    # Combine very short chunks to avoid excessive fragmentation
    final_chunks = []
    current_chunk = ""
    
    for chunk in chunks:
        current_chunk += chunk
        # Yield when we reach a reasonable chunk size or natural break
        if (len(current_chunk) > 50 and 
            (chunk.endswith('\n\n') or chunk.endswith('. ') or 
             chunk.startswith('\n#') or len(current_chunk) > 150)):
            final_chunks.append(current_chunk)
            current_chunk = ""
    
    if current_chunk:
        final_chunks.append(current_chunk)

    # Stream the chunks with realistic delays that simulate AI processing
    for i, chunk in enumerate(final_chunks):
        if chunk.strip():  # Only yield non-empty chunks
            chunk_data = {"type": "answer", "content": chunk if i == 0 else chunk}
            yield f"data: {json.dumps(chunk_data)}\n\n"

            # Variable delays based on content type and length
            if i < len(final_chunks) - 1:
                base_delay = 0.1
                
                # Longer delay for headers and section breaks
                if chunk.startswith('\n#') or '**' in chunk:
                    base_delay = 0.3
                # Medium delay for list items
                elif chunk.startswith('\n-') or chunk.startswith('- '):
                    base_delay = 0.2
                # Scale with content length
                length_factor = min(len(chunk) * 0.008, 0.5)
                
                total_delay = base_delay + length_factor
                await asyncio.sleep(min(total_delay, 0.8))  # Cap at 0.8 seconds

    # Send final empty content to indicate completion
    final_data = {"type": "answer", "content": ""}
    yield f"data: {json.dumps(final_data)}\n\n"


async def simulate_document_processing(task_id: str, filename: str):
    """Simulate document processing pipeline"""

    # Update task status through different stages
    stages = [
        (10, "Uploading document..."),
        (25, "Extracting text content..."),
        (50, "Chunking document into segments..."),
        (75, "Generating embeddings..."),
        (90, "Storing in vector database..."),
        (100, "Processing completed successfully!"),
    ]

    for progress, message in stages:
        mock_tasks[task_id].progress = progress
        mock_tasks[task_id].message = message
        mock_tasks[task_id].status = "completed" if progress == 100 else "processing"
        mock_tasks[task_id].updated_at = datetime.now()
        await asyncio.sleep(2)  # Simulate processing time


@router.post("/mock/retrieval/search", response_model=SearchResponse)
async def mock_search_similar(request: RetrievalRequest) -> SearchResponse:
    """
    Mock endpoint for document similarity search
    """
    try:
        results = create_mock_search_results(request.query, request)

        # Apply pagination
        total_results = len(results)
        paginated_results = results[request.offset : request.offset + request.limit]

        return SearchResponse(
            query=request.query,
            results=paginated_results,
            total_count=total_results,
            offset=request.offset,
            limit=request.limit,
        )

    except Exception as e:
        logger.error(f"Error in mock search: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Mock search failed: {str(e)}")


@router.post("/mock/generation/generate")
async def mock_generate_response(request: GenerationRequest):
    """
    Mock endpoint for LLM generation with streaming response
    """
    try:  # First, simulate retrieval of relevant contexts
        retrieval_req = RetrievalRequest(
            query=request.query,
            limit=request.num_chunks,
            min_score=request.min_score,
            filters=request.filters,
        )

        search_results = create_mock_search_results(request.query, retrieval_req)
        
        # Debug logging to see what's happening
        logger.info(f"Query: {request.query}")
        logger.info(f"Search results count: {len(search_results)}")
        logger.info(f"Min score filter: {request.min_score}")
        
        # Ensure we always have some results for demo purposes
        if not search_results:
            logger.warning("No search results found, using default documents")
            # Create default results with lower min_score
            retrieval_req_fallback = RetrievalRequest(
                query=request.query,
                limit=request.num_chunks,
                min_score=0.0,  # Use 0.0 to get any results
                filters=request.filters,
            )
            search_results = create_mock_search_results(request.query, retrieval_req_fallback)
            
            # If still no results, create some basic ones
            if not search_results:
                logger.warning("Still no results, creating basic mock results")
                search_results = []
                for i, doc in enumerate(MOCK_DOCUMENTS[:request.num_chunks]):
                    search_results.append(
                        SearchResultItem(
                            score=0.7 - (i * 0.1),  # Decreasing scores
                            content=doc["content"],
                            metadata=ChunkMetadata(
                                chunk_id=4000 + doc["id"] * 100 + 50,
                                document_id=doc["id"],
                                document_page=doc["page"],
                                uuid=str(uuid.uuid4()),
                                document_type=doc["document_type"],
                                department=doc["department"],
                                division=doc["division"],
                                document_nature=doc["document_nature"],
                                created_at=datetime.strptime(doc["created_at"], "%Y-%m-%d"),
                            ),
                        )
                    )
        logger.info(f"Final search results count: {len(search_results)}")
        logger.info(f"Creating contexts from {len(search_results[: request.num_chunks])} results")
        
        # Create more realistic contexts that match the real backend format
        contexts = []
        for i, result in enumerate(search_results[: request.num_chunks]):
            # Generate realistic document names based on the content
            doc_names = [
                "1000482.1-ADD-SP-09-001_1_PIPING BASIS OF DESIGN.pdf",
                "HSE-SAF-001_Safety Procedures Manual_v2.1.pdf", 
                "ENG-STD-002_Technical Specifications_Rev3.pdf",
                "MAINT-PRO-005_Pipeline Maintenance Guide.pdf",
                "QAL-DOC-003_Quality Control Standards.pdf"
            ]
            
            # Generate realistic timestamps
            import random
            from datetime import timedelta
            base_date = datetime(2024, 1, 1)
            random_date = base_date + timedelta(days=random.randint(0, 365))
            
            context = {
                "content": result.content,
                "score": result.score,
                "metadata": {
                    "source_id": f"doc_{1000 + result.metadata.document_id}",
                    "chunk_id": str(result.metadata.chunk_id),
                    "document_type": result.metadata.document_type,
                    "department": result.metadata.department,
                    "division": result.metadata.division,
                    "created_at": random_date.isoformat(),
                    "processed_by": random.choice(["system_admin", "eng_team", "safety_officer", "doc_processor"]),
                    "relevance_score": result.score,
                    "extraction_method": random.choice(["auto_chunk", "manual_review", "ai_extraction"]),
                    "document_name": doc_names[i % len(doc_names)],
                    "document_page_no": result.metadata.document_page,
                },
            }
            contexts.append(context)

        # Return streaming response
        return StreamingResponse(
            simulate_generation_stream_v2(request.query, contexts),
            media_type="text/plain",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "Content-Type": "text/event-stream",
            },
        )

    except Exception as e:
        logger.error(f"Error in mock generation: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Mock generation failed: {str(e)}")


@router.post("/mock/documents/upload", response_model=MockUploadResponse)
async def mock_upload_document(
    background_tasks: BackgroundTasks,
    filename: str = "mock_document.pdf",
    department: str = "IT",
    document_type: str = "PDF",
    division: str = "Engineering",
    document_nature: str = "Technical",
):
    """
    Mock endpoint for document upload and processing
    """
    try:
        # Generate mock document ID and task ID
        document_id = len(MOCK_DOCUMENTS) + 1
        task_id = str(uuid.uuid4())

        # Create task status
        task_status = MockProcessStatus(
            task_id=task_id,
            status="processing",
            progress=0,
            message="Starting document processing...",
            created_at=datetime.now(),
            updated_at=datetime.now(),
        )

        mock_tasks[task_id] = task_status

        # Add background task to simulate processing
        background_tasks.add_task(simulate_document_processing, task_id, filename)

        # Add mock document to our collection
        new_doc = {
            "id": document_id,
            "title": filename.replace(".pdf", "").replace("_", " ").title(),
            "content": f"This is mock content for {filename}. It contains various information relevant to the {department} department.",
            "department": department,
            "document_type": document_type,
            "division": division,
            "document_nature": document_nature,
            "author": "COMPANY_NAME",
            "created_at": datetime.now().strftime("%Y-%m-%d"),
            "page": 1,
        }
        MOCK_DOCUMENTS.append(new_doc)

        return MockUploadResponse(
            document_id=document_id,
            filename=filename,
            task_id=task_id,
            status="processing",
            message="Document upload initiated successfully",
        )

    except Exception as e:
        logger.error(f"Error in mock upload: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Mock upload failed: {str(e)}")


@router.get("/mock/documents/task-status/{task_id}", response_model=MockProcessStatus)
async def mock_get_task_status(task_id: str):
    """
    Mock endpoint to check processing task status
    """
    if task_id not in mock_tasks:
        raise HTTPException(status_code=404, detail="Task not found")

    return mock_tasks[task_id]


@router.get("/mock/documents/list", response_model=List[Dict[str, Any]])
async def mock_list_documents(
    department: Optional[str] = None,
    document_type: Optional[str] = None,
    limit: int = 10,
    offset: int = 0,
):
    """
    Mock endpoint to list available documents
    """
    filtered_docs = MOCK_DOCUMENTS.copy()

    if department:
        filtered_docs = [
            doc for doc in filtered_docs if doc["department"] == department
        ]

    if document_type:
        filtered_docs = [
            doc for doc in filtered_docs if doc["document_type"] == document_type
        ]

    paginated_docs = filtered_docs[offset : offset + limit]

    return {
        "documents": paginated_docs,
        "total_count": len(filtered_docs),
        "offset": offset,
        "limit": limit,
    }


@router.delete("/mock/documents/delete/{document_id}")
async def mock_delete_document(document_id: int):
    """
    Mock endpoint to delete a document
    """
    global MOCK_DOCUMENTS
    original_count = len(MOCK_DOCUMENTS)
    MOCK_DOCUMENTS = [doc for doc in MOCK_DOCUMENTS if doc["id"] != document_id]

    if len(MOCK_DOCUMENTS) == original_count:
        raise HTTPException(status_code=404, detail="Document not found")

    return {"message": f"Document {document_id} deleted successfully"}


@router.get("/mock/analytics/dashboard")
async def mock_get_analytics():
    """
    Mock endpoint for system analytics
    """
    departments = {}
    document_types = {}

    for doc in MOCK_DOCUMENTS:
        dept = doc["department"]
        doc_type = doc["document_type"]

        departments[dept] = departments.get(dept, 0) + 1
        document_types[doc_type] = document_types.get(doc_type, 0) + 1

    return {
        "total_documents": len(MOCK_DOCUMENTS),
        "documents_by_department": departments,
        "documents_by_type": document_types,
        "active_tasks": len(
            [task for task in mock_tasks.values() if task.status == "processing"]
        ),
        "system_status": "operational",
        "last_updated": datetime.now().isoformat(),
    }


@router.post("/mock/embeddings/regenerate")
async def mock_regenerate_embeddings(background_tasks: BackgroundTasks):
    """
    Mock endpoint to regenerate embeddings for all documents
    """
    task_id = str(uuid.uuid4())

    task_status = MockProcessStatus(
        task_id=task_id,
        status="processing",
        progress=0,
        message="Starting embedding regeneration...",
        created_at=datetime.now(),
        updated_at=datetime.now(),
    )

    mock_tasks[task_id] = task_status

    # Simulate embedding regeneration process
    async def regenerate_process():
        stages = [
            (20, "Collecting document chunks..."),
            (40, "Generating new embeddings..."),
            (60, "Updating vector database..."),
            (80, "Rebuilding search index..."),
            (100, "Embedding regeneration completed!"),
        ]

        for progress, message in stages:
            mock_tasks[task_id].progress = progress
            mock_tasks[task_id].message = message
            mock_tasks[task_id].status = (
                "completed" if progress == 100 else "processing"
            )
            mock_tasks[task_id].updated_at = datetime.now()
            await asyncio.sleep(3)

    background_tasks.add_task(regenerate_process)

    return {
        "task_id": task_id,
        "message": "Embedding regeneration started",
        "estimated_duration": "15-20 minutes",
    }
