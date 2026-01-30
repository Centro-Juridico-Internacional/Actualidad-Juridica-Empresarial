import React, { useEffect, useState } from 'react';

interface ReadingProgressBarProps {
	targetId?: string;
}

export default function ReadingProgressBar({ targetId }: ReadingProgressBarProps) {
	const [progress, setProgress] = useState(0);

	useEffect(() => {
		const updateProgress = () => {
			let scrollPercent = 0;

			if (targetId) {
				const element = document.getElementById(targetId);
				if (element) {
					const rect = element.getBoundingClientRect();
					const scrollTop = window.scrollY || document.documentElement.scrollTop;
					const elementTop = rect.top + scrollTop;
					const elementHeight = element.offsetHeight;
					const windowHeight = window.innerHeight;

					// Calcular el progreso relativo al elemento contenedor específico (targetId)
					const start = elementTop;
					const end = elementHeight - windowHeight;
					const current = scrollTop - start;

					if (end > 0) {
						scrollPercent = (current / end) * 100;
					}
				}
			} else {
				// Si no hay targetId, calcular el progreso relativo a la altura total del documento (Global)
				const scrollTop = window.scrollY;
				const docHeight =
					document.documentElement.scrollHeight - document.documentElement.clientHeight;
				if (docHeight > 0) {
					scrollPercent = (scrollTop / docHeight) * 100;
				}
			}

			setProgress(Math.min(100, Math.max(0, scrollPercent)));
		};

		window.addEventListener('scroll', updateProgress, { passive: true });
		// Ejecutar una vez al montar para establecer el estado inicial de la barra
		updateProgress();

		return () => window.removeEventListener('scroll', updateProgress);
	}, [targetId]);

	return (
		<div className="pointer-events-none fixed top-0 left-0 z-100 h-1.5 w-full bg-transparent">
			<div
				className="bg-primary-600 h-full shadow-[0_0_10px_rgba(73,180,132,0.7)] transition-all duration-150 ease-out"
				style={{ width: `${progress}%` }}
			/>
		</div>
	);
}
