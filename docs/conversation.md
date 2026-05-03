# Market Scout Agent: Architecture & Workflow Q&A

This document contains a complete record of our architectural discussion regarding the Market Scout Agent pipeline, caching mechanisms, search integrations, and multi-LLM workflows.

---

### 1. How the Caching System Works (The 2 Layers of Memory)

Based on the exact code in the project, the system uses **two different caching systems** working together to save time and API costs:

#### The Search API Cache (1 Hour Expiration)
When you type a company name and trigger a web search, the search results (the list of URLs returned by Tavily or DuckDuckGo) are cached in your computer's memory.
* **How long it lasts:** Exactly **1 Hour** (`3600` seconds).
* **Where is it stored?** In your computer's **RAM**. If you restart the server, this is completely wiped.
* **What happens if you search again immediately?** If you search for the exact same company within that 1 hour, your agent doesn't even make an API call to Google/Tavily. It instantly returns the exact same list of URLs it found a few minutes ago.

#### The ChromaDB Content Cache (Permanent until deleted)
Once the Search API gives your agent a list of URLs, the agent checks the `chroma_db` folder. 
* **How it works:** It uses the URL itself as the ID. 
* **Where is it stored?** On your **Hard Disk** (inside the `chroma_db` folder). Survives computer reboots.
* **If it's an old URL:** If the agent has scraped that exact URL before, it is stored in `chroma_db` forever. The agent will instantly load the scraped text from `chroma_db` instead of visiting the website again.
* **If it's a NEW URL:** The agent will scrape the new website, summarize it, and then save it to `chroma_db` for the future.

**Real-World Example (Searching for "Tesla"):**
* **Server Restart:** Memory is wiped.
* **You search "Tesla":** Search Cache misses. It calls the Tavily API and gets a list of 10 URLs.
* **The Agent checks ChromaDB:** Because ChromaDB is saved on your hard drive, it still remembers those 10 URLs from yesterday! 
* **The Result:** It instantly loads the text for those 10 URLs from your hard drive, successfully avoiding the slow and heavy process of visiting and scraping those 10 websites all over again.

---

### 2. How the Tavily Search Engine Works

**Where does the Input come from?**
The input journey starts in `app/services/scan_pipeline.py`. When you type a competitor's name, the system generates specific search queries and feeds them into `search_web_multi(query)`.

**How does the "Date-Wise" filtering work?**
The magic happens in the payload sent to Tavily: `"days": 7`. Tavily's AI search engine natively supports time-filtering. By sending `"days": 7`, you are officially instructing Tavily's servers: *"Do not even look at an article if it was published 8 days ago."* Because of this one line, every single URL Tavily returns is guaranteed to be from the last 7 days.

**How does Tavily know the date without visiting the page?**
Tavily already visited those websites before you even asked. 24 hours a day, Tavily has bots continuously reading the internet. They scrape the hidden HTML metadata timestamps and save everything into a massive database. When your agent searches, it is just doing a database lookup inside Tavily's massive "spreadsheet".

**The DuckDuckGo Fallback:**
If Tavily's database fails (e.g., it doesn't have enough recent articles), the agent automatically switches over to DuckDuckGo, does a live HTML scrape of DuckDuckGo's search results, and pulls the URLs from there instead.

---

### 3. How the Multi-LLM Waterfall Works (Ollama, Groq, Gemini)

The project uses a standard "decoupled" Multi-Agent architecture:

1. **The "Safety Net" (Fallbacks):**
   For summarizing individual articles, the system uses a "Waterfall" system:
   * It tries to use **Ollama** first (local, free).
   * If Ollama fails or crashes, it automatically switches to **Groq**.
   * If Groq's API is down, it automatically switches to **Gemini**.
   This ensures the pipeline never breaks, even if the local computer is struggling.

2. **The "Heavy Lifting" (The Final Report):**
   Ollama is great for summarizing *one* article at a time. But at the very end of the pipeline, the agent has to take 10 or 15 different summaries, combine them all together, and write one massive, beautiful Final Report. 
   Gemini 2.5 Flash has a massive Context Window. The codebase uses Gemini specifically for the **Final Report Generator** because it is much smarter at connecting the dots between 15 different articles to write a cohesive, professional SaaS report.

---

### 4. Step-by-Step Architectural Workflow

Here is the complete workflow of the Market Scout Agent:

1. **The User Request (Frontend UI):** User types a competitor's name and clicks "Live Monitor".
2. **Query Planning (The Strategy Phase):** The backend uses `query_planner.py` to generate 8 highly specific Google search queries.
3. **Web Search & The 1-Hour Cache:** The backend hands those queries to `search_service.py` (Tavily). It checks the RAM cache first. If it's a new search, it asks Tavily for URLs from the last 7 days.
4. **The Vector Memory Check (ChromaDB):** Before visiting websites, it checks if the URLs are already saved locally in `chroma_db`.
5. **Web Scraping (Data Extraction Phase):** New URLs are passed to `scraper_service.py`. It uses Firecrawl or Crawl4AI to download the raw HTML and extract the text.
6. **Content Filtering (Noise Reduction):** The text goes through `filter_content_technical_only()`. Using hardcoded Python Regex, it drops marketing fluff or job postings, keeping only technical/SaaS data.
7. **Multi-LLM Analysis & Synthesis (The Brain Phase):**
   * **Path A (For the UI Dashboard):** The LLM outputs a strict JSON Object (`ScanResponse`) categorizing every update.
   * **Path B (For Email Alerts):** The LLM writes a beautifully formatted Markdown Text Document mapping out the 7 days of activity.
8. **The GitHub Integration:** Concurrently, the agent checks the official GitHub API for the competitor's repositories to see if there are new commits in the last 7 days.
9. **Database Storage (MongoDB):** The finalized JSON `ScanResponse` is saved into MongoDB as a permanent historical vault (Not a cache).
10. **The Frontend Render:** The backend ships the JSON data to the React frontend (`IntelligenceReportPage.tsx`). The frontend renders the Velocity Waves chart, Threat Level badges, and the interactive scrolling timeline.

---

### 5. Future Improvements Discussed

**Making Query Generation Dynamic:**
Currently, `query_planner.py` uses hardcoded strings (e.g., `"Company" API changelog`). We discussed using Groq/Gemini to dynamically identify the company's industry (e.g., EdTech vs SaaS) and generate custom queries (e.g., `"PhysicsWallah new batch launch"` instead of API changelogs).

**Making Scraper Filtering Dynamic:**
Currently, `scraper_service.py` uses hardcoded Regex containing words like `api`, `sdk`, `endpoint`. We discussed using an LLM to dynamically generate industry-specific keywords to filter the scraped articles, ensuring non-tech companies don't get accidentally filtered out.
