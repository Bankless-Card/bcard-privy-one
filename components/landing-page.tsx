import React from 'react';
import Head from 'next/head';
import LandingNavbar from './landing-navbar';
import BlackFlagSite from './black-flag-site';
import Footer from './footer';

export default function LandingPage({ markdownContent }: { markdownContent: string }) {
  return (
    <>
      <Head>
        <title>Black Flag · BCard</title>
      </Head>

      <div className="bf-theme min-h-screen flex flex-col">
        <LandingNavbar />
        
        <main className="flex-grow">
          <BlackFlagSite markdownContent={markdownContent} />
        </main>
        
        <Footer />
      </div>
    </>
  );
}
