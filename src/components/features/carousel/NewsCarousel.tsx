import React from 'react';
import SimpleCarouselLite from './SimpleCarouselLite';
import NewsComponent from '@/components/features/news/NewsComponent';

interface NewsItem {
	slug: string;
	image: string;
	titulo: string;
	[key: string]: any;
}

interface NewsCarouselProps {
	products: NewsItem[];
}

const carouselStyle = {
	height: '100%',
	width: '100%',
	margin: 'auto'
} as const;

/**
 * Carousel component for displaying latest news articles
 */
const NewsCarousel: React.FC<NewsCarouselProps> = ({ products }) => {
	const topNews = products.slice(0, 3);

	return (
		<SimpleCarouselLite
			autoplay
			autoplaySpeed={5000}
			style={carouselStyle}
			infinite
			dots
			arrows
			className="h-full rounded-2xl shadow-xl"
		>
			{topNews.map((item) => (
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

export default React.memo(NewsCarousel);
