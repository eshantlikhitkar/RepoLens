# RepoLens AI — AI-Powered GitHub Repository Investigator

RepoLens AI is a production-quality MERN stack application designed for software engineers and engineering teams to connect GitHub, select any repository, and interact with an AI assistant that truly understands and investigates the codebase.

Instead of answering blindly or hallucinating, RepoLens AI runs a complete **Code-Aware Retrieval-Augmented Generation (RAG)** pipeline: it indexes repository file trees, filters noise, chunks code respecting function and block boundaries, computes vector embeddings, and cites actual files and line ranges with interactive jump-to-source navigation.

---

## 🚀 Key Features

* **🔐 Secure GitHub OAuth 2.0 Flow**: Minimum-scope authorization (`read:user`, `repo`). Server-side AES-256-GCM encryption of OAuth access tokens. Zero client-side token exposure.
* **⚡ 1-Click Demo / Offline Exploration**: Test the full platform instantly without configuring OAuth or external API keys using built-in realistic mock repositories and offline heuristic intelligence.
* **🌳 Interactive File Tree & Code Viewer**: Collapsible directory explorer with file icons, syntax highlighting (via Prism), line numbers, copy-to-clipboard, direct GitHub links, and clickable path breadcrumbs.
* **⚡ Quick File Switcher (Cmd+K / Ctrl+P)**: Fast keyboard-driven command palette for searching and opening files across large repositories instantly.
* **🔍 In-File Search (Cmd+F / Ctrl+F)**: Interactive in-file search overlay with match count, previous/next cycling, and illuminated table line highlights.
* **📍 Grounded Line-Level Citations**: Every AI claim links to exact file paths and line ranges (e.g. `src/controllers/authController.js:24-52`). Clicking a citation automatically switches files, centers the viewer, and illuminates the cited line range.
* **📥 Export Investigation Reports**: Download any active multi-turn AI investigation session with full question-and-answer transcripts and code citations as a structured Markdown (`.md`) report.
* **🧠 Code-Aware Semantic RAG**:
  * Configurable file filtering ignoring `node_modules`, binaries, build artifacts, and lockfiles.
  * Semantic chunking preserving top-level functions, classes, and markdown headings with line number offsets.
  * Vector embeddings (Google Gemini, OpenAI, or local normalized hashing).
  * Multi-tenant isolated MongoDB vector storage with cosine similarity and keyword-boosted hybrid search.
* **🗺️ Grounded Architecture Overview Map**: Automated synthesis of project type, technologies, frontend/backend separation, database, authentication pattern, entry points, and directory layout.
* **💬 Conversational Memory & SSE Streaming**: Full multi-turn dialog support persisted in MongoDB, streamed in real time with Server-Sent Events (SSE).
* **🛡️ Security & Prompt Injection Defense**: Code is strictly parsed as passive untrusted data, preventing injection attacks embedded in repository files.

---

## 🏗️ Architecture & RAG Pipeline

```text
                  GitHub API / Repository
                            │
                            ▼
                  Repository File Tree
                            │
                            ▼
              Smart Configurable File Filter
          (Excludes binaries, node_modules, dist)
                            │
                            ▼
                   Raw File Contents
                            │
                            ▼
                 Code-Aware Chunker
       (Functions, Classes, Blocks, 1-Indexed Lines)
                            │
                            ▼
                 Embedding Generator
            (Gemini / OpenAI / Local Hashing)
                            │
                            ▼
             MongoDB Isolated Vector Store
     (repositoryId + userId multi-tenant isolation)
                            │
                            │
User Question ──────────────┘
      │
      ▼
Query Expander (Technical Keywords & File Synonyms)
      │
      ▼
Vector Cosine Similarity & Keyword Boost
      │
      ▼
Top-K Relevant Code Chunks + Line Ranges
      │
      ▼
Strict AI System Prompt (Untrusted Data Delimiters)
      │
      ▼
LLM Inference (Gemini / OpenAI / Local Heuristic Engine)
      │
      ▼
Server-Sent Events (SSE) Streaming
      │
      ▼
Conversational Answer + Clickable Line Citations
```

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite, React Router 6, Tailwind CSS, Lucide Icons, PrismJS, React-Markdown, Remark-GFM, Axios |
| **Backend** | Node.js, Express.js, MongoDB, Mongoose |
| **Authentication** | GitHub OAuth 2.0, JSON Web Tokens (JWT), httpOnly Cookies, AES-256-GCM |
| **AI & Embeddings** | Google Gemini API (`@google/genai`, `gemini-2.5-flash`, `text-embedding-004`), OpenAI API (`gpt-4o-mini`, `text-embedding-3-small`), Local Fallback Engine |
| **Vector Storage** | MongoDB-backed Vector Engine with Normalized Cosine Similarity & Symbol Hybrid Scoring |
| **Security** | Helmet, Express-Rate-Limit, CORS with strict origin validation, AES-256 Token Encryption |

---

## 📂 Project Structure

```text
repolens-ai/
├── package.json               # Root scripts (dev, test, build, install)
├── start-dev.js               # Cross-platform development orchestrator
├── .env.example               # Root environment template
│
├── backend/
│   ├── package.json
│   ├── server.js              # Server entry point
│   ├── test-e2e.js            # Automated E2E integration test suite
│   ├── test-sse.js            # Automated SSE streaming test suite
│   └── src/
│       ├── app.js             # Express app setup, middlewares, routes
│       ├── config/
│       │   ├── db.js          # MongoDB connection
│       │   └── env.js         # Environment variables validation & defaults
│       ├── models/
│       │   ├── User.js        # User model with encrypted token methods
│       │   ├── Repository.js  # Repository metadata and indexing progress
│       │   ├── RepoChunk.js   # Code chunks, embeddings, and line metadata
│       │   └── Conversation.js# Multi-turn chat conversations and citations
│       ├── middleware/
│       │   ├── authMiddleware.js      # JWT verification & user injection
│       │   ├── errorMiddleware.js     # Centralized error handler
│       │   └── rateLimitMiddleware.js # API rate limiters
│       ├── services/
│       │   ├── github/        # GitHub API, OAuth, Tree, and Demo Data
│       │   ├── parser/        # File filtering and code-aware chunking
│       │   ├── embeddings/    # Gemini, OpenAI, and Local Embedding providers
│       │   ├── vector/        # VectorStore interface & MongoVectorStore
│       │   ├── ai/            # Gemini, OpenAI, and Mock AI service providers
│       │   ├── rag/           # Query expansion and RAG retrieval pipeline
│       │   └── repository/    # Multi-step indexing pipeline and overview generator
│       ├── controllers/       # Auth, Repository, Indexer, and Chat controllers
│       └── routes/            # REST API route handlers
│
└── frontend/
    ├── package.json
    ├── vite.config.js         # Vite configuration with API proxy
    ├── tailwind.config.js     # Developer dark-mode theme
    ├── src/
        ├── App.jsx            # React Router and route guards
        ├── main.jsx           # React DOM root
        ├── index.css          # Syntax styling and citation animations
        ├── components/
        │   ├── layout/        # Navbar, Footer
        │   ├── common/        # Badge, Modal, Toast
        │   ├── dashboard/     # RepositoryCard, Search, CustomRepoModal
        │   ├── repository/    # RepoHeader, FileTree, CodeViewer, IndexingProgress, OverviewModal
        │   └── chat/          # ChatWindow, ChatMessage, CitationChip, SuggestedPrompts, HistorySidebar
        ├── pages/             # LandingPage, DashboardPage, InvestigationPage, NotFoundPage
        ├── context/           # AuthContext, ToastContext
        └── services/          # API, AuthService, RepoService, ChatService
```

---

## ⚙️ Prerequisites

* **Node.js**: v18.0.0 or higher (v20+ recommended)
* **MongoDB**: A running local MongoDB instance (`mongodb://127.0.0.1:27017`) or MongoDB Atlas URI.
* **GitHub Account**: For GitHub OAuth (optional if using 1-Click Demo Mode).
* **Gemini or OpenAI API Key**: Optional (defaults to the built-in heuristic AI engine if not provided).

---

## 🚀 Quick Start (Running Locally)

### 1. Clone & Install Dependencies

```bash
git clone <repository_url> repolens-ai
cd repolens-ai

# Install backend and frontend dependencies
npm run install:all
```

### 2. Configure Environment Variables

Create `.env` inside `backend/` (or copy from `backend/.env.example`):

```bash
cp backend/.env.example backend/.env
```

Default settings in `backend/.env`:
```env
PORT=5001
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/repolens
CLIENT_URL=http://localhost:5173

# Optional: GitHub OAuth
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
GITHUB_CALLBACK_URL=http://localhost:5001/api/auth/github/callback

# Security Keys
JWT_SECRET=repolens_secure_jwt_secret_dev_key_849201938
ENCRYPTION_KEY=repolens_32_byte_aes_encryption_secret_key!

# AI Configuration (gemini | openai | mock)
AI_PROVIDER=gemini
EMBEDDING_PROVIDER=gemini

# Recommended AI API Key
GEMINI_API_KEY=your_gemini_api_key_here
```

> **Note on Zero Configuration**: If you leave `GITHUB_CLIENT_ID` and `GEMINI_API_KEY` empty, RepoLens AI automatically starts in **Offline / Demo Mode**, which includes full mock repositories, code viewers, vector embeddings, and citation generation!

### 3. Start MongoDB

If using macOS with Homebrew:
```bash
brew services start mongodb-community
```

### 4. Start the Application

From the root directory, start both frontend and backend concurrently:

```bash
npm run dev
```

* Frontend: `http://localhost:5173`
* Backend API: `http://localhost:5001`

---

## 🔑 Setting Up GitHub OAuth (Optional for Real GitHub Repos)

To authenticate with your actual GitHub account and inspect your private/public repositories:

1. Go to your GitHub profile: **Settings** → **Developer Settings** → **OAuth Apps** → **New OAuth App**.
2. Fill in the following details:
   * **Application name**: `RepoLens AI`
   * **Homepage URL**: `http://localhost:5173`
   * **Authorization callback URL**: `http://localhost:5001/api/auth/github/callback`
3. Click **Register Application**.
4. Generate a **Client Secret**.
5. Copy your **Client ID** and **Client Secret** into `backend/.env`:
   ```env
   GITHUB_CLIENT_ID=your_client_id_here
   GITHUB_CLIENT_SECRET=your_client_secret_here
   ```
6. Restart the backend server.

---

## 🧪 Running Automated Tests

RepoLens AI includes an automated end-to-end integration test suite and an SSE streaming test suite that verify the complete flow against a live database:

```bash
npm test
```

This verifies:
* MongoDB connection & Express healthcheck.
* User authentication and `/api/auth/me` verification.
* Repository listing, search, and selection.
* File tree retrieval and raw blob content fetching.
* Indexing pipeline execution (tree -> filter -> chunk -> embed -> store).
* Architecture Overview synthesis.
* Semantic vector retrieval and grounded AI answers.
* Precise line citation generation (`file:startLine-endLine`).
* Conversational memory and multi-turn persistence.
* Real-time Server-Sent Events (SSE) token streaming.
* Unauthorized request rejection (401).

---

## 📡 REST API Documentation

### Authentication

* `GET /api/auth/github`: Redirects to GitHub OAuth authorize screen.
* `GET /api/auth/github/callback`: Handles GitHub authorization code exchange, upserts user, sets session cookie.
* `GET /api/auth/me`: Returns sanitized authenticated user profile (`id`, `username`, `displayName`, `avatarUrl`).
* `POST /api/auth/demo`: 1-Click instant login for development and demo mode.
* `POST /api/auth/logout`: Clears session cookie and invalidates session.

### Repositories

* `GET /api/repositories`: Lists accessible repositories with indexing status, stars, forks, and language.
* `POST /api/repositories/select`: Registers a repository in the database.
* `GET /api/repositories/:id`: Retrieves repository details.
* `POST /api/repositories/:id/index`: Triggers repository indexing pipeline.
* `GET /api/repositories/:id/status`: Gets indexing status and progress metrics.
* `GET /api/repositories/:id/status/stream`: Server-Sent Events (SSE) stream of real-time indexing progress.
* `GET /api/repositories/:id/tree`: Fetches recursive file tree.
* `GET /api/repositories/:id/file?path=...`: Retrieves file content, line count, and language.
* `GET /api/repositories/:id/overview`: Retrieves generated architectural overview.

### AI Investigation & Chat

* `POST /api/repositories/:id/chat`: Investigates repository with RAG.
  * Request Body: `{ question: string, conversationId?: string, stream?: boolean }`
  * When `stream: true`, sends Server-Sent Events (`type: "citations"`, `type: "token"`, `type: "done"`).
* `GET /api/repositories/:id/conversations`: Lists previous investigations for this repository.
* `GET /api/conversations/:id`: Gets full conversation history with citations.
* `DELETE /api/conversations/:id`: Deletes a conversation thread.

---

## 🔒 Security Architecture

1. **Token Protection**: GitHub OAuth tokens are encrypted using **AES-256-GCM** before being written to MongoDB. The schema excludes the token by default (`select: false`), and it is **never** sent to the client browser.
2. **Multi-Tenant Repository Isolation**: Every repository, file chunk, search query, and conversation strictly checks `userId` from the verified JWT session. Users can never query or access another user's repository code.
3. **Prompt Injection Defense**: Repository content is treated as untrusted data. Context chunks are isolated using strict boundary delimiters (`--- BEGIN REPOSITORY FILE CHUNK ---`). The system prompt instructs the LLM never to follow instructions found inside code files or READMEs.
4. **Rate Limiting**: `express-rate-limit` enforces quotas on AI query endpoints (30 req/min) and repository indexing (10 req/5min) to prevent abuse and API exhaustion.

---

## 📄 License

MIT License. Designed and built with ❤️ by the RepoLens AI team.
