import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import BCardIntegration from './bcard-integration';
import ReactMarkdown from 'react-markdown';

// Component registry - add your custom components here
const ComponentRegistry = {
  // Example components
  'BCardIntegration': BCardIntegration,
  'FlagEmoji': () => <span className="bf-flag text-4xl">🏴</span>,
  'LoginButton': () => (
    <div className="bf-panel inline-block">
      <Link href="/login" className="text-xl font-bold">
        Get Started with BCard <span className="bf-flag">🏴</span>
      </Link>
    </div>
  ),
  // Add more components as needed
};

// Parse component blocks from markdown
const parseComponentBlocks = (markdown: string) => {
  const parts = [];
  const componentRegex = /\{\{component:([\w]+)(?:\s+props=(\{.*?\}))?\}\}/g;
  let lastIndex = 0;
  let match;

  while ((match = componentRegex.exec(markdown)) !== null) {
    // Add text before the component
    if (match.index > lastIndex) {
      parts.push({
        type: 'markdown',
        content: markdown.substring(lastIndex, match.index)
      });
    }

    // Add the component
    const componentName = match[1];
    let props = {};
    if (match[2]) {
      try {
        props = JSON.parse(match[2]);
      } catch (e) {
        console.error(`Failed to parse props for component ${componentName}:`, e);
      }
    }

    parts.push({
      type: 'component',
      componentName,
      props
    });

    lastIndex = componentRegex.lastIndex;
  }

  // Add remaining text
  if (lastIndex < markdown.length) {
    parts.push({
      type: 'markdown',
      content: markdown.substring(lastIndex)
    });
  }

  return parts;
};

// Custom component for rendering markdown with proper styling
const MarkdownRenderer = ({ markdown }: { markdown: string }) => {
  const parts = parseComponentBlocks(markdown);
  
  return (
    <>
      {parts.map((part, index) => {
        if (part.type === 'markdown') {
          return (
            <ReactMarkdown
              key={index}
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
              {part.content}
            </ReactMarkdown>
          );
        } else if (part.type === 'component') {
          const Component = part.componentName && ComponentRegistry[part.componentName as keyof typeof ComponentRegistry];
          return Component ? <Component key={index} {...part.props} /> : 
            <div key={index} className="p-4 bg-red-800 text-white mb-4 rounded">
              Component "{part.componentName}" not found in registry
            </div>;
        }
        return null;
      })}
    </>
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
    </div>
  );
}

export default function BlackFlagSite() {
  const [markdownContent, setMarkdownContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // Fetch the markdown content when component mounts
    setIsLoading(true);
    fetch('/content/black-flag-content.md')
      .then(response => response.text())
      .then(text => {
        setMarkdownContent(text);
        setIsLoading(false);
      })
      .catch(error => {
        console.error('Error loading markdown:', error);
        setIsLoading(false);
      });
  }, []);

  if (isLoading) {
    return <div className="text-center py-20">Loading content...</div>;
  }

  return (
    <BlackFlagContent markdownContent={markdownContent} />
  );
}
