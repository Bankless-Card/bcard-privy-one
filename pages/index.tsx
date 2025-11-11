import LandingPage from "../components/LandingPage";
import { usePrivy } from "@privy-io/react-auth";
import React, { useEffect, useState } from "react";
import { useRouter } from 'next/router';

export default function HomePage() {
	const { ready } = usePrivy();
	const [mainContent, setMainContent] = useState('');
	const [sidebarContent, setSidebarContent] = useState('');
	const [hash, setHash] = useState('');
	const router = useRouter();

	useEffect(() => {
		const fetchSidebarContent = async () => {
			try {
				const response = await fetch('/content/sidebar.md');
				const text = await response.text();
				setSidebarContent(text);
			} catch (error) {
				console.error('Error fetching sidebar content:', error);
			}
		};

		fetchSidebarContent();
	}, []);

	useEffect(() => {
		const handleHashChange = async (url: string) => {
			const currentHash = url.split('#')[1] || 'home';
			setHash(currentHash);

			try {
				const response = await fetch(`/content/${currentHash}.md`);
				if (response.ok) {
					const text = await response.text();
					setMainContent(text);
				} else {
					// Fallback to about.md if the specific markdown is not found
					const fallbackResponse = await fetch('/content/about.md');
					const text = await fallbackResponse.text();
					setMainContent(text);
				}
			} catch (error) {
				console.error('Error fetching main content:', error);
			}
		};

		handleHashChange(window.location.hash);

		router.events.on('hashChangeComplete', handleHashChange);

		return () => {
			router.events.off('hashChangeComplete', handleHashChange);
		};
	}, [router.events]);

	if (!ready) {
		return (
			<div className="bf-theme min-h-screen flex items-center justify-center">
				<div className="animate-pulse">Loading...</div>
			</div>
		);
	}

	return <LandingPage mainContent={mainContent} sidebarContent={sidebarContent} hash={hash} />;
}