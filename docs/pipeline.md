# The Intelligence Pipeline (Sequence Diagram)

The Market Scout Engine operates autonomously via a tightly regulated data filtration sequence. Its primary purpose: convert raw, unstructured open-web content into a structured, hallucination-free technical intelligence report.

## The Agentic Sequence

Below is the complete execution timeline generated instantaneously upon triggering a "Scan" for a competitor node:

```mermaid
sequenceDiagram
    participant User as Next.js Dashboard
    participant API as FastAPI Backend
    participant Tavily as Tavily Search API
    participant Scraper as Firecrawl & Crawl4Ai
    participant Compression as LSA / Token Guard
    participant DB as MongoDB / ChromaDB
    participant LLM as LLaMA-3 / Gemini

    %% Start Scan
    User->>API: POST /scan (Target Competitor)
    activate API
    
    %% Step 1: Query Generation
    note over API, LLM: Step 1: Strategic Planning
    API->>LLM: Generate intent-driven search queries
    LLM-->>API: returns arrays (e.g. "Apple new features")
    
    %% Step 2: Discovery
    note over API, Tavily: Step 2: Open-Web Discovery
    API->>Tavily: Execute Google News & Web searches (last 7 days window)
    Tavily-->>API: return 20+ URLs mapping to competitor
    
    %% Step 3: Scraping & Date-Mapping
    note over API, Scraper: Step 3: Headless Deep Scraping
    API->>Scraper: Download raw HTML + Extract DOM Dates (Regex & itemprop)
    Scraper-->>API: Returns parsed strict markdown + exact publication dates
    
    %% Step 4: Content Validation & LSA Compression
    note over API, Compression: Step 4: Semantic Filtration & Compression
    API->>API: Discards URLs older than 7 days & enforces Regex Technical Filters
    API->>Compression: Compress text chunks using Latent Semantic Analysis (LSA)
    Compression->>DB: Store optimized context explicitly in ChromaDB Vector space
    
    %% Step 5: AI Synthesis
    note over API, LLM: Step 5: Hallucination-Safe Synthesis 
    API->>LLM: Pass surviving compressed chunks sequentially governed by JSON schema
    LLM-->>API: Return final structured features & predictive metrics
    
    %% Step 6: Delta Engine Verification
    note over API, DB: Step 6: Truth Enforcement & Delta Duplication
    API->>API: OVERRIDE LLM dates using strict scraped publication date Truth
    API->>API: Filter array via Delta Engine (MD5 content hash) to drop duplicates
    API->>DB: Append only strictly new/unseen verified features into `feature_updates`
    
    %% Response
    API-->>User: Streams Event / 200 OK JSON payload
    deactivate API
```

## Detailed Breakdown

### Step 1: Strategic Query Planning (`query_planner.py`)
The pipeline runs the LLM model (local Ollama or remote Gemini/Groq) to intelligently brainstorm targeted web-search requests based on the competitor's profile structure and industry sector.

### Step 2: Tavily Web Search (`search_service.py`)
Executes the brain-stormed query batch against live Internet Search engines. Results are aggressively filtered leveraging temporal indices (e.g. `qdr:w`) to strictly force the engine to only surface 7-day-old intelligence.

### Step 3: Deep Trafilatura / Firecrawl Scraping (`scraper_service.py`)
Each web result is systematically downloaded using intelligent fallback trees. It predominantly relies on `Firecrawl` parsing logic to strip arbitrary JS bundles and extract clean core content.
**CRITICAL:** It aggressively mines standard HTML meta tags, YouTube specific `itemprop` properties (e.g., `datePublished`), and dynamic DOM elements for truth-based publication dates avoiding subsequent LLM chronological hallucination.

### Step 4: Content Compression (`lsa_compressor.py` & `token_guard.py`)
Non-technical noise (e.g., jobs, marketing, funding) is stripped out entirely matching negative regex blocks. The surviving dataset is further semantically flattened leveraging an `LSA Compressor` script to keep extraction limits inside LLM processing thresholds, avoiding Context-Window explosion. Context is persisted transiently to ChromaDB caching.

### Step 5: Structuring & Model Invocation (`intel_pipeline.py`)
Distilled chunks hit the primary Language Model matching explicit Pydantic response Schemas. The model categorizes whether the update represents an `API`, `UI`, `Infrastructure`, `Security`, etc.

### Step 6: The Date Override & Delta Caching (`delta_engine.py`)
Before executing any actual database inserts (`scan_pipeline.py`), the agent maps originally harvested **Step 3 publication dates** actively overwriting any date the LLM incorrectly guessed/imprinted. Features are then securely hashed. If the user ran a scan yesterday, the Delta engine instantly drops already known features, returning exclusively fresh unseen competitor activity sequentially ordered by legitimate open-web publication dates.
