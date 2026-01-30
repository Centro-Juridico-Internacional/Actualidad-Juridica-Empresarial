import React, { useEffect, useState } from 'react';

export default function ScrollToTop() {
	const [isVisible, setIsVisible] = useState(false);

	useEffect(() => {
		// Alternar visibilidad basado en el umbral de scroll de 300px
		const toggleVisibility = () => {
			if (window.scrollY > 300) {
				setIsVisible(true);
			} else {
				setIsVisible(false);
			}
		};

		window.addEventListener('scroll', toggleVisibility);
		return () => window.removeEventListener('scroll', toggleVisibility);
	}, []);

	// Ejecutar desplazamiento suave (smooth scroll) hacia la coordenada superior
	const scrollToTop = () => {
		window.scrollTo({
			top: 0,
			behavior: 'smooth'
		});
	};

	return (
		<div className="animate-fade-in no-print fixed right-4 bottom-8 z-9999999 lg:right-8 lg:bottom-8">
			{isVisible && (
				<button
					onClick={scrollToTop}
					className="bg-primary-600 hover:bg-primary-700 focus:ring-primary-300 transform cursor-pointer rounded-full p-3 text-white shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl focus:ring-4 focus:outline-none"
					aria-label="Volver arriba"
				>
					<svg
						className="h-6 w-6"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
						xmlns="http://www.w3.org/2000/svg"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth="2"
							d="M5 10l7-7m0 0l7 7m-7-7v18"
						></path>
					</svg>
				</button>
			)}
		</div>
	);
}
