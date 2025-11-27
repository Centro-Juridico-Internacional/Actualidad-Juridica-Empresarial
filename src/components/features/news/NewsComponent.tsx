import React, { useEffect, useRef, useState } from 'react';
import { BlocksRenderer } from '@strapi/blocks-react-renderer';
import { truncateBlocks } from '@/utils/truncateBlocks';

interface NewsComponentProps {
	product: any;
	truncateWords?: number;
	bgOverlay?: boolean;
	className?: string;
	showContent?: boolean;
	eagerImage?: boolean;
	variant?: 'default' | 'compact'; // opcional, se autoajusta si no lo pasas
}

const NewsComponent: React.FC<NewsComponentProps> = ({
	product,
	truncateWords = 30,
	bgOverlay = false,
	className = '',
	showContent = true,
	eagerImage = false,
	variant // puede venir vacío
}) => {
	if (!product) return null;

	const { blocks, truncated } = product.contenido
		? truncateBlocks(product.contenido, truncateWords)
		: { blocks: [], truncated: false };

	const autorSlug = product.autorName
		? `/autores/${product.autorName.toLowerCase().replace(/\s+/g, '_')}`
		: '#';

	// 👇 Detección automática del tamaño del contenedor
	const ref = useRef<HTMLDivElement>(null);
	const [isCompactAuto, setIsCompactAuto] = useState(false);

	useEffect(() => {
		if (!ref.current) return;
		const el = ref.current;
		const resizeObserver = new ResizeObserver(([entry]) => {
			const { height, width } = entry.contentRect;
			// Si la card es pequeña (como las de 260px de alto), activamos compact
			setIsCompactAuto(height < 320 || width < 500);
		});
		resizeObserver.observe(el);
		return () => resizeObserver.disconnect();
	}, []);

	// Si se pasa manualmente, tiene prioridad sobre la detección automática
	const isCompact = variant === 'compact' || (!variant && isCompactAuto);

	// ---------- CONTENIDO ----------
	const content = (
		<div
			ref={ref}
			className={`group flex h-full w-full flex-col justify-between ${
				isCompact ? 'p-4 sm:p-5' : 'p-6 md:p-10'
			} ${className}`}
		>
			{/* Categorías */}
			<div className={`${isCompact ? 'mb-2.5 gap-1.5' : 'mb-4 gap-2'} flex flex-wrap`}>
				{product.categorias?.map((cat: string, idx: number) => (
					<a
						key={cat + idx}
						href={`/categorias/${cat.toLowerCase().replace(/\s+/g, '_')}`}
						className={`inline-block items-center rounded-full font-semibold tracking-wide shadow-sm transition-transform duration-200 first-letter:uppercase hover:scale-[1.03] ${
							isCompact ? 'px-2 py-[2px] text-[10.5px]' : 'px-3 py-1.5 text-xs'
						} ${
							bgOverlay
								? 'bg-green-600/90 text-white hover:bg-green-500'
								: 'bg-green-100 text-green-700 hover:bg-green-200'
						}`}
					>
						{cat}
					</a>
				))}
			</div>

			{/* Título + Contenido */}
			<div className={`flex-grow ${isCompact ? 'space-y-2' : 'space-y-4'}`}>
				<a href={`/noticia/${product.slug}`} className="block">
					<h2
						className={`leading-snug font-bold tracking-tight ${
							bgOverlay ? 'text-white' : 'text-gray-900 hover:text-green-700'
						} ${isCompact ? 'text-base sm:text-lg' : 'text-xl md:text-3xl'}`}
					>
						{product.titulo}
					</h2>
				</a>

				{showContent && product.contenido && (
					<div className={`${bgOverlay ? 'opacity-90' : ''}`}>
						<div
							className={`prose max-w-none text-gray-50 ${
								isCompact ? 'prose-sm line-clamp-2' : 'prose-base md:line-clamp-3'
							}`}
						>
							<BlocksRenderer content={blocks} />
						</div>

						{truncated && (
							<a
								href={`/noticia/${product.slug}`}
								className={`mt-2 inline-flex items-center gap-1.5 font-medium ${
									bgOverlay
										? 'text-green-300 hover:text-white'
										: 'text-green-700 hover:text-green-800'
								} ${isCompact ? 'text-[13px]' : 'text-sm'}`}
							>
								Leer más
								<svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
									<path
										fillRule="evenodd"
										d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
										clipRule="evenodd"
									/>
								</svg>
							</a>
						)}
					</div>
				)}
			</div>

			{/* Autor y fecha */}
			<div
				className={`mt-5 flex items-center gap-3 border-t pt-3 ${
					bgOverlay ? 'border-white/10' : 'border-gray-100'
				}`}
			>
				{product.autorAvatar && (
					<a
						href={autorSlug}
						title={product.autorName}
						className="relative shrink-0 overflow-hidden rounded-full ring-2 ring-green-600/20 transition-transform hover:scale-105"
					>
						<img
							src={product.autorAvatar}
							alt={product.autorName}
							className={`object-cover ${
								isCompact ? 'h-8 w-8 sm:h-9 sm:w-9' : 'h-10 w-10 md:h-12 md:w-12'
							}`}
							loading="lazy"
							decoding="async"
						/>
					</a>
				)}

				<div className="flex min-w-0 flex-col">
					<a
						href={autorSlug}
						className={`truncate font-medium ${
							bgOverlay ? 'text-white hover:text-green-300' : 'text-gray-900 hover:text-green-700'
						} ${isCompact ? 'text-[13px]' : 'text-sm md:text-base'}`}
					>
						{product.autorName}
					</a>
					<time
						className={`${
							bgOverlay ? 'text-white/80' : 'text-gray-500'
						} ${isCompact ? 'text-[11px]' : 'text-xs md:text-sm'}`}
					>
						{product.dia}
					</time>
				</div>
			</div>
		</div>
	);

	// ---------- WRAPPER ----------
	if (bgOverlay) {
		return (
			<div className="relative h-full w-full overflow-hidden rounded-2xl">
				{/* Imagen de fondo */}
				<img
					src={product.image}
					alt={product.titulo}
					className="absolute inset-0 h-full w-full object-cover object-center"
					draggable={false}
					loading={eagerImage ? 'eager' : 'lazy'}
					decoding="async"
				/>
				<div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/50 to-black/80" />

				{/* Enlace principal que cubre toda la tarjeta (pero debajo del contenido interactivo) */}
				<a
					href={`/noticia/${product.slug}`}
					className="absolute inset-0 z-0"
					aria-label={`Leer más sobre ${product.titulo}`}
				/>

				{/* Contenido con z-index superior para que sus enlaces funcionen */}
				<div className="pointer-events-none relative z-10 h-full">
					{/* Hacemos que los hijos sean interactivos de nuevo */}
					<div className="pointer-events-auto h-full">{content}</div>
				</div>
			</div>
		);
	}

	return content;
};

export default React.memo(NewsComponent);
