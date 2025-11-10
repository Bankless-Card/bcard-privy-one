import LandingPage from "../components/landing-page";
import { usePrivy } from "@privy-io/react-auth";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import Head from "next/head";
import { Logo } from "../components/logo";
import { getRoute } from "../utils/routes";
import { useRouter } from 'next/router';


export default function HomePage() {
	const { ready, authenticated } = usePrivy();
	const [markdownContent, setMarkdownContent] = useState('');
	const router = useRouter();
	

	useEffect(() => {
		const fetchContent = async () => {
			const hash = window.location.hash.substring(1);
			const slug = hash ? hash : 'black-flag-content';
			
			try {
				const response = await fetch(`/content/${slug}.md`);
				if (!response.ok) {
					// If the specific file is not found, default to black-flag-content
					const defaultResponse = await fetch('/content/black-flag-content.md');
					const defaultText = await defaultResponse.text();
					setMarkdownContent(defaultText);
					return;
				}
				const text = await response.text();
				setMarkdownContent(text);
			} catch (error) {
				console.error('Error fetching markdown content:', error);
				// Fallback to default content on error
				const defaultResponse = await fetch('/content/black-flag-content.md');
				const defaultText = await defaultResponse.text();
				setMarkdownContent(defaultText);
			}
		};

		// Fetch content on initial load
		fetchContent();

		// Listen for Next.js router hash changes
		router.events.on('hashChangeComplete', fetchContent);

		// Cleanup event listener on component unmount
		return () => {
			router.events.off('hashChangeComplete', fetchContent);
		};
	}, [router.events]);


	// Show nothing until Privy is ready to avoid flashing content
	if (!ready) {
		return (
			<div className="bf-theme min-h-screen flex items-center justify-center">
				<div className="animate-pulse">Loading...</div>
			</div>
		);
	}

	return <LandingPage markdownContent={markdownContent} />;
}