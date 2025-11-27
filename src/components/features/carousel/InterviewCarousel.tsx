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

// Define a type for interviews with non-null url and title
type ValidInterview = Interview & { url: string; title: string };

/**
 * Carousel component for displaying YouTube interview videos
 */
const InterviewCarousel: React.FC<InterviewCarouselProps> = ({ interviews = [] }) => {
	// Filter out interviews with null url or title, then take the latest 8 and reverse
	const latestInterviews = interviews
		.filter(
			(interview): interview is ValidInterview => interview.url !== null && interview.title !== null
		)
		.slice(-8)
		.reverse();

	return (
		<SimpleCarouselLite autoplay autoplaySpeed={8000} style={carouselStyle} infinite arrows>
			{latestInterviews.map((interview) => (
				<div key={interview.title}>
					<div className="m-auto flex h-full w-full items-center justify-center text-white">
						<YouTubeLite videoid={interview.url!} title={interview.title!} />
					</div>
				</div>
			))}
		</SimpleCarouselLite>
	);
};

export default React.memo(InterviewCarousel, (prevProps, nextProps) => {
	// Only re-render if interviews array reference changes
	return prevProps.interviews === nextProps.interviews;
});
