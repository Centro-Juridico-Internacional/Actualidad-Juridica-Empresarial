import React from 'react';
import SimpleCarouselLite from './SimpleCarouselLite';
import NewsComponent from '@/components/home/NewsComponent';

const Style = {
	height: '100%',
	width: '100%',
	margin: 'auto'
};

const CarouselNews = ({ products }) => {
	return (
		<SimpleCarouselLite
			autoplay
			autoplaySpeed={5000}
			style={Style}
			infinite
			dots
			arrows
			className="rounded-3xl shadow-2xl"
		>
			{products.slice(0, 3).map((item) => (
				<div
					key={item.slug}
					className="relative h-[18rem] transition-all duration-300 md:h-[26rem]"
				>
					<NewsComponent
						product={item}
						truncateWords={30}
						bgOverlay={true}
						className="h-full"
						showContent={true}
					/>
				</div>
			))}
		</SimpleCarouselLite>
	);
};

export default CarouselNews;
