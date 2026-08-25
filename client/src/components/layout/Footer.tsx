import { useEffect, useState } from 'react';
import { Link } from 'wouter';

export function Footer() {
  const [visitorCount, setVisitorCount] = useState<number | null>(null);
  const [visitorCountUnavailable, setVisitorCountUnavailable] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    fetch('/api/visitors/count', {
      credentials: 'include',
      cache: 'no-store',
      signal: controller.signal,
    })
      .then(response => {
        if (!response.ok) {
          throw new Error('Visitor count unavailable');
        }
        return response.json();
      })
      .then(data => {
        if (typeof data.count === 'number') {
          setVisitorCount(data.count);
        }
      })
      .catch(error => {
        if (error instanceof Error && error.name !== 'AbortError') {
          console.error('Unable to load visitor count:', error);
          setVisitorCountUnavailable(true);
        }
      });

    return () => controller.abort();
  }, []);

  return (
    <footer className="bg-white border-t border-slate-200 py-4 mt-6">
      <div className="container mx-auto px-4">
        <div className="flex flex-col gap-3 text-sm text-slate-500 md:flex-row md:justify-between md:items-center">
          <div className="flex items-center gap-3">
            <a
              href="https://zhisystems.org"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Visit ZHI Systems"
              className="inline-flex rounded-md border border-slate-200 bg-white p-0.5 shadow-sm transition hover:border-primary hover:shadow"
            >
              <img
                src="/zhi-logo.png"
                alt="ZHI Systems"
                width="28"
                height="28"
                className="h-7 w-7 rounded object-contain"
              />
            </a>
            <div>
              <div>© {new Date().getFullYear()} EZ Reader. All rights reserved.</div>
              <div className="mt-0.5 text-xs text-slate-400">A ZHI Systems project</div>
            </div>
          </div>
          <div
            className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 font-medium text-slate-600"
            aria-live="polite"
            data-testid="visitor-count"
          >
            {visitorCountUnavailable
              ? 'Visitors unavailable'
              : visitorCount === null
              ? 'Visitors: loading'
              : `${visitorCount.toLocaleString()} unique ${visitorCount === 1 ? 'visitor' : 'visitors'}`}
          </div>
          <div className="flex gap-4 mt-2 md:mt-0">
            <Link href="/" className="hover:text-primary transition-colors">
              Home
            </Link>
            <Link href="/gpt-bypass" className="hover:text-primary transition-colors">
              AI Text Humanizer
            </Link>
            <a
              href="https://zhisystems.org"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-primary transition-colors"
            >
              Contact us
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
