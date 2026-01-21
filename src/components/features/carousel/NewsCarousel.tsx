import React from 'react';
import SimpleCarouselLite from './SimpleCarouselLite';
import NewsComponent from '@/components/features/news/NewsComponent';
import type { NewsArticle } from '@/lib/api/news';

interface NewsCarouselProps {
	products: NewsArticle[];
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
			autoplaySpeed={8000}
			style={carouselStyle}
			infinite
			dots
			arrows
			className="h-full rounded-3xl shadow-xl"
		>
			{topNews.map((item) => (
				<div key={item.slug} className="relative h-full overflow-hidden rounded-3xl">
					<img
						src={item.image || ''}
						alt={item.title}
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

export default React.memo(NewsCarousel, (prevProps, nextProps) => {
	// Only re-render if products array reference changes
	return prevProps.products === nextProps.products;
});
