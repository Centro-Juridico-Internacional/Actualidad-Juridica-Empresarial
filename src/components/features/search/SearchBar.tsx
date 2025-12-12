import React, { useState, useEffect, useRef, type FormEvent } from 'react';

interface SearchBarProps {
	/** Placeholder text for the search input */
	placeholder?: string;
	/** Additional CSS classes */
	className?: string;
	/** Auto focus on mount */
	autoFocus?: boolean;
}

interface Suggestion {
	titulo: string;
	slug: string;
	autorName?: string;
	image?: string;
}

/**
 * SearchBar component with Autocomplete/Smart Suggestions
 */
const SearchBar: React.FC<SearchBarProps> = ({
	placeholder = 'Buscar artículos...',
	className = '',
	autoFocus = false
}) => {
	const [searchQuery, setSearchQuery] = useState('');
	const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
	const [showSuggestions, setShowSuggestions] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const wrapperRef = useRef<HTMLFormElement>(null);

	// Debounce logic
	useEffect(() => {
		const timer = setTimeout(async () => {
			if (searchQuery.length >= 3) {
				setIsLoading(true);
				try {
					const res = await fetch(`/api/search-suggestions?q=${encodeURIComponent(searchQuery)}`);
					if (res.ok) {
						const data = await res.json();
						setSuggestions(data.products || []);
						setShowSuggestions(true);
					}
				} catch (error) {
					console.error('Error fetching suggestions:', error);
				} finally {
					setIsLoading(false);
				}
			} else {
				setSuggestions([]);
				setShowSuggestions(false);
			}
		}, 300);

		return () => clearTimeout(timer);
	}, [searchQuery]);

	// Click outside to close
	useEffect(() => {
		function handleClickOutside(event: MouseEvent) {
			if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
				setShowSuggestions(false);
			}
		}
		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, [wrapperRef]);

	const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		handleSubmitQuery(searchQuery);
	};

	const handleSubmitQuery = (query: string) => {
		const trimmedQuery = query.trim();
		if (trimmedQuery) {
			setShowSuggestions(false);
			window.location.href = `/buscar?q=${encodeURIComponent(trimmedQuery)}`;
		}
	};

	const handleClear = () => {
		setSearchQuery('');
		setSuggestions([]);
		setShowSuggestions(false);
	};

	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === 'Escape') {
			handleClear();
			(e.target as HTMLInputElement).blur();
		}
	};

	return (
		<form ref={wrapperRef} onSubmit={handleSubmit} className={`relative ${className}`}>
			<input
				type="search"
				value={searchQuery}
				onChange={(e) => setSearchQuery(e.target.value)}
				onKeyDown={handleKeyDown}
				onFocus={() => searchQuery.length >= 3 && setShowSuggestions(true)}
				placeholder={placeholder}
				autoFocus={autoFocus}
				className="focus:ring-primary/20 w-64 rounded-full bg-gray-100 py-2 pr-10 pl-4 text-sm text-black placeholder:text-gray-500 focus:bg-white focus:ring-2 focus:outline-none dark:bg-gray-100 dark:text-black"
				aria-label="Buscar noticias"
			/>
			<button
				type="submit"
				className="hover:text-primary absolute top-1/2 right-3 -translate-y-1/2 text-gray-400 transition-colors"
				title="Buscar"
				aria-label="Buscar"
			>
				{isLoading ? (
					<svg
						className="h-5 w-5 animate-spin"
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
					>
						<circle
							className="opacity-25"
							cx="12"
							cy="12"
							r="10"
							stroke="currentColor"
							strokeWidth="4"
						></circle>
						<path
							className="opacity-75"
							fill="currentColor"
							d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
						></path>
					</svg>
				) : (
					<svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth="2"
							d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
						></path>
					</svg>
				)}
			</button>

			{/* Suggestions Dropdown */}
			{showSuggestions && suggestions.length > 0 && (
				<div className="absolute top-full right-0 left-0 z-50 mt-2 overflow-hidden rounded-xl border border-gray-100 bg-white shadow-xl">
					<ul className="max-h-80 overflow-y-auto">
						{suggestions.map((item, index) => (
							<li key={index} className="border-b border-gray-50 last:border-0">
								<a
									href={`/noticia/${item.slug}`}
									className="block flex items-center gap-3 p-3 transition-colors hover:bg-green-50"
								>
									{item.image && (
										<img
											src={item.image}
											alt=""
											className="h-10 w-10 flex-shrink-0 rounded-md object-cover"
										/>
									)}
									<div className="min-w-0 flex-1">
										<h4
											className="truncate text-sm font-medium text-gray-900"
											dangerouslySetInnerHTML={{
												__html: item.titulo.replace(
													new RegExp(`(${searchQuery})`, 'gi'),
													'<span class="text-green-600 font-bold">$1</span>'
												)
											}}
										/>
										{item.autorName && (
											<p className="truncate text-xs text-gray-500">Por: {item.autorName}</p>
										)}
									</div>
								</a>
							</li>
						))}
					</ul>
					<div className="border-t border-gray-100 bg-gray-50 p-2 text-center">
						<button
							type="submit"
							className="text-xs font-semibold text-green-700 hover:text-green-800"
						>
							Ver todos los resultados
						</button>
					</div>
				</div>
			)}
		</form>
	);
};

export default React.memo(SearchBar);
