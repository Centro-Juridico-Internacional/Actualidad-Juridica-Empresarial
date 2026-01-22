import React, { useState, useEffect, useRef, type FormEvent } from 'react';

interface SearchBarProps {
	placeholder?: string;
	className?: string;
	autoFocus?: boolean;
}

interface Suggestion {
	title: string;
	slug: string;
	authorName?: string;
	image?: string;
}

/**
 * Componente SearchBar con Autocompletado y Sugerencias Inteligentes
 *
 * ✔ Navegación HTML nativa (Integración con Astro)
 * ✔ Soporte para reducción de carga (Debounce)
 * ✔ Interfaz de usuario optimizada con resultados instantáneos
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

	// Obtener sugerencias de búsqueda con Debounce (Espera 300ms tras la última pulsación)
	useEffect(() => {
		const timer = setTimeout(async () => {
			if (searchQuery.trim().length >= 3) {
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

	// Cerrar el menú desplegable al hacer clic fuera del componente (Clic Externo)
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
				setShowSuggestions(false);
			}
		};
		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, []);

	const handleSubmit = (_e: FormEvent<HTMLFormElement>) => {
		setShowSuggestions(false);
	};

	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === 'Escape') {
			setSearchQuery('');
			setSuggestions([]);
			setShowSuggestions(false);
			(e.target as HTMLInputElement).blur();
		}
	};

	return (
		<form
			ref={wrapperRef}
			action="/buscar"
			method="GET"
			onSubmit={handleSubmit}
			className={`relative ${className}`}
		>
			<input
				type="search"
				name="q"
				value={searchQuery}
				onChange={(e) => setSearchQuery(e.target.value)}
				onKeyDown={handleKeyDown}
				onFocus={() => searchQuery.length >= 3 && setShowSuggestions(true)}
				placeholder={placeholder}
				autoFocus={autoFocus}
				autoComplete="off"
				className="w-64 rounded-full bg-gray-100 py-2 pr-10 pl-4 text-sm text-black placeholder:text-gray-500 focus:bg-white focus:ring-2 focus:ring-green-500/20 focus:outline-none"
				aria-label="Buscar noticias"
			/>

			<button
				type="submit"
				className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-400 hover:text-green-600"
				aria-label="Buscar"
			>
				{isLoading ? (
					<svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24">
						<circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
					</svg>
				) : (
					<svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth="2"
							d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
						/>
					</svg>
				)}
			</button>

			{/* Panel de Sugerencias Dinámicas */}
			{showSuggestions && suggestions.length > 0 && (
				<div className="absolute top-full right-0 left-0 z-50 mt-2 overflow-hidden rounded-xl border border-transparent bg-white shadow-xl">
					<ul className="max-h-72 overflow-y-auto">
						{suggestions.map((item, index) => (
							<li key={index} className="border-b last:border-0">
								<a
									href={`/noticia/${item.slug}`}
									className="flex items-center gap-3 p-3 hover:bg-green-50"
									onClick={() => setShowSuggestions(false)}
								>
									{item.image && (
										<img src={item.image} alt="" className="h-10 w-10 rounded-md object-cover" />
									)}
									<div className="min-w-0">
										<h4
											className="truncate text-sm font-medium"
											dangerouslySetInnerHTML={{
												__html: item.title.replace(
													new RegExp(`(${searchQuery})`, 'gi'),
													'<span class="text-green-600 font-bold">$1</span>'
												)
											}}
										/>
										{item.authorName && (
											<p className="truncate text-xs text-gray-500">Por: {item.authorName}</p>
										)}
									</div>
								</a>
							</li>
						))}
					</ul>

					{/* CTA FINAL */}
					<div className="cursor-pointer border-t border-green-300 bg-gray-50 p-2 text-center hover:bg-green-50">
						<button
							type="submit"
							className="cursor-pointer text-xs font-semibold text-green-700 hover:text-green-800"
						>
							Ver todos los resultados para “{searchQuery}”
						</button>
					</div>
				</div>
			)}
		</form>
	);
};

export default React.memo(SearchBar);
