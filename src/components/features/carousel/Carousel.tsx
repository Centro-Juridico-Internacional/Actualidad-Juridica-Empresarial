import React from 'react';
import SimpleCarouselLite from './SimpleCarouselLite';

import type { CarouselProps } from '@/lib/types/carousel';

const carouselStyle = {
	height: '100%',
	width: '100%',
	margin: 'auto'
} as const;

/**
 * Componente Carousel
 * Renderiza una galería rotativa de imágenes utilizando SimpleCarouselLite.
 * Diseñado para ser altamente performante mediante el uso de React.memo.
 */
const Carousel: React.FC<CarouselProps> = ({ width, dotDuration, autoplaySpeed, data: DATA }) => {
	return (
		<div className={`${width} h-full overflow-hidden rounded-2xl shadow-xl`}>
			<SimpleCarouselLite
				autoplay={!!dotDuration}
				autoplaySpeed={autoplaySpeed}
				arrows
				dots
				infinite
				style={carouselStyle}
			>
				{DATA.map((item) => {
					const imageContent = (
						<img
							src={item.image}
							alt={`${item.title} imagen`}
							className="h-full w-full rounded-3xl object-cover"
							loading="lazy"
							decoding="async"
						/>
					);

					return (
						<div key={item.title} id={item.title} className="h-full w-full">
							{item.url ? (
								<a
									href={item.url}
									target="_blank"
									rel="noopener noreferrer"
									className="block h-full w-full"
								>
									{imageContent}
								</a>
							) : (
								imageContent
							)}
						</div>
					);
				})}
			</SimpleCarouselLite>
		</div>
	);
};

export default React.memo(Carousel, (prevProps, nextProps) => {
	// Solo re-renderizar si las propiedades críticas han cambiado realmente.
	// Esto optimiza el ciclo de vida del componente en arquitecturas de islas (Astro).
	return (
		prevProps.width === nextProps.width &&
		prevProps.autoplaySpeed === nextProps.autoplaySpeed &&
		prevProps.dotDuration === nextProps.dotDuration &&
		prevProps.data === nextProps.data
	);
});
