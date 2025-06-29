import React from 'react';
import Link from 'next/link';
import BCardIntegration from './bcard-integration';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';

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
              rehypePlugins={[rehypeRaw]}
              components={{
                h1: ({ node, ...props }) => <h1 className="" {...props} />,
                h2: ({ node, ...props }) => <h2 className=" " {...props} />,
                h3: ({ node, ...props }) => <h3 className="" {...props} />,
                p: ({ node, ...props }) => <p className="" {...props} />,
                a: ({ node, ...props }) => <a className="" target="_blank" rel="noopener noreferrer" {...props} />,
                ul: ({ node, ...props }) => <ul className="" {...props} />,
                ol: ({ node, ...props }) => <ol className="" {...props} />,
                li: ({ node, ...props }) => <li className="" {...props} />,
                hr: ({ node, ...props }) => <hr className="" {...props} />
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
    <MarkdownRenderer markdown={markdownContent} />
  );
}

export default function BlackFlagSite({ markdownContent = '' }: { markdownContent?: string }) {
  return (
    <BlackFlagContent markdownContent={markdownContent} />
  );
}
