import { Link } from 'react-router-dom'

export function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <nav className="border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <h1 className="text-2xl font-bold text-primary">InvoiceGen</h1>
            <div className="flex space-x-4">
              <Link to="/signin" className="text-gray-600 hover:text-gray-900 font-medium">Sign In</Link>
              <Link to="/signup" className="bg-primary text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-hover transition-colors">Get Started</Link>
            </div>
          </div>
        </div>
      </nav>
      <main>
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">Professional Invoices in Minutes</h2>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Create, manage, and download professional invoices. Perfect for freelancers, agencies, and businesses.
            </p>
            <div className="flex justify-center space-x-4">
              <Link to="/signup" className="bg-primary text-white px-8 py-3 rounded-lg font-medium hover:bg-primary-hover transition-colors">
                Start Free Trial
              </Link>
              <Link to="/signin" className="bg-white text-gray-700 border border-gray-300 px-8 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors">
                Sign In
              </Link>
            </div>
          </div>
        </section>
        <section className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <svg className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold mb-2">Create Invoices</h3>
                <p className="text-gray-600">Generate professional invoices with automatic calculations and multiple line items.</p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <svg className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold mb-2">Manage Clients</h3>
                <p className="text-gray-600">Keep track of all your clients in one place with contact details and history.</p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <svg className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold mb-2">Download PDFs</h3>
                <p className="text-gray-600">Export professional PDF invoices ready to send to your clients instantly.</p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
