import React from 'react';
import { BlocksRenderer } from '@strapi/blocks-react-renderer';
import { truncateBlocks } from '@/utils/truncateBlocks';

interface NewsComponentProps {
	product: any;
	truncateWords?: number;
	bgOverlay?: boolean;
	className?: string;
	showContent?: boolean;
}

const NewsComponent: React.FC<NewsComponentProps> = ({
	product,
	truncateWords = 30,
	bgOverlay = false,
	className = '',
	showContent = true
}) => {
	if (!product) return null;

	const { blocks, truncated } = product.contenido
		? truncateBlocks(product.contenido, truncateWords)
		: { blocks: [], truncated: false };

	const autorSlug = product.autorName
		? `/autores/${product.autorName.toLowerCase().replace(/\s+/g, '_')}`
		: '#';

	const content = (
		<div className={`flex h-full w-full flex-col justify-end p-4 ${className}`}>
			{/* Categorías */}
			<div className="mb-2 flex flex-wrap gap-2">
				{product.categorias &&
					product.categorias.map((cat: string, idx: number) => (
						<a
							key={cat + idx}
							href={`/categorias/${cat.toLowerCase().replace(/\s+/g, '_')}`}
							className="!inline-block !rounded-full !border !border-green-400 !bg-green-700 !px-3 !py-1 !font-mono !text-xs !font-semibold !tracking-wide !text-white !uppercase !shadow !transition hover:!bg-green-800"
						>
							{cat}
						</a>
					))}
			</div>
			{/* Título */}
			<a href={`/noticia/${product.slug}`} className="!text-green-600 hover:!underline">
				<h2 className="mb-2 text-2xl font-bold !text-white drop-shadow-lg">{product.titulo}</h2>
			</a>
			{/* Descripción */}
			{showContent && product.contenido && (
				<div className="mb-3 rounded bg-black/30 p-2 text-sm !text-gray-100">
					<BlocksRenderer content={blocks} />
					{truncated && (
						<a href={`/noticia/${product.slug}`} className="ml-2 !text-green-300 hover:!underline">
							...click para leer más
						</a>
					)}
				</div>
			)}
			{/* Autor y fecha */}
			<div className="mt-2 flex items-center gap-3">
				{product.autorAvatar && (
					<a href={autorSlug} title={product.autorName}>
						<img
							src={product.autorAvatar}
							alt={product.autorName}
							className="h-8 w-8 rounded-full !border-2 !border-white !shadow transition hover:scale-105"
						/>
					</a>
				)}
				<a
					href={autorSlug}
					className="!text-xs !font-medium !text-white transition hover:!text-green-400 hover:!underline"
				>
					{product.autorName}
				</a>
				<span className="mx-2 text-xs !text-gray-400">•</span>
				<span className="text-xs !text-gray-300">{product.dia}</span>
			</div>
		</div>
	);

	if (bgOverlay) {
		return (
			<div className="relative h-full w-full overflow-hidden">
				<img
					src={product.image}
					alt={product.titulo}
					className="absolute inset-0 h-full min-h-full w-full min-w-full object-cover object-center"
					draggable={false}
					loading="eager"
					decoding="async"
				/>
				<div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/60 to-black/80" />
				<div className="relative z-10 h-full">{content}</div>
			</div>
		);
	}

	return content;
};

export default NewsComponent;
