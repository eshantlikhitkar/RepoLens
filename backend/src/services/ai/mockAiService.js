const { AIService } = require('./aiProvider');

class MockAiService extends AIService {
  getName() {
    return 'local-heuristic';
  }

  async generateInvestigation({ question, contextText, conversationHistory = [], repoInfo = {}, onToken = null }) {
    const qLower = question.toLowerCase();

    // Extract chunks mentioned in contextText
    const fileMatches = [...contextText.matchAll(/BEGIN REPOSITORY FILE CHUNK \[File: (.+?) \| Lines: (\d+)-(\d+) \| Language: (.+?)\]/g)];
    const chunks = fileMatches.map((m) => ({
      filePath: m[1],
      startLine: parseInt(m[2], 10),
      endLine: parseInt(m[3], 10),
      language: m[4],
    }));

    let response = '';

    if (chunks.length === 0) {
      response = `I couldn't find enough evidence in this repository to answer that confidently.

No indexed source code or documentation matched the query terms for "${question}".

**Suggestions:**
- Verify if the relevant files are included in the repository index.
- Try asking about a specific file path (e.g. \`package.json\`, \`server.js\`) or an explicit function name.`;
    }
    // 1. Security Questions (Section 20)
    else if (qLower.includes('security') || qLower.includes('vulnerabilit') || qLower.includes('flaw') || qLower.includes('problem')) {
      const authFiles = chunks.filter((c) => /auth|jwt|user|login|server/i.test(c.filePath));
      const target = authFiles[0] || chunks[0];

      response = `### Security Analysis: Authentication & Implementation

Based on a grounded review of the retrieved codebase chunks:

#### Finding 1: JWT Secret Key Configuration
- **Observed code**: In **\`${target.filePath}\`** (Lines ${target.startLine}–${target.endLine}), tokens are signed and verified using \`process.env.JWT_SECRET\`.
- **Potential concern**: If \`JWT_SECRET\` is not populated in the production environment or lacks sufficient entropy, the signing mechanism can be compromised.
- **Why it could matter**: An attacker who obtains or cracks a weak secret can forge arbitrary user identity tokens and bypass authentication entirely.

#### Finding 2: Password Complexity Enforcement
- **Observed code**: In **\`src/models/User.js\`**, the password field only requires \`minlength: 6\` without requiring character diversity or dictionary checks.
- **Potential concern**: Permitting 6-character passwords enables weak, predictable credentials.
- **Why it could matter**: Low-entropy passwords are susceptible to brute-force and credential-stuffing attacks.

#### Relevant Citations:
${chunks.slice(0, 3).map((c) => `• \`${c.filePath}\` (Lines ${c.startLine}–${c.endLine})`).join('\n')}`;
    }
    // 2. Specific File Questions (e.g. "What does server.js do?")
    else if (qLower.includes('what does') && chunks.some((c) => qLower.includes(c.filePath.toLowerCase().split('/').pop()))) {
      const matched = chunks.find((c) => qLower.includes(c.filePath.toLowerCase().split('/').pop())) || chunks[0];
      response = `### Analysis of \`${matched.filePath}\`

In **\`${matched.filePath}\`** (Lines ${matched.startLine}–${matched.endLine}):

1. **Role & Responsibility**:
   This file acts as a primary module in the **${repoInfo.name || 'project'}** codebase. It sets up configuration, declares middleware, and connects core subsystems.

2. **Observed Dependencies & Logic**:
   - Initializes core framework components.
   - Registers handlers and mounts incoming routes.
   - Handles startup configuration and environment variables.

#### Relevant Citations:
• \`${matched.filePath}\` (Lines ${matched.startLine}–${matched.endLine})`;
    }
    // 3. Function Questions (e.g. "Explain the loginUser function")
    else if (qLower.includes('function') || qLower.includes('method') || qLower.includes('loginuser') || qLower.includes('registeruser')) {
      const funcChunk = chunks.find((c) => /controller|service|route|auth/i.test(c.filePath)) || chunks[0];
      response = `### Function Analysis

In **\`${funcChunk.filePath}\`** (Lines ${funcChunk.startLine}–${funcChunk.endLine}):

1. **Input Handling**: The function accepts incoming request parameters (such as credentials or identifiers).
2. **Business Logic & Validation**:
   - Performs validation on the provided input.
   - Executes cryptographic operations (e.g. comparing password hashes or signing JWT tokens).
3. **Response Output**: Returns a structured JSON payload with status codes (e.g. 200 OK or 401 Unauthorized).

#### Relevant Citations:
• \`${funcChunk.filePath}\` (Lines ${funcChunk.startLine}–${funcChunk.endLine})`;
    }
    // 4. Relationship Questions (e.g. "How does User.js interact with authController.js?")
    else if (qLower.includes('interact') || (qLower.includes('how does') && qLower.includes('with'))) {
      const topTwo = chunks.slice(0, 2);
      response = `### Component Interaction & Data Flow

Based on the repository implementation:

1. **Model Definition**: The schema or data entity defines structure, constraints, and validation rules in **\`${topTwo[0]?.filePath || 'model'}\`** (Lines ${topTwo[0]?.startLine || 1}–${topTwo[0]?.endLine || 30}).
2. **Controller Orchestration**: The controller imports the model to query records, create documents, and verify credentials in **\`${topTwo[1]?.filePath || 'controller'}\`** (Lines ${topTwo[1]?.startLine || 1}–${topTwo[1]?.endLine || 40}).
3. **Separation of Concerns**: Business validation and query logic are cleanly decoupled between the storage layer and the API routing layer.

#### Relevant Citations:
${topTwo.map((c) => `• \`${c.filePath}\` (Lines ${c.startLine}–${c.endLine})`).join('\n')}`;
    }
    // 5. Authentication & Login Flow
    else if (qLower.includes('auth') || qLower.includes('login') || qLower.includes('jwt')) {
      const authFiles = chunks.filter((c) => /auth|jwt|user|login/i.test(c.filePath));
      const primary = authFiles[0] || chunks[0];

      response = `### Authentication Architecture & Flow

Based on an inspection of the indexed repository files, authentication is implemented using standard token-based authentication.

#### 1. Request Lifecycle & Credentials Verification
When a user attempts to sign in, the request is directed to the authentication controller. The application verifies the user credentials against the stored records:

- Credentials and payload validation occur at **\`${primary.filePath}\`** (Lines ${primary.startLine}–${primary.endLine}).
- Passwords are validated using cryptographic hashing (e.g. \`bcrypt\`) before session or token generation.

#### 2. Token Generation
Upon successful verification, the backend generates an access token (JWT) encoding the user's primary identifier.

\`\`\`text
Client Login Form
       ↓
POST /api/auth/login
       ↓
${primary.filePath} (Lines ${primary.startLine}–${primary.endLine})
       ↓
Password Verification & Payload Validation
       ↓
Token Generation (Signed with Secret)
       ↓
Returned to Client (Bearer Header / Cookie)
\`\`\`

#### 3. Route Protection & Middleware
Protected endpoints pass incoming requests through an authorization middleware. The middleware intercepts the request, verifies the signature, and injects the authenticated user identity into \`req.user\`.

#### Relevant Code Citations:
${chunks.slice(0, 3).map((c) => `• \`${c.filePath}\` (Lines ${c.startLine}–${c.endLine})`).join('\n')}`;
    }
    // 6. Database Connection & Models
    else if (qLower.includes('database') || qLower.includes('db') || qLower.includes('mongo') || qLower.includes('connect')) {
      const dbChunks = chunks.filter((c) => /db|mongo|model|schema|connect/i.test(c.filePath));
      const target = dbChunks[0] || chunks[0];

      response = `### Database Connection & Models

The repository connects to its database through structured configuration and schema definition files:

1. **Connection Logic**: Database initialization is managed in **\`${target.filePath}\`** (Lines ${target.startLine}–${target.endLine}).
2. **Schema Definition**: Models and collections are defined with strongly-typed schemas and validation constraints.

#### Key Files:
${chunks.slice(0, 3).map((c) => `• \`${c.filePath}\` (Lines ${c.startLine}–${c.endLine})`).join('\n')}`;
    }
    // 7. Structure & Architecture Overview
    else if (qLower.includes('structure') || qLower.includes('folder') || qLower.includes('architecture') || qLower.includes('overview')) {
      const distinctPaths = [...new Set(chunks.map((c) => c.filePath))];
      response = `### Repository Structure & Architecture Overview

The repository **${repoInfo.owner || 'repo'}/${repoInfo.name || 'project'}** follows a modular layout:

- **Primary Language**: ${repoInfo.language || 'JavaScript/TypeScript'}
- **Observed Core Modules**:
${distinctPaths.map((p) => `  - \`${p}\``).join('\n')}

#### Component Interactions
Key architectural entry points and controllers are responsible for routing, business logic, and communication between layers.

#### Observed Files:
${chunks.slice(0, 4).map((c) => `• \`${c.filePath}\` (Lines ${c.startLine}–${c.endLine})`).join('\n')}`;
    } else {
      // General question synthesized from top chunks
      const topChunk = chunks[0];
      response = `### Analysis for: "${question}"

Based on the repository context retrieved for **${repoInfo.owner || ''}/${repoInfo.name || ''}**:

1. **Observed Implementation**:
   In **\`${topChunk.filePath}\`** (Lines ${topChunk.startLine}–${topChunk.endLine}), the codebase defines key components related to this functionality.

2. **Technical Details**:
   The relevant code handles the logic according to the repository's configuration.

#### Relevant Citations:
${chunks.slice(0, 3).map((c) => `• \`${c.filePath}\` (Lines ${c.startLine}–${c.endLine})`).join('\n')}`;
    }

    // Simulate natural streaming token emission
    if (onToken) {
      const words = response.split(/(\s+)/);
      for (const word of words) {
        onToken(word);
        await new Promise((resolve) => setTimeout(resolve, 15));
      }
    }

    return response;
  }
}

module.exports = {
  MockAiService,
};
