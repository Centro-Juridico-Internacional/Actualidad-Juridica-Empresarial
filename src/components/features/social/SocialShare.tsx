import React, { useState } from 'react';

interface SocialShareProps {
	url: string;
	title: string;
}

export default function SocialShare({ url, title }: SocialShareProps) {
	const [copied, setCopied] = useState(false);
	const encodedUrl = encodeURIComponent(url);
	const encodedTitle = encodeURIComponent(title);

	const handleCopy = () => {
		navigator.clipboard.writeText(url);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	return (
		<div className="flex flex-wrap items-center gap-2">
			<span className="mr-2 text-sm font-medium text-gray-500">Compartir:</span>

			{/* WhatsApp */}
			<a
				href={`https://wa.me/?text=${encodedTitle}%20${encodedUrl}`}
				target="_blank"
				rel="noopener noreferrer"
				className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-green-600 transition-all duration-300 hover:bg-green-600 hover:text-white"
				aria-label="Compartir en WhatsApp"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="20"
					height="20"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeWidth="2"
					strokeLinecap="round"
					strokeLinejoin="round"
				>
					<path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21" />
					<path
						d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0 .5-.5l1-1a.5.5 0 0 0 0 1h5a.5.5 0 0 0 0-1H11a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 .5.5h4a.5.5 0 0 0 0-1h-2.7l3-3H6l-3 3v2.7a.5.5 0 0 0 1 0v-4H9v1a.5.5 0 0 0 .5.5h1a.5.5 0 0 0 .5-.5v-1H9z"
						opacity="0"
					/>
					<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
				</svg>
			</a>

			{/* LinkedIn */}
			<a
				href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`}
				target="_blank"
				rel="noopener noreferrer"
				className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-600 transition-all duration-300 hover:bg-blue-600 hover:text-white"
				aria-label="Compartir en LinkedIn"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="20"
					height="20"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeWidth="2"
					strokeLinecap="round"
					strokeLinejoin="round"
				>
					<path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
					<rect x="2" y="9" width="4" height="12" />
					<circle cx="4" cy="4" r="2" />
				</svg>
			</a>

			{/* X (Twitter) */}
			<a
				href={`https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`}
				target="_blank"
				rel="noopener noreferrer"
				className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-800 transition-all duration-300 hover:bg-black hover:text-white"
				aria-label="Compartir en X"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="18"
					height="18"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeWidth="2"
					strokeLinecap="round"
					strokeLinejoin="round"
				>
					<path d="M4 4l11.733 16h4.267l-11.733 -16z" />
					<path d="M4 20l6.768 -6.768m2.46 -2.46l6.772 -6.772" />
				</svg>
			</a>

			{/* Copy Link */}
			<button
				onClick={handleCopy}
				className="relative flex h-10 w-10 items-center justify-center rounded-full bg-gray-50 text-gray-600 transition-all duration-300 hover:bg-gray-200"
				aria-label="Copiar Enlace"
			>
				{copied ? (
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="20"
						height="20"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="2"
						strokeLinecap="round"
						strokeLinejoin="round"
						className="text-green-600"
					>
						<polyline points="20 6 9 17 4 12" />
					</svg>
				) : (
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="20"
						height="20"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="2"
						strokeLinecap="round"
						strokeLinejoin="round"
					>
						<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
						<path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
					</svg>
				)}

				{/* Tooltip */}
				<span
					className={`pointer-events-none absolute -top-10 left-1/2 -translate-x-1/2 transform rounded bg-gray-800 px-2 py-1 text-xs whitespace-nowrap text-white opacity-0 transition-opacity duration-200 ${copied ? 'opacity-100' : ''}`}
				>
					¡Copiado!
				</span>
			</button>
		</div>
	);
}
