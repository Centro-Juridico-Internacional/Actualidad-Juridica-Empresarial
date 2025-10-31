import React, { useEffect, useRef, useState, useCallback } from 'react';
import type { ReactNode } from 'react';

interface SimpleCarouselProps {
	children: ReactNode[] | ReactNode;
	className?: string;
	autoplay?: boolean;
	autoplaySpeed?: number; // ms
	dots?: boolean;
	arrows?: boolean;
	infinite?: boolean;
	style?: React.CSSProperties;
}

const SimpleCarousel: React.FC<SimpleCarouselProps> = ({
	children,
	className = '',
	autoplay = false,
	autoplaySpeed = 5000,
	dots = true,
	arrows = true,
	infinite = true,
	style
}) => {
	const slides = Array.isArray(children) ? children : [children];
	const [index, setIndex] = useState(0);
	const len = slides.length;
	const timerRef = useRef<number | null>(null);
	const containerRef = useRef<HTMLDivElement | null>(null);

	const goTo = useCallback(
		(i: number) => {
			let next = i;
			if (next < 0) next = infinite ? len - 1 : 0;
			if (next >= len) next = infinite ? 0 : len - 1;
			setIndex(next);
		},
		[infinite, len]
	);

	useEffect(() => {
		if (!autoplay || len <= 1) return;
		const tick = () => {
			// use requestAnimationFrame to schedule setTimeout for smoother timing
			timerRef.current = window.setTimeout(() => {
				// advance
				setIndex((i) => (i + 1) % len);
			}, autoplaySpeed);
		};

		tick();
		return () => {
			if (timerRef.current) window.clearTimeout(timerRef.current);
		};
	}, [autoplay, autoplaySpeed, len]);

	// Pause on hover
	useEffect(() => {
		const el = containerRef.current;
		if (!el || !autoplay) return;
		const onEnter = () => {
			if (timerRef.current) window.clearTimeout(timerRef.current);
		};
		const onLeave = () => {
			timerRef.current = window.setTimeout(() => setIndex((i) => (i + 1) % len), autoplaySpeed);
		};
		el.addEventListener('mouseenter', onEnter);
		el.addEventListener('mouseleave', onLeave);
		return () => {
			el.removeEventListener('mouseenter', onEnter);
			el.removeEventListener('mouseleave', onLeave);
		};
	}, [autoplay, autoplaySpeed, len]);

	// Usar CSS personalizado para animaciones
	useEffect(() => {
		const root = containerRef.current;
		if (root) {
			root.style.setProperty('--track-width', `${len * 100}%`);
			root.style.setProperty('--track-transform', `translateX(-${(index * 100) / len}%)`);
			root.style.setProperty('--slide-width', `${100 / len}%`);
		}
	}, [len, index]);

	return (
		<div
			ref={containerRef}
			className={`carousel-container ${className}`}
			{...(style && { style })}
			role="region"
			aria-label="Carrusel de contenido"
			aria-roledescription="carrusel"
		>
			<div className="carousel-track">
				{slides.map((child, i) => (
					// @ts-ignore
					<div
						key={i}
						className="carousel-slide"
						role="group"
						aria-roledescription="diapositiva"
						aria-label={`${i + 1} de ${len}`}
						aria-hidden={i !== index}
						tabIndex={i === index ? 0 : -1}
					>
						{child}
					</div>
				))}
			</div>

			{arrows && len > 1 && (
				<>
					<button
						type="button"
						aria-label="Anterior"
						onClick={() => goTo(index - 1)}
						className="carousel-arrow carousel-arrow-prev"
						disabled={!infinite && index === 0}
					>
						<span className="sr-only">Anterior</span>
						<span aria-hidden="true">‹</span>
					</button>
					<button
						type="button"
						aria-label="Siguiente"
						onClick={() => goTo(index + 1)}
						className="carousel-arrow carousel-arrow-next"
						disabled={!infinite && index === len - 1}
					>
						<span className="sr-only">Siguiente</span>
						<span aria-hidden="true">›</span>
					</button>
				</>
			)}

			{dots && len > 1 && (
				<div className="carousel-dots" role="tablist">
					{slides.map((_, i) => (
						<button
							key={i}
							type="button"
							role="tab"
							aria-selected={i === index}
							aria-controls={`slide-${i}`}
							onClick={() => goTo(i)}
							className="carousel-dot"
						>
							<span className="sr-only">Ir a diapositiva {i + 1}</span>
						</button>
					))}
				</div>
			)}
		</div>
	);
};

export default React.memo(SimpleCarousel);
