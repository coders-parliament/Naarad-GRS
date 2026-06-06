import Link from "next/link";

export default function Home() {
  return (
    <div className="bg-bg-primary text-text-primary min-h-screen transition-colors duration-300">

      {/* HERO */}
      <section className="text-center py-28 px-6 relative">

        {/* Glow background */}
        <div className="absolute inset-0 flex justify-center items-center -z-10">
          <div className="w-[500px] h-[500px] bg-accent-primary opacity-10 blur-3xl rounded-full"></div>
        </div>

        <h1 className="text-5xl md:text-6xl font-extrabold mb-6 leading-tight tracking-tight text-text-primary">
          AI-Powered Grievance <br /> Redressal System
        </h1>

        <p className="text-text-secondary max-w-2xl mx-auto mb-10 text-lg">
          Submit complaints, track progress, and get faster resolutions with
          intelligent AI prioritization.
        </p>

        <Link href="/submit">
          <button className="bg-accent-primary px-8 py-3 rounded-xl text-lg hover:bg-accent-hover text-white transition shadow-lg hover:scale-105 cursor-pointer font-semibold shadow-accent-primary/20">
            Submit Complaint
          </button>
        </Link>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-24 px-8">
        <h2 className="text-3xl font-bold text-center mb-16 text-text-primary">
          How It Works
        </h2>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">

          {/* Card 1 */}
          <div className="bg-bg-secondary border border-border-custom p-8 rounded-2xl hover:scale-105 transition duration-300 shadow-md">
            <h3 className="text-xl font-bold mb-3 text-text-primary">Submit</h3>
            <p className="text-text-secondary">
              Raise your complaint easily with AI guidance.
            </p>
          </div>

          {/* Card 2 */}
          <div className="bg-bg-secondary border border-border-custom p-8 rounded-2xl hover:scale-105 transition duration-300 shadow-md">
            <h3 className="text-xl font-bold mb-3 text-text-primary">Analyze</h3>
            <p className="text-text-secondary">
              AI categorizes and prioritizes issues instantly.
            </p>
          </div>

          {/* Card 3 */}
          <div className="bg-bg-secondary border border-border-custom p-8 rounded-2xl hover:scale-105 transition duration-300 shadow-md">
            <h3 className="text-xl font-bold mb-3 text-text-primary">Resolve</h3>
            <p className="text-text-secondary">
              Authorities act quickly while you track updates.
            </p>
          </div>

        </div>
      </section>

      {/* CTA */}
      <section className="py-24 text-center">
        <h2 className="text-3xl font-bold mb-4 text-text-primary">
          Raise your voice. Get it resolved.
        </h2>

        <p className="text-text-secondary mb-8">
          Transparent. Fast. AI-driven.
        </p>

        <Link href="/submit">
          <button className="bg-accent-primary px-8 py-3 rounded-xl hover:bg-accent-hover text-white transition hover:scale-105 cursor-pointer font-semibold shadow-lg shadow-accent-primary/20">
            Get Started
          </button>
        </Link>
      </section>

      {/* FOOTER */}
      <footer className="text-center py-8 text-text-secondary border-t border-border-custom">
        © 2026 Naarad GRS • Built for citizens
      </footer>

    </div>
  );
}