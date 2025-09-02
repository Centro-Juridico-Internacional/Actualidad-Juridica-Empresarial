import React from 'react';
import { Carousel } from 'antd';
import YouTubeLite from '@/components/home/global/YouTubeLite';

const Style = {
	height: '100%',
	width: '100%',
	margin: 'auto'
};

const CarouselInterview = ({ interviews = [] }) => {
	const data = interviews.slice(-8).reverse();

	return (
		<Carousel autoplay={{ dotDuration: true }} autoplaySpeed={8000} style={Style} infinite arrows>
			{data.map((item) => {
				const contentStyle = { color: '#fff' };
				return (
					<div key={item.title}>
						<div
							style={contentStyle}
							className="m-auto flex h-full w-[95%] items-center justify-center"
						>
							<YouTubeLite videoid={item.url} title={item.title} />
						</div>
					</div>
				);
			})}
		</Carousel>
	);
};

export default CarouselInterview;
