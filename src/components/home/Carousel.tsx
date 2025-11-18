import React from 'react';
import SimpleCarouselLite from './SimpleCarouselLite';

import type { CarouselProps } from '@/lib/typesCarousel';

const CarouselComponent: React.FC<CarouselProps> = ({
	width,
	dotDuration,
	autoplaySpeed,
	data: DATA
}) => {
	return (
		<div className={`${width} rounded-xl shadow-xl`}>
			<SimpleCarouselLite
				autoplay={!!dotDuration}
				autoplaySpeed={autoplaySpeed}
				arrows
				dots
				infinite
				style={{ height: '100%', width: '100%', margin: 'auto' }}
			>
				{DATA.map((item) => {
					return (
						<div id={item.title} className="overflow-hidden rounded-2xl border-4 border-green-950">
							<img
								src={item.image}
								alt={`${item.title} imagen`}
								className={`flex h-full w-full items-center justify-center bg-green-600 object-cover`}
								loading="lazy"
								decoding="async"
							/>
						</div>
					);
				})}
			</SimpleCarouselLite>
		</div>
	);
};

export default CarouselComponent;
