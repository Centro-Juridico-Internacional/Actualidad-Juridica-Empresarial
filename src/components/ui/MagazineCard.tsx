import { useState } from 'react';

const DEFAULT_IMAGE = '/category-default.png';

interface MagazineCardProps {
	title: string;
	slug: string;
	cover: string;
	className?: string;
}

export default function MagazineCard({ title, slug, cover, className = '' }: MagazineCardProps) {
	const [imageSrc, setImageSrc] = useState(cover);

	const handleImageError = () => {
		setImageSrc(DEFAULT_IMAGE);
	};

	return (
		<article
			className={`group relative flex h-full flex-col overflow-hidden rounded-2xl bg-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl ${className}`}
		>
			{/* Imagen con overlay gradual */}
			<a href={`/revistas/${slug}`} className="relative aspect-[16/9] w-full overflow-hidden">
				<img
					src={imageSrc}
					alt={`${title} portada`}
					onError={handleImageError}
					className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
				/>
				<div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
			</a>

			{/* Contenido */}
			<div className="flex min-h-0 flex-1 flex-col p-6">
				{/* Título */}
				<h3 className="mb-3 text-xl font-bold text-gray-900 decoration-green-500 decoration-2 group-hover:text-green-600 group-hover:underline">
					<a href={`/revistas/${slug}`} className="after:absolute after:inset-0 after:z-10">
						{title}
					</a>
				</h3>

				{/* Botón de Acción (CTA) */}
				<div className="mt-auto flex items-center justify-between">
					<a
						href={`/revistas/${slug}`}
						className="inline-flex items-center rounded-full bg-green-100 px-4 py-1.5 text-sm font-medium text-green-800 transition-colors group-hover:bg-green-200"
					>
						Leer Revista
						<svg
							className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M13 7l5 5m0 0l-5 5m5-5H6"
							/>
						</svg>
					</a>
				</div>
			</div>
		</article>
	);
}
