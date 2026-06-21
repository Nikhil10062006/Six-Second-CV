import { useNavigate } from "react-router-dom";

export default function Landing() {
  const navigate = useNavigate();

  const features = [
    {
      tag: "ATS PARSE SIMULATOR",
      headline: "Your resume isn't what the ATS reads.",
      body: "We extract your PDF's raw coordinates and reconstruct the exact garbled text an ATS sees — dropped sections, merged columns, scrambled order. Most people have never seen this.",
      emoji: "🤖",
    },
    {
      tag: "JD MATCH & GAP ANALYSIS",
      headline: "A score. A gap list. No guessing.",
      body: "Paste a JD or drop a URL. We extract must-haves vs nice-to-haves, embed both sides, and return a cosine similarity score with a concrete list of what's missing.",
      emoji: "🎯",
    },
    {
      tag: "6-SECOND HEATMAP",
      headline: "See where a recruiter's eyes land.",
      body: "A rule-based attention engine scores every block of your resume by position, density, and contrast — then overlays a heatmap so you see what actually gets noticed.",
      emoji: "🔥",
    },
    {
      tag: "COLDREACH",
      headline: "Outreach that proves you did your homework.",
      body: "We scrape their careers page, engineering blog, and HN mentions in real-time. Three live signals — hiring teams, recent launches, stack overlap — fed into the message before we write a single word.",
      emoji: "📡",
    },
  ];

  const testimonials = [
    {
      quote:
        "I had no idea my two-column resume was completely scrambled in every ATS. The side-by-side view was genuinely shocking.",
      name: "Sneha R.",
      role: "SDE at Razorpay",
    },
    {
      quote:
        "The cold email referenced their Go migration from a blog post three weeks ago. The recruiter replied within an hour.",
      name: "Karan M.",
      role: "Incoming SWE at Atlassian",
    },
    {
      quote:
        "Every other tool told me to 'add more keywords.' This one told me exactly which ones and why they mattered for that specific JD.",
      name: "Aditya P.",
      role: "Backend Engineer at Zepto",
    },
  ];

  return (
    <div className="min-h-screen bg-white text-zinc-800 font-mono">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-4 bg-white/80 backdrop-blur-sm border-b border-zinc-200">
        <span className="text-sky-600 font-bold tracking-widest text-sm uppercase">
          SixSecondCV
        </span>
        <div className="flex gap-3">
          <button
            onClick={() => navigate("/login")}
            className="text-sm text-zinc-500 hover:text-zinc-800 px-4 py-2 transition-colors duration-150"
          >
            Login
          </button>
          <button
            onClick={() => navigate("/register")}
            className="text-sm bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 rounded-lg transition-colors duration-150"
          >
            Get Started
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="min-h-screen flex flex-col items-center justify-center text-center px-6 pt-20 relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage: `linear-gradient(rgba(14,165,233,0.15) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(14,165,233,0.15) 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
          }}
        />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-sky-100 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-4xl mx-auto">
          <span className="inline-block text-xs text-sky-600 tracking-widest uppercase border border-sky-200 bg-sky-50 px-4 py-1.5 rounded-full mb-6">
            ATS parsing · Heatmap · Gap analysis · Live outreach
          </span>

          <h1 className="text-4xl sm:text-6xl font-bold leading-tight text-zinc-800 mb-6 tracking-tight">
            Your resume looks great.
            <br />
            <span className="text-sky-600">The ATS thinks otherwise.</span>
          </h1>

          <p className="text-zinc-500 text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed mb-10">
            SixSecondCV shows you what you can't see yourself — how machines
            parse your resume, where recruiters look first, and exactly what's
            missing for the job you want.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate("/register")}
              className="bg-sky-600 hover:bg-sky-700 text-white font-semibold px-8 py-3.5 rounded-xl transition-all duration-150 text-sm tracking-wide shadow-sm hover:shadow-md"
            >
              🤖 See Your ATS View
            </button>
            <button
              onClick={() => navigate("/register")}
              className="border border-zinc-200 hover:border-sky-400 text-zinc-600 hover:text-sky-600 font-semibold px-8 py-3.5 rounded-xl transition-all duration-150 text-sm tracking-wide"
            >
              📡 Try ColdReach
            </button>
          </div>
        </div>

        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-zinc-400">
          <span className="text-xs tracking-widest uppercase">Scroll</span>
          <span className="text-lg animate-bounce">↓</span>
        </div>
      </section>

      {/* ATS callout */}
      <section className="px-6 py-20 border-y border-zinc-200 bg-zinc-50">
        <div className="max-w-3xl mx-auto text-center flex flex-col gap-5">
          <span className="text-5xl">📄</span>
          <h2 className="text-2xl sm:text-3xl font-bold text-zinc-800 leading-snug">
            A two-column resume becomes one long
            <br />
            <span className="text-sky-600">
              column of scrambled, unreadable text.
            </span>
          </h2>
          <p className="text-zinc-500 text-base leading-relaxed">
            ATS systems read left-to-right by raw coordinates — they don't
            understand columns. Your carefully designed layout gets merged into
            a single broken stream. We show you exactly what they see,
            side-by-side with your original.
          </p>
          <button
            onClick={() => navigate("/register")}
            className="self-center text-sm text-sky-600 border border-sky-200 hover:border-sky-400 hover:bg-sky-50 px-6 py-2.5 rounded-lg transition-colors duration-150"
          >
            See your ATS view →
          </button>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-24 max-w-6xl mx-auto">
        <p className="text-xs text-sky-600 tracking-widest uppercase text-center mb-3">
          The Pipeline
        </p>
        <h2 className="text-3xl font-bold text-center text-zinc-800 mb-16">
          Parse. Score. Heatmap. Outreach.
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {features.map((f) => (
            <div
              key={f.tag}
              className="bg-white border border-zinc-200 rounded-2xl p-6 flex flex-col gap-4 hover:border-sky-400 hover:shadow-md hover:shadow-sky-100 transition-all duration-200"
            >
              <span className="text-4xl">{f.emoji}</span>
              <span className="text-xs text-sky-600 tracking-widest font-semibold">
                {f.tag}
              </span>
              <h3 className="text-base font-bold text-zinc-800 leading-snug">
                {f.headline}
              </h3>
              <p className="text-sm text-zinc-500 leading-relaxed">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ColdReach callout */}
      <section className="px-6 py-20 border-y border-zinc-200 bg-zinc-50">
        <div className="max-w-3xl mx-auto text-center flex flex-col gap-5">
          <span className="text-5xl">📡</span>
          <h2 className="text-2xl sm:text-3xl font-bold text-zinc-800 leading-snug">
            Not "write me a cold email."
            <br />
            <span className="text-sky-600">Scrape first. Then generate.</span>
          </h2>
          <p className="text-zinc-500 text-base leading-relaxed">
            ColdReach pulls their active job listings, last 30 days of blog
            posts, and detected tech stack — before the LLM writes a single
            word. The output references a real launch, a real hiring push, and
            your strongest overlap. ChatGPT can't do this because it can't
            scrape.
          </p>
        </div>
      </section>

      {/* Testimonials */}
      <section className="px-6 py-24 max-w-6xl mx-auto">
        <p className="text-xs text-sky-600 tracking-widest uppercase text-center mb-3">
          Results
        </p>
        <h2 className="text-3xl font-bold text-center text-zinc-800 mb-16">
          Visibility into what was invisible.
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {testimonials.map((t) => (
            <div
              key={t.name}
              className="bg-white border border-zinc-200 rounded-2xl p-6 flex flex-col gap-4 hover:border-sky-300 hover:shadow-sm transition-all duration-200"
            >
              <span className="text-sky-500 text-2xl">"</span>
              <p className="text-zinc-600 text-sm leading-relaxed italic">
                {t.quote}
              </p>
              <div className="mt-auto pt-4 border-t border-zinc-100">
                <p className="text-zinc-800 text-sm font-semibold">{t.name}</p>
                <p className="text-zinc-400 text-xs">{t.role}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-6 py-24 text-center border-t border-zinc-200 relative overflow-hidden bg-sky-50">
        <div className="relative z-10 max-w-2xl mx-auto flex flex-col gap-6 items-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-zinc-800 leading-tight">
            You've been optimizing blind.
            <br />
            <span className="text-sky-600">Now you don't have to.</span>
          </h2>
          <p className="text-zinc-500">
            Upload your resume. See what machines and humans actually see. Close
            the gaps. Send the message that stands out.
          </p>
          <button
            onClick={() => navigate("/register")}
            className="bg-sky-600 hover:bg-sky-700 text-white font-bold px-10 py-4 rounded-xl text-base tracking-wide transition-all duration-150 shadow-sm hover:shadow-md"
          >
            Analyse Your Resume →
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-200 px-8 py-6 flex items-center justify-between text-zinc-400 text-xs">
        <span className="text-sky-600 font-bold tracking-widest uppercase">
          SixSecondCV
        </span>
        <span>Built for developers who apply smart.</span>
      </footer>
    </div>
  );
}
