import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import LandingNavbar from './landing-navbar';

export default function LandingPage() {
  return (
    <>
      <Head>
        <title>Welcome to BCard · Privy</title>
      </Head>

      <div className="min-h-screen flex flex-col">
        <LandingNavbar />
        
        <main className="flex-grow">
          <div className="relative px-6 lg:px-8">
            <div className="mx-auto max-w-3xl pt-20 pb-32 sm:pt-48 sm:pb-40">
              <div>
                <div className="hidden sm:mb-8 sm:flex sm:justify-center">
                  <div className="relative overflow-hidden rounded-full py-1.5 px-4 text-sm leading-6 ring-1 ring-gray-900/10 hover:ring-gray-900/20">
                    <span className="text-gray-600">
                      Welcome to BCard with Privy{" "}
                      <a href="#" className="font-semibold text-violet-600">
                        <span className="absolute inset-0" aria-hidden="true" />
                        Learn more <span aria-hidden="true">&rarr;</span>
                      </a>
                    </span>
                  </div>
                </div>
                <div>
                  <h1 className="text-4xl font-bold tracking-tight sm:text-center sm:text-6xl">
                    Your Digital Business Card Platform
                  </h1>
                  <p className="mt-6 text-lg leading-8 text-gray-600 sm:text-center">
                    Create, manage, and share your digital business cards with ease.
                    Powered by Privy for secure authentication.
                  </p>
                  <div className="mt-8 flex gap-x-4 sm:justify-center">
                    <Link
                      href="/login"
                      className="inline-block rounded-lg bg-violet-600 px-4 py-1.5 text-base font-semibold leading-7 text-white shadow-sm ring-1 ring-violet-600 hover:bg-violet-700 hover:ring-violet-700"
                    >
                      Get started
                      <span className="text-violet-200" aria-hidden="true">
                        &rarr;
                      </span>
                    </Link>
                    <Link
                      href="#features"
                      className="inline-block rounded-lg px-4 py-1.5 text-base font-semibold leading-7 text-gray-900 ring-1 ring-gray-900/10 hover:ring-gray-900/20"
                    >
                      Learn more
                      <span className="text-gray-400" aria-hidden="true">
                        &rarr;
                      </span>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
