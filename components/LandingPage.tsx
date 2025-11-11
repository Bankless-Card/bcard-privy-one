import React from 'react';
import Head from 'next/head';
import LandingNavbar from './LandingNavbar';
import MarkdownWithReactComponentRenderer from './MarkdownWithReactComponentRenderer';
import Footer from './Footer';
import Header from './Header';

export default function LandingPage({ mainContent, sidebarContent, hash }: { mainContent: string, sidebarContent: string, hash: string }) {
  return (
    <>
      <Head>
        <title>We are the Black Flag</title>
        <link rel="icon" href="/favicons/favicon.ico" />
      </Head>

      <div className="bf-theme">
        <Header />
        
        <div className="content-container">
          <main className="main-content">
            <LandingNavbar hash={hash} />
            
            <div className="desktop-main-content">
              <MarkdownWithReactComponentRenderer markdownContent={mainContent} />
            </div>

            <div className="mobile-main-content">
              {hash === 'sidebar'
                ? <MarkdownWithReactComponentRenderer markdownContent={sidebarContent} />
                : <MarkdownWithReactComponentRenderer markdownContent={mainContent} />
              }
            </div>
          </main>

          <div className="sidebar">
            <MarkdownWithReactComponentRenderer markdownContent={sidebarContent} />
          </div>
        
        </div>
        
        <Footer />
      </div>
    </>
  );
}
