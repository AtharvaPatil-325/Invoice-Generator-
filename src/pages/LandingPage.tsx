import { Link } from 'react-router-dom'
import {
  Receipt,
  FileText,
  Users,
  Download,
  Zap,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react'

export function LandingPage() {
  return (
    <div className="min-h-screen bg-[#f7f8fc] text-slate-900 flex flex-col justify-between">
      {/* Top Navbar */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200/70 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-linear-to-br from-indigo-600 via-blue-600 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25">
              <Receipt className="w-5 h-5" />
            </div>
            <span className="text-lg font-extrabold text-slate-900 tracking-tight">InvoiceGen</span>
          </div>

          <div className="flex items-center space-x-3">
            <Link
              to="/signin"
              className="text-xs font-bold text-slate-600 hover:text-slate-900 px-3 py-2 rounded-xl transition-colors"
            >
              Sign In
            </Link>
            <Link
              to="/signup"
              className="text-xs font-bold bg-slate-900 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl shadow-lg shadow-slate-900/10 transition-all active:scale-95"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-20 lg:py-32 px-4 text-center relative overflow-hidden">
          <div className="absolute -top-40 left-1/2 h-[34rem] w-[34rem] -translate-x-1/2 rounded-full bg-indigo-400/15 blur-3xl" />
          <div className="absolute top-28 left-1/2 h-64 w-[42rem] -translate-x-1/2 rounded-full bg-cyan-300/10 blur-3xl" />
          <div className="max-w-4xl mx-auto space-y-6 relative z-10">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-white/75 border border-indigo-100 text-indigo-700 text-xs font-bold shadow-sm shadow-indigo-100">
              <Zap className="w-3.5 h-3.5 text-blue-600" />
              <span>Modern Invoicing SaaS Platform</span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-extrabold text-slate-900 tracking-[-0.04em] leading-[1.08]">
              Professional invoicing, <span className="text-transparent bg-clip-text bg-linear-to-r from-indigo-600 via-blue-600 to-cyan-500">beautifully simple.</span>
            </h1>

            <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
              Create, track, and download professional PDF invoices in seconds. Manage clients, calculate taxes automatically, and get paid faster.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
              <Link
                to="/signup"
                className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-7 py-3.5 rounded-2xl bg-slate-900 hover:bg-indigo-700 text-white font-bold text-sm shadow-xl shadow-slate-900/20 transition-all active:scale-95"
              >
                <span>Start Free Trial</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/signin"
                className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-7 py-3.5 rounded-2xl bg-white/80 hover:bg-white text-slate-700 font-bold text-sm border border-slate-200 shadow-sm transition-all hover:-translate-y-0.5"
              >
                <span>Sign In to Dashboard</span>
              </Link>
            </div>

            <div className="pt-8 flex flex-wrap justify-center items-center gap-6 text-xs text-slate-500 font-medium">
              <span className="flex items-center"><CheckCircle2 className="w-4 h-4 text-emerald-500 mr-1.5" /> No credit card required</span>
              <span className="flex items-center"><CheckCircle2 className="w-4 h-4 text-emerald-500 mr-1.5" /> Supabase backend protected</span>
              <span className="flex items-center"><CheckCircle2 className="w-4 h-4 text-emerald-500 mr-1.5" /> Instant PDF download</span>
            </div>
          </div>
        </section>

        {/* Feature Grid */}
        <section className="py-20 bg-white/70 border-t border-slate-200/70 px-4">
          <div className="max-w-7xl mx-auto space-y-12">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-slate-900">Everything you need to bill your clients</h2>
              <p className="text-xs text-slate-500">Built for freelancers, agencies, and modern business teams.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="p-6 rounded-3xl bg-white border border-slate-200/80 space-y-4 shadow-sm shadow-slate-200/40 hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-100/60 transition-all duration-300">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <FileText className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Dynamic Invoices</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Add custom products or services, apply discounts, calculate tax rates, and generate clean invoice numbers automatically.
                </p>
              </div>

              <div className="p-6 rounded-3xl bg-white border border-slate-200/80 space-y-4 shadow-sm shadow-slate-200/40 hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-100/60 transition-all duration-300">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Users className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Client Directory</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Store client contact information, addresses, and tax numbers. Select any client to auto-fill new invoices effortlessly.
                </p>
              </div>

              <div className="p-6 rounded-3xl bg-white border border-slate-200/80 space-y-4 shadow-sm shadow-slate-200/40 hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-100/60 transition-all duration-300">
                <div className="w-12 h-12 rounded-2xl bg-cyan-50 text-cyan-600 flex items-center justify-center">
                  <Download className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Instant PDF Export</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Preview invoices in a professional document format and export crisp A4 PDF files complete with your company logo.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200/80 py-8 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <Receipt className="w-4 h-4 text-blue-600" />
            <span className="font-bold text-slate-900">InvoiceGen</span>
            <span>© {new Date().getFullYear()} InvoiceGen Inc.</span>
          </div>
          <p>Secure Financial SaaS Application powered by Supabase & React.</p>
        </div>
      </footer>
    </div>
  )
}
