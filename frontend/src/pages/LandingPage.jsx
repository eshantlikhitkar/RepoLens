import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import {
  Terminal,
  Github,
  Play,
  Shield,
  Search,
  Sparkles,
  Map,
  FileCode,
  CheckCircle2,
  ArrowRight,
  Code2,
} from 'lucide-react';

export function LandingPage() {
  const { isAuthenticated, loginWithGitHub, loginDemo } = useAuth();
  const navigate = useNavigate();

  const handleGetStarted = () => {
    if (isAuthenticated) {
      navigate('/dashboard');
    } else {
      loginWithGitHub();
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0d1117] text-gray-200">
      <Navbar />

      {/* Hero Section */}
      <main className="flex-1">
        <section className="relative overflow-hidden pt-16 pb-20 md:pt-24 md:pb-28">
          {/* Subtle background glow */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-indigo-600/10 blur-[120px] rounded-full pointer-events-none" />

          <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center relative z-10">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-950/80 border border-indigo-700/50 text-indigo-300 text-xs font-medium mb-6">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>AI-Powered GitHub Repository Investigator</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-[1.15] mb-6">
              Understand your codebase <br className="hidden sm:inline" />
              with <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-indigo-300 to-purple-400">grounded AI</span>.
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg text-gray-400 max-w-2xl mx-auto mb-8 leading-relaxed">
              Connect your GitHub account, pick any repository, and ask natural-language questions. Get instant answers backed by actual repository code, files, and line-level citations.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto mb-12">
              <button
                onClick={handleGetStarted}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-lg shadow-indigo-600/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <Github className="w-4 h-4" />
                <span>Continue with GitHub</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </button>

              <button
                onClick={async () => {
                  try {
                    await loginDemo();
                    navigate('/dashboard');
                  } catch (e) {
                    console.error('Demo login error', e);
                  }
                }}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-semibold text-gray-300 hover:text-white bg-[#161b22] hover:bg-[#21262d] border border-[#30363d] rounded-xl transition-all"
              >
                <Play className="w-4 h-4 text-indigo-400" />
                <span>Explore with Demo Mode</span>
              </button>
            </div>

            {/* Code citation preview card */}
            <div className="w-full max-w-3xl mx-auto bg-[#161b22] border border-[#30363d] rounded-xl shadow-2xl overflow-hidden text-left font-mono text-xs">
              <div className="bg-[#0d1117] border-b border-[#30363d] px-4 py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500/80" />
                  <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                  <span className="text-gray-400 ml-2">RepoLens AI Investigation</span>
                </div>
                <span className="text-[11px] text-indigo-400">RAG Semantic Search</span>
              </div>

              <div className="p-4 sm:p-6 space-y-4">
                {/* User question */}
                <div className="flex items-start gap-3 bg-[#0d1117]/80 p-3 rounded-lg border border-[#21262d]">
                  <span className="text-indigo-400 font-bold">Q:</span>
                  <span className="text-gray-200">How does authentication work in this project?</span>
                </div>

                {/* AI response snippet */}
                <div className="space-y-2 text-gray-300">
                  <p className="leading-relaxed">
                    Authentication is handled using JWT tokens. When a user submits credentials, the request reaches the login controller in <code className="text-indigo-300 bg-[#0d1117] px-1 py-0.5 rounded">src/controllers/authController.js</code>, validates with bcrypt, and signs an access token.
                  </p>
                  <p className="leading-relaxed">
                    Protected endpoints pass through <code className="text-indigo-300 bg-[#0d1117] px-1 py-0.5 rounded">src/middleware/auth.js</code> which extracts the Bearer token and verifies the secret signature.
                  </p>
                </div>

                {/* Citations row */}
                <div className="pt-2 flex flex-wrap items-center gap-2">
                  <span className="text-[11px] text-gray-400 font-sans">Grounded Citations:</span>
                  <div className="bg-indigo-950/70 border border-indigo-700/60 text-indigo-300 px-2 py-1 rounded text-[11px] flex items-center gap-1.5">
                    <FileCode className="w-3 h-3 text-indigo-400" />
                    <span>authController.js:24-52</span>
                  </div>
                  <div className="bg-indigo-950/70 border border-indigo-700/60 text-indigo-300 px-2 py-1 rounded text-[11px] flex items-center gap-1.5">
                    <FileCode className="w-3 h-3 text-indigo-400" />
                    <span>middleware/auth.js:5-31</span>
                  </div>
                  <div className="bg-indigo-950/70 border border-indigo-700/60 text-indigo-300 px-2 py-1 rounded text-[11px] flex items-center gap-1.5">
                    <FileCode className="w-3 h-3 text-indigo-400" />
                    <span>models/User.js:12-40</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Cards Grid (Section 29) */}
        <section className="py-16 border-t border-[#21262d] bg-[#0d1117]">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mb-3">
                Engineered for serious codebase investigation
              </h2>
              <p className="text-xs sm:text-sm text-gray-400">
                Not a generic chat wrapper. RepoLens AI indexes ASTs, parses file trees, and runs RAG retrieval with precise code grounding.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Feature 1 */}
              <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-5 hover:border-indigo-500/50 transition-colors">
                <div className="w-10 h-10 rounded-lg bg-indigo-950/80 border border-indigo-800/60 text-indigo-400 flex items-center justify-center mb-4">
                  <Shield className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-semibold text-white mb-2">🔐 GitHub OAuth & Security</h3>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Authenticate securely using GitHub OAuth. Access tokens are encrypted server-side with AES-256-GCM and never exposed to the frontend.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-5 hover:border-indigo-500/50 transition-colors">
                <div className="w-10 h-10 rounded-lg bg-indigo-950/80 border border-indigo-800/60 text-indigo-400 flex items-center justify-center mb-4">
                  <Sparkles className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-semibold text-white mb-2">🧠 Repository-Aware AI</h3>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Ask deep architecture, lifecycle, and flow questions. The AI treats code strictly as passive untrusted data, preventing prompt injection attacks.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-5 hover:border-indigo-500/50 transition-colors">
                <div className="w-10 h-10 rounded-lg bg-indigo-950/80 border border-indigo-800/60 text-indigo-400 flex items-center justify-center mb-4">
                  <Search className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-semibold text-white mb-2">🔎 Semantic Vector Search</h3>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Dense embeddings and query expansion identify relevant functions and logic even if you don't know the exact filenames.
                </p>
              </div>

              {/* Feature 4 */}
              <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-5 hover:border-indigo-500/50 transition-colors">
                <div className="w-10 h-10 rounded-lg bg-indigo-950/80 border border-indigo-800/60 text-indigo-400 flex items-center justify-center mb-4">
                  <FileCode className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-semibold text-white mb-2">📍 Line-Level Citations</h3>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Every technical statement cites file paths and line ranges. Click any citation chip to open the code viewer and jump straight to the source.
                </p>
              </div>

              {/* Feature 5 */}
              <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-5 hover:border-indigo-500/50 transition-colors">
                <div className="w-10 h-10 rounded-lg bg-indigo-950/80 border border-indigo-800/60 text-indigo-400 flex items-center justify-center mb-4">
                  <Map className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-semibold text-white mb-2">🗺️ Architecture Overview</h3>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Automatically extracts the project type, frontend/backend stack, database, authentication pattern, entry points, and directory map upon indexing.
                </p>
              </div>

              {/* Feature 6 */}
              <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-5 hover:border-indigo-500/50 transition-colors">
                <div className="w-10 h-10 rounded-lg bg-indigo-950/80 border border-indigo-800/60 text-indigo-400 flex items-center justify-center mb-4">
                  <Terminal className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-semibold text-white mb-2">💬 Conversational Memory</h3>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Ask follow-up questions naturally. The system persists investigations in MongoDB with thread titles and citation history.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
