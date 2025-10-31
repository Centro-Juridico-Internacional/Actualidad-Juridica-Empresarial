import React from 'react';
import SimpleCarouselLite from './SimpleCarouselLite';
import NewsComponent from '@/components/home/NewsComponent';

const CarouselNews = ({ products }) => {
	return (
		<SimpleCarouselLite
			autoplay
			autoplaySpeed={5000}
			style={{ height: '100%', width: '100%', margin: 'auto' }} // h-full desde el padre
			infinite
			dots
			arrows
			className="h-full rounded-2xl shadow-xl"
		>
			{products.slice(0, 3).map((item) => (
				<div key={item.slug} className="relative h-full overflow-hidden rounded-2xl">
					<img
						src={item.image}
						alt={item.titulo}
						className="absolute inset-0 h-full w-full scale-[1.001] object-cover object-center transition-transform duration-700 ease-out will-change-transform group-hover:scale-105"
						loading="eager"
						decoding="async"
					/>
					<div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent" />
					<div className="relative z-10 h-full">
						<NewsComponent
							product={item}
							truncateWords={60}
							bgOverlay={true}
							className="h-full"
							showContent={true}
						/>
					</div>
				</div>
			))}
		</SimpleCarouselLite>
	);
};

export default CarouselNews;
