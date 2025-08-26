import React, { useEffect, useState } from 'react';

// Props
interface YouTubeLiteProps {
	videoid: string;
	title: string;
}

export default function YouTubeLite({ videoid, title }: YouTubeLiteProps) {
	const [loaded, setLoaded] = useState(false);

	useEffect(() => {
		import('@justinribeiro/lite-youtube').then(() => {
			setLoaded(true);
		});
	}, []);

	if (!loaded) {
		return (
			<div className="flex h-full w-full items-center justify-center">
				<a
					className="lite-youtube-fallback"
					href={`https://www.youtube.com/watch?v=${videoid}`}
					target="_blank"
					rel="noopener noreferrer"
				>
					Ver en YouTube "{title}"
				</a>
			</div>
		);
	}

	return (
		<div className="flex h-full w-full items-center justify-center">
			{/* @ts-ignore */}
			<lite-youtube
				videoid={videoid}
				id={videoid}
				videotitle={title}
				videoplay="Mirar"
				posterquality="maxresdefault"
			>
				<a
					className="lite-youtube-fallback"
					href={`https://www.youtube.com/watch?v=${videoid}`}
					title={`Ver en YouTube: ${title}`}
					target="_blank"
					rel="noopener noreferrer"
				></a>
				{/* @ts-ignore */}
			</lite-youtube>
		</div>
	);
}
