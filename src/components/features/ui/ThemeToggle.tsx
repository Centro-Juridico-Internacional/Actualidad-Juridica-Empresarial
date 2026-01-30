import React, { useEffect, useState } from 'react';

export default function ThemeToggle() {
	const [theme, setTheme] = useState<'light' | 'dark'>('light');

	useEffect(() => {
		// Verificar el almacenamiento local o la preferencia del sistema operativo
		// Esto garantiza que el tema se mantenga consistente entre sesiones.
		if (
			localStorage.getItem('theme') === 'dark' ||
			(!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)
		) {
			setTheme('dark');
			document.documentElement.classList.add('dark');
		} else {
			setTheme('light');
			document.documentElement.classList.remove('dark');
		}
	}, []);

	const toggleTheme = () => {
		if (theme === 'light') {
			setTheme('dark');
			document.documentElement.classList.add('dark');
			localStorage.setItem('theme', 'dark');
		} else {
			setTheme('light');
			document.documentElement.classList.remove('dark');
			localStorage.setItem('theme', 'light');
		}
	};

	return (
		<button
			onClick={toggleTheme}
			className="focus:ring-primary-200 ml-2 rounded-lg p-2 text-gray-500 transition-all duration-300 hover:bg-gray-100 focus:ring-2 focus:outline-none dark:text-gray-400 dark:hover:bg-gray-700 dark:focus:ring-gray-600"
			aria-label={theme === 'dark' ? 'Activar modo claro' : 'Activar modo oscuro'}
		>
			{theme === 'dark' ? (
				// Sun Icon
				<svg
					className="text-secondary-400 h-5 w-5"
					fill="currentColor"
					viewBox="0 0 20 20"
					xmlns="http://www.w3.org/2000/svg"
				>
					<path
						fillRule="evenodd"
						d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 100 2h1z"
						clipRule="evenodd"
					></path>
				</svg>
			) : (
				// Moon Icon
				<svg
					className="h-5 w-5 text-gray-700 dark:text-gray-200"
					fill="currentColor"
					viewBox="0 0 20 20"
					xmlns="http://www.w3.org/2000/svg"
				>
					<path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"></path>
				</svg>
			)}
		</button>
	);
}
