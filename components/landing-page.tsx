import React from 'react';
import Head from 'next/head';
//import LandingNavbar from './landing-navbar';
import BlackFlagSite from './black-flag-site';
import Vote from './Vote';
import Footer from './footer';
import Header from './header';

export default function LandingPage({ markdownContent }: { markdownContent: string }) {
  return (
    <>
      <Head>
        <title>We are the Black Flag</title>
        <link rel="icon" href="/favicons/favicon.ico" />
      </Head>

      <div className="bf-theme">
        <Header />
        {/* <LandingNavbar /> */}
        
        <div className="content-container">
          <main className="main-content">
            <BlackFlagSite markdownContent={markdownContent} />
          </main>

          
          <div className="sidebar">
            {<Vote />}
          </div>
        
        </div>
        
        <Footer />
      </div>
    </>
  );
}
