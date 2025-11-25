import React, { useEffect, useState, memo } from 'react';

interface YouTubeLiteProps {
	videoid: string;
	title: string;
}

/**
 * Componente ligero para insertar videos de YouTube con carga diferida
 *
 * Utiliza el custom element 'lite-youtube' para optimizar la carga:
 * - Carga el reproductor de YouTube solo cuando se necesita
 * - Reduce significativamente el tiempo de carga inicial
 * - Mejora el rendimiento general de la página
 *
 * Incluye manejo de errores con fallback a enlace directo de YouTube.
 *
 * @param videoid - ID del video de YouTube (ej: 'dQw4w9WgXcQ')
 * @param title - Título descriptivo del video para accesibilidad
 */

function YouTubeLite({ videoid, title }: YouTubeLiteProps) {
	const [loaded, setLoaded] = useState(false);
	const [error, setError] = useState(false);

	useEffect(() => {
		import('@justinribeiro/lite-youtube')
			.then(() => {
				setLoaded(true);
			})
			.catch(() => {
				setError(true);
				console.error('Error loading YouTube component');
			});

		// Cleanup
		return () => {
			setLoaded(false);
			setError(false);
		};
	}, []);

	if (error || !loaded) {
		return (
			<div className="flex h-full w-full items-center justify-center bg-gray-100 p-4">
				<a
					className="lite-youtube-fallback rounded-lg bg-red-600 px-4 py-2 text-white transition-colors hover:bg-red-700"
					href={`https://www.youtube.com/watch?v=${videoid}`}
					target="_blank"
					rel="noopener noreferrer"
					aria-label={`Ver en YouTube: ${title}`}
				>
					{error ? 'Error al cargar - Ver en YouTube' : 'Cargando video...'}
				</a>
			</div>
		);
	}

	return (
		<div className="flex h-full w-full items-center justify-center">
			{/* @ts-ignore */}
			<lite-youtube
				videoid={videoid}
				id={videoid}
				videotitle={title}
				videoplay="Mirar"
				posterquality="maxresdefault"
			>
				<a
					className="lite-youtube-fallback"
					href={`https://www.youtube.com/watch?v=${videoid}`}
					title={`Ver en YouTube: ${title}`}
					target="_blank"
					rel="noopener noreferrer"
				></a>
				{/* @ts-ignore */}
			</lite-youtube>
		</div>
	);
}

// Exportar componente memorizado para evitar re-renders innecesarios
export default memo(YouTubeLite);
