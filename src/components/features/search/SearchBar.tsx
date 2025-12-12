import React, { useState, type FormEvent } from 'react';

interface SearchBarProps {
	/** Placeholder text for the search input */
	placeholder?: string;
	/** Additional CSS classes */
	className?: string;
	/** Auto focus on mount */
	autoFocus?: boolean;
}

/**
 * SearchBar component for searching news articles
 * Redirects to /buscar page with search query as URL parameter
 */
const SearchBar: React.FC<SearchBarProps> = ({
	placeholder = 'Buscar artículos...',
	className = '',
	autoFocus = false
}) => {
	const [searchQuery, setSearchQuery] = useState('');

	const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();

		const trimmedQuery = searchQuery.trim();
		if (trimmedQuery) {
			// Redirect to search results page
			window.location.href = `/buscar?q=${encodeURIComponent(trimmedQuery)}`;
		}
	};

	const handleClear = () => {
		setSearchQuery('');
	};

	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		// Clear on Escape key
		if (e.key === 'Escape') {
			handleClear();
		}
	};

	return (
		<form onSubmit={handleSubmit} className={`relative ${className}`}>
			<input
				type="search"
				value={searchQuery}
				onChange={(e) => setSearchQuery(e.target.value)}
				onKeyDown={handleKeyDown}
				placeholder={placeholder}
				autoFocus={autoFocus}
				className="focus:ring-primary/20 w-64 rounded-full bg-gray-100 py-2 pr-10 pl-4 text-sm text-black placeholder:text-gray-500 focus:bg-white focus:ring-2 focus:outline-none dark:bg-gray-100 dark:text-black"
				aria-label="Buscar noticias"
			/>
			<button
				type="submit"
				className="hover:text-primary absolute top-1/2 right-3 -translate-y-1/2 text-gray-400 transition-colors"
				aria-label="Buscar"
			>
				<svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth="2"
						d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
					></path>
				</svg>
			</button>
		</form>
	);
};

export default React.memo(SearchBar);
