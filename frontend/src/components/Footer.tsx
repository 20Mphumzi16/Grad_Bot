export function Footer() {
  return (
    <footer className="py-12 px-6 border-t border-gray-100">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <a href="#" className="text-gray-600 hover:text-gray-900 text-sm transition-colors">
              Privacy
            </a>
            <a href="#" className="text-gray-600 hover:text-gray-900 text-sm transition-colors">
              Terms
            </a>
            <a href="#" className="text-gray-600 hover:text-gray-900 text-sm transition-colors">
              Contact
            </a>
          </div>
          
          <p className="text-sm text-gray-400">
            Powered by Retrieval-Augmented Generation (RAG)
          </p>
        </div>
        
        <div className="mt-8 pt-8 border-t border-gray-100 text-center">
          <p className="text-sm text-gray-400">
            © 2025 Grad Knowledge Assistant. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
