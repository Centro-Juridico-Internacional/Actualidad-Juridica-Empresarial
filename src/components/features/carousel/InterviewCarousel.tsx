import React from 'react';
import SimpleCarouselLite from './SimpleCarouselLite';
import YouTubeLite from '@/components/features/media/YouTubeLite';
import type { Interview } from '@/lib/api/interviews';

interface InterviewCarouselProps {
	interviews?: Interview[];
}

const carouselStyle = {
	height: '100%',
	width: '100%',
	margin: 'auto'
} as const;

// Definición de tipo para entrevistas con URL y Título garantizados (no nulos)
type ValidInterview = Interview & { url: string; title: string };

/**
 * Componente InterviewCarousel
 * Especializado en renderizar videos de YouTube en un formato de carrusel rotativo.
 */
const InterviewCarousel: React.FC<InterviewCarouselProps> = ({ interviews = [] }) => {
	// Filtrar entrevistas inválidas y tomar las últimas 8 para asegurar contenido fresco.
	// Se aplica .reverse() porque el CMS suele entregar primero las más antiguas.
	const latestInterviews = interviews
		.filter(
			(interview): interview is ValidInterview => interview.url !== null && interview.title !== null
		)
		.slice(-8)
		.reverse();

	return (
		<SimpleCarouselLite
			autoplay
			autoplaySpeed={8000}
			style={carouselStyle}
			infinite
			arrows
			className="h-full w-full"
		>
			{latestInterviews.map((interview) => (
				<div key={interview.title} className="h-full w-full overflow-hidden rounded-3xl">
					<YouTubeLite videoid={interview.url!} title={interview.title!} />
				</div>
			))}
		</SimpleCarouselLite>
	);
};

export default React.memo(InterviewCarousel, (prevProps, nextProps) => {
	// Evitar re-renderizados innecesarios si la referencia del array no ha cambiado.
	return prevProps.interviews === nextProps.interviews;
});
