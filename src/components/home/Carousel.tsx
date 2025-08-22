import React from 'react';
import { Carousel } from 'antd';

import type { CarouselProps } from '@/lib/typesCarousel';

const CarouselComponent: React.FC<CarouselProps> = ({
	width,
	dotDuration,
	autoplaySpeed,
	data: DATA
}) => {
	return (
		<div className={`${width} rounded-xl shadow-xl`}>
			<Carousel
				autoplay={{ dotDuration: dotDuration }}
				dots={{
					className: ''
				}}
				autoplaySpeed={autoplaySpeed}
				arrows
				infinite
				style={{ height: '100%', width: '100%', margin: 'auto' }}
			>
				{DATA.map((item) => {
					return (
						<div id={item.id} className="overflow-hidden rounded-xl border-4 border-green-950">
							<img
								src={item.srcImg}
								alt={item.altImg}
								className={`${item.classNameProp} flex h-full w-full items-center justify-center bg-green-600 object-cover`}
							/>
						</div>
					);
				})}
			</Carousel>
		</div>
	);
};

export default CarouselComponent;
