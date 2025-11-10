import React from 'react';
import Head from 'next/head';
import LandingNavbar from './LandingNavbar';
import BlackFlagSite from './black-flag-site';
import Footer from './footer';
import Header from './header';

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
            <LandingNavbar />
            
            <div className="desktop-main-content">
              <BlackFlagSite markdownContent={mainContent} />
            </div>

            <div className="mobile-main-content">
              {hash === 'sidebar'
                ? <BlackFlagSite markdownContent={sidebarContent} />
                : <BlackFlagSite markdownContent={mainContent} />
              }
            </div>
          </main>

          <div className="sidebar">
            <BlackFlagSite markdownContent={sidebarContent} />
          </div>
        
        </div>
        
        <Footer />
      </div>
    </>
  );
}
