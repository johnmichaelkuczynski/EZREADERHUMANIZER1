import { useState, useEffect } from 'react';
import { GPTBypassInterface } from '@/components/gpt-bypass/GPTBypassInterface';
import { Footer } from '@/components/layout/Footer';
import { SEOHead } from '@/components/seo/SEOHead';

export default function GPTBypassPage() {
  const [inputFromMain, setInputFromMain] = useState<string>('');

  // Handle localStorage handoff on mount
  useEffect(() => {
    const handoffInput = localStorage.getItem('handoff:input');
    if (handoffInput) {
      setInputFromMain(handoffInput);
      localStorage.removeItem('handoff:input'); // Clear after reading
    }
  }, []);

  return (
    <>
      <SEOHead
        title="AI Text Humanizer & Rewriter — EZ Reader"
        description="Humanize and rewrite AI-generated text with customizable writing samples, tone controls, instruction presets, file uploads, and multiple AI providers."
        path="/gpt-bypass"
        structuredData={{
          "@context": "https://schema.org",
          "@type": "WebApplication",
          name: "EZ Reader AI Text Humanizer",
          applicationCategory: "UtilitiesApplication",
          operatingSystem: "Web",
          description: "An online AI text humanizer and rewriter with customizable style samples, rewrite instructions, file support, and AI writing analysis.",
          isPartOf: {
            "@type": "WebSite",
            name: "EZ Reader"
          }
        }}
      />
      <div className="container mx-auto px-4 py-8">
        <GPTBypassInterface inputFromMain={inputFromMain} />
        <section className="mx-auto mt-10 max-w-5xl rounded-xl border border-slate-200 bg-slate-50 p-6" aria-labelledby="humanizer-guide">
          <h2 id="humanizer-guide" className="text-2xl font-semibold text-slate-900">
            Rewrite AI text with more natural style and control
          </h2>
          <p className="mt-3 leading-7 text-slate-600">
            EZ Reader's text humanizer lets you refine AI-generated drafts using writing samples, instruction presets,
            custom directions, and multiple language models. Use it to improve clarity, vary sentence structure,
            adjust tone, and make a draft sound more consistent with the style you choose.
          </p>
          <div className="mt-6 grid gap-5 md:grid-cols-3">
            <article>
              <h3 className="font-semibold text-slate-900">Choose a writing style</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Select a built-in sample or upload your own reference so the rewrite follows a more specific voice.
              </p>
            </article>
            <article>
              <h3 className="font-semibold text-slate-900">Control the rewrite</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Combine presets with custom instructions to guide tone, cadence, structure, formatting, and detail.
              </p>
            </article>
            <article>
              <h3 className="font-semibold text-slate-900">Review and export</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Compare the source with the rewritten output, run writing analysis, copy the result, or download it.
              </p>
            </article>
          </div>
        </section>
      </div>
      <Footer />
    </>
  );
}