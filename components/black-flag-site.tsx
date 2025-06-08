import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import BCardIntegration from './bcard-integration';
import ReactMarkdown from 'react-markdown';

// Custom component for rendering markdown with proper styling
const MarkdownRenderer = ({ markdown }: { markdown: string }) => {
  return (
    <ReactMarkdown
      components={{
        h1: ({ node, ...props }) => <h1 className="text-4xl sm:text-5xl font-extrabold uppercase text-center tracking-tight mb-8" {...props} />,
        h2: ({ node, ...props }) => <h2 className="text-3xl font-bold mb-6 text-center" {...props} />,
        h3: ({ node, ...props }) => <h3 className="text-2xl font-bold mb-4" {...props} />,
        p: ({ node, ...props }) => <p className="text-lg mb-4" {...props} />,
        a: ({ node, ...props }) => <a className="text-white underline hover:text-gray-300" {...props} />,
        ul: ({ node, ...props }) => <ul className="list-disc pl-5 space-y-2 mb-4" {...props} />,
        ol: ({ node, ...props }) => <ol className="list-decimal pl-5 space-y-2 mb-4" {...props} />,
        li: ({ node, ...props }) => <li className="mb-1" {...props} />,
        hr: ({ node, ...props }) => <hr className="my-8 border-gray-600" {...props} />
      }}
    >
      {markdown}
    </ReactMarkdown>
  );
};

// Function to render the site content from markdown
function BlackFlagContent({ markdownContent }: { markdownContent: string }) {
  return (
    <div className="bf-container py-10">
      <div className="flex justify-center mb-8">
        <span className="bf-flag text-6xl">🏴</span>
      </div>
      
      <div className="max-w-3xl mx-auto">
        <MarkdownRenderer markdown={markdownContent} />
      </div>
      
      <BCardIntegration />
      
      <section className="text-center mt-16">
        <div className="bf-panel inline-block">
          <Link href="/login" className="text-xl font-bold">
            Get Started with BCard <span className="bf-flag">🏴</span>
          </Link>
        </div>
      </section>
    </div>
  );
}

export default function BlackFlagSite() {
  const [markdownContent, setMarkdownContent] = useState<string>('');

  useEffect(() => {
    // Fetch the markdown content when component mounts
    fetch('/content/black-flag-content.md')
      .then(response => response.text())
      .then(text => setMarkdownContent(text))
      .catch(error => console.error('Error loading markdown:', error));
  }, []);

  return (
    <BlackFlagContent markdownContent={markdownContent} />
  );
}
