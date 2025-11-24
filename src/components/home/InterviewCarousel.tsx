import React from 'react';
import SimpleCarouselLite from './SimpleCarouselLite';
import YouTubeLite from '@/components/home/global/YouTubeLite';

interface Interview {
	title: string;
	url: string;
}

interface InterviewCarouselProps {
	interviews?: Interview[];
}

const carouselStyle = {
	height: '100%',
	width: '100%',
	margin: 'auto'
} as const;

/**
 * Carousel component for displaying YouTube interview videos
 */
const InterviewCarousel: React.FC<InterviewCarouselProps> = ({ interviews = [] }) => {
	const latestInterviews = interviews.slice(-8).reverse();

	return (
		<SimpleCarouselLite autoplay autoplaySpeed={8000} style={carouselStyle} infinite arrows>
			{latestInterviews.map((interview) => (
				<div key={interview.title}>
					<div className="m-auto flex h-full w-full items-center justify-center text-white">
						<YouTubeLite videoid={interview.url} title={interview.title} />
					</div>
				</div>
			))}
		</SimpleCarouselLite>
	);
};

export default React.memo(InterviewCarousel);
