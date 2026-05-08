import Link from "next/link";

export default function Home() {
  return (
    <div className="bg-[#0B0F19] text-white min-h-screen">

      {/* NAVBAR */}
      

<div className="flex justify-between items-center px-8 py-4">

  {/* Logo */}
  <h1 className="text-xl font-bold text-indigo-400">
    Naarad
  </h1>

  {/* Buttons */}
  <div className="flex gap-4">

    {/* Admin Button */}
    <Link
      href="/admin"
      className="text-white hover:text-indigo-400 transition"
    >
      Admin
    </Link>

    {/* Submit Button */}
    <Link
      href="/submit"
      className="bg-indigo-600 px-5 py-2 rounded-xl hover:bg-indigo-700 transition"
    >
      Submit Grievance
    </Link>

  </div>

</div>

      {/* HERO */}
      <section className="text-center py-28 px-6 relative">

        {/* Glow background */}
        <div className="absolute inset-0 flex justify-center items-center -z-10">
          <div className="w-[500px] h-[500px] bg-indigo-600 opacity-20 blur-3xl rounded-full"></div>
        </div>

        <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
          AI-Powered Grievance <br /> Redressal System
        </h1>

        <p className="text-gray-400 max-w-2xl mx-auto mb-10 text-lg">
          Submit complaints, track progress, and get faster resolutions with
          intelligent AI prioritization.
        </p>

        <Link
          href="/submit"
          className="bg-orange-500 px-8 py-3 rounded-xl text-lg hover:bg-orange-600 transition shadow-lg hover:scale-105 inline-block"
        >
          Submit Complaint
        </Link>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-24 px-8">
        <h2 className="text-3xl font-semibold text-center mb-16">
          How It Works
        </h2>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">

          {/* Card 1 */}
          <div className="bg-white/5 backdrop-blur-lg border border-white/10 p-8 rounded-2xl hover:scale-105 transition duration-300">
            <h3 className="text-xl font-semibold mb-3">Submit</h3>
            <p className="text-gray-400">
              Raise your complaint easily with AI guidance.
            </p>
          </div>

          {/* Card 2 */}
          <div className="bg-white/5 backdrop-blur-lg border border-white/10 p-8 rounded-2xl hover:scale-105 transition duration-300">
            <h3 className="text-xl font-semibold mb-3">Analyze</h3>
            <p className="text-gray-400">
              AI categorizes and prioritizes issues instantly.
            </p>
          </div>

          {/* Card 3 */}
          <div className="bg-white/5 backdrop-blur-lg border border-white/10 p-8 rounded-2xl hover:scale-105 transition duration-300">
            <h3 className="text-xl font-semibold mb-3">Resolve</h3>
            <p className="text-gray-400">
              Authorities act quickly while you track updates.
            </p>
          </div>

        </div>
      </section>

      {/* CTA */}
      <section className="py-24 text-center">
        <h2 className="text-3xl font-semibold mb-4">
          Raise your voice. Get it resolved.
        </h2>

        <p className="text-gray-400 mb-8">
          Transparent. Fast. AI-driven.
        </p>

        <Link
          href="/submit"
          className="bg-indigo-600 px-8 py-3 rounded-xl hover:bg-indigo-700 transition hover:scale-105 inline-block"
        >
          Get Started
        </Link>
      </section>

      {/* FOOTER */}
      <footer className="text-center py-8 text-gray-500 border-t border-white/10">
        © 2026 Naarad GRS • Built for citizens
      </footer>

      {/* FLOATING BOT */}
      <div className="fixed bottom-6 right-6">
        <button className="bg-indigo-600 px-5 py-3 rounded-full shadow-lg hover:bg-indigo-700 transition hover:scale-110">
          💬
        </button>
      </div>

    </div>
  );
}
