
import { GetStaticProps, GetStaticPaths } from 'next';
import fs from 'fs';
import path from 'path';
import BlackFlagSite from '../../components/black-flag-site';
import Head from 'next/head';

type ContentPageProps = {
  markdownContent: string;
  title: string;
};

export default function ContentPage({ markdownContent, title }: ContentPageProps) {
  return (
    <>
      <Head>
        <title>{title} · BCard</title>
      </Head>
      <div className="bf-theme">
        <div className="bf-container py-10">
          <BlackFlagSite markdownContent={markdownContent} />
        </div>
      </div>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const contentDirectory = path.join(process.cwd(), 'public', 'content');
  const filenames = fs.readdirSync(contentDirectory);

  const paths = filenames
    .filter(filename => filename.endsWith('.md'))
    .map(filename => ({
      params: { slug: filename.replace(/\.md$/, '') },
    }));

  return { paths, fallback: false };
};

export const getStaticProps: GetStaticProps<ContentPageProps> = async (context) => {
  const { slug } = context.params!;
  const markdownPath = path.join(process.cwd(), 'public', 'content', `${slug}.md`);
  const markdownContent = fs.readFileSync(markdownPath, 'utf8');

  // Extract title from markdown (optional, using the first h1)
  const titleMatch = markdownContent.match(/^#\s+(.*)/);
  const title = titleMatch ? titleMatch[1] : 'BCard';

  return {
    props: {
      markdownContent,
      title,
    },
  };
};
