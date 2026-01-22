import React, { useEffect, useRef, useState, useCallback } from 'react';
import type { ReactNode } from 'react';

interface SimpleCarouselProps {
	children: ReactNode[] | ReactNode;
	className?: string;
	autoplay?: boolean;
	autoplaySpeed?: number;
	dots?: boolean;
	arrows?: boolean;
	infinite?: boolean;
	showProgressBar?: boolean;
	style?: React.CSSProperties;
}

const SimpleCarouselLite: React.FC<SimpleCarouselProps> = ({
	children,
	className = '',
	autoplay = false,
	autoplaySpeed = 5000,
	dots = true,
	arrows = true,
	infinite = true,
	showProgressBar = true,
	style
}) => {
	const slides = Array.isArray(children) ? children : [children];
	const [index, setIndex] = useState(0);
	const [isPaused, setIsPaused] = useState(false);
	const len = slides.length || 1;

	const containerRef = useRef<HTMLDivElement | null>(null);
	const lastTimeRef = useRef<number>(0);
	const animationFrameRef = useRef<number | null>(null);
	const accumulatedTimeRef = useRef<number>(0);

	const goTo = useCallback(
		(i: number) => {
			let next = i;
			if (next < 0) next = infinite ? len - 1 : 0;
			if (next >= len) next = infinite ? 0 : len - 1;
			setIndex(next);
			accumulatedTimeRef.current = 0;
			// Resetear el progreso en el DOM inmediatamente para evitar parpadeos visuales
			const activeDot = containerRef.current?.querySelector(
				'.carousel-dot.is-active'
			) as HTMLElement;
			if (activeDot) activeDot.style.setProperty('--progress', '0%');
		},
		[infinite, len]
	);

	const nextSlide = useCallback(() => {
		setIndex((i) => (i + 1) % len);
		accumulatedTimeRef.current = 0;
		// Resetear el progreso en el DOM inmediatamente
		const activeDot = containerRef.current?.querySelector('.carousel-dot.is-active') as HTMLElement;
		if (activeDot) activeDot.style.setProperty('--progress', '0%');
	}, [len]);

	// Loop principal de animación para la barra de progreso y autoplay
	// Utiliza requestAnimationFrame para garantizar suavidad (60fps) sin saturar React.
	const animate = useCallback(
		(time: number) => {
			if (lastTimeRef.current === 0) {
				lastTimeRef.current = time;
			}

			const deltaTime = time - lastTimeRef.current;
			lastTimeRef.current = time;

			if (!isPaused && autoplay && len > 1) {
				accumulatedTimeRef.current += deltaTime;
				const newProgress = Math.min((accumulatedTimeRef.current / autoplaySpeed) * 100, 100);

				// Actualización directa de variables CSS en el DOM por rendimiento
				// Evita ciclos de renderizado de React en cada frame de animación.
				const activeDot = containerRef.current?.querySelector(
					'.carousel-dot.is-active'
				) as HTMLElement;
				if (activeDot) {
					activeDot.style.setProperty('--progress', `${newProgress}%`);
				}

				if (accumulatedTimeRef.current >= autoplaySpeed) {
					nextSlide();
				}
			}

			animationFrameRef.current = requestAnimationFrame(animate);
		},
		[autoplay, autoplaySpeed, isPaused, len, nextSlide]
	);

	useEffect(() => {
		animationFrameRef.current = requestAnimationFrame(animate);
		return () => {
			if (animationFrameRef.current) {
				cancelAnimationFrame(animationFrameRef.current);
			}
		};
	}, [animate]);

	// Reiniciar el temporizador al cambiar de diapositiva vía navegación manual
	useEffect(() => {
		lastTimeRef.current = 0;
	}, [index]);

	// Manejadores de eventos táctiles para soporte de Swipe (Deslizar) en móviles
	const touchStartX = useRef<number | null>(null);
	const touchCurrentX = useRef<number | null>(null);
	const minSwipeDistance = 50;

	const handleTouchStart = (e: React.TouchEvent) => {
		touchStartX.current = e.targetTouches[0].clientX;
		touchCurrentX.current = e.targetTouches[0].clientX;
		setIsPaused(true);
	};

	const handleTouchMove = (e: React.TouchEvent) => {
		touchCurrentX.current = e.targetTouches[0].clientX;
	};

	const handleTouchEnd = () => {
		if (!touchStartX.current || !touchCurrentX.current) return;

		const distance = touchStartX.current - touchCurrentX.current;
		const isSignificantSwipe = Math.abs(distance) > minSwipeDistance;

		if (isSignificantSwipe) {
			if (distance > 0) {
				// Deslizamiento a la izquierda -> siguiente diapositiva
				nextSlide();
			} else {
				// Deslizamiento a la derecha -> anterior diapositiva
				goTo(index - 1);
			}
		}

		touchStartX.current = null;
		touchCurrentX.current = null;
		setIsPaused(false);
	};

	// Variables CSS para el movimiento del 'track' del carrusel y dimensiones del slide
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
			className={`carousel-container group relative overflow-hidden ${className}`}
			style={style}
			role="region"
			aria-label="Carrusel de contenido"
			aria-roledescription="carrusel"
			onMouseEnter={() => setIsPaused(true)}
			onMouseLeave={() => setIsPaused(false)}
			onTouchStart={handleTouchStart}
			onTouchMove={handleTouchMove}
			onTouchEnd={handleTouchEnd}
		>
			{/* La barra de progreso se ha movido: ahora está integrada dentro de los puntos de navegación */}

			<div className="carousel-track">
				{slides.map((child, i) => (
					<div
						key={i}
						id={`slide-${i}`}
						className={`carousel-slide ${i === index ? 'is-active' : ''}`}
						role="group"
						aria-roledescription="diapositiva"
						aria-label={`${i + 1} de ${len}`}
						tabIndex={i === index ? 0 : -1}
					>
						<div className="carousel-slide-inner">{child}</div>
					</div>
				))}
			</div>

			{arrows && len > 1 && (
				<div className="carousel-arrows">
					<button
						type="button"
						aria-label="Anterior"
						onClick={() => goTo(index - 1)}
						className="carousel-arrow carousel-arrow-prev"
						disabled={!infinite && index === 0}
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="20"
							height="20"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2.5"
							strokeLinecap="round"
							strokeLinejoin="round"
						>
							<polyline points="15 18 9 12 15 6"></polyline>
						</svg>
					</button>
					<button
						type="button"
						aria-label="Siguiente"
						onClick={() => goTo(index + 1)}
						className="carousel-arrow carousel-arrow-next"
						disabled={!infinite && index === len - 1}
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="20"
							height="20"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2.5"
							strokeLinecap="round"
							strokeLinejoin="round"
						>
							<polyline points="9 18 15 12 9 6"></polyline>
						</svg>
					</button>
				</div>
			)}

			{dots && len > 1 && (
				<div className="carousel-dots">
					{slides.map((_, i) => (
						<button
							key={i}
							type="button"
							aria-label={`Ir a diapositiva ${i + 1}`}
							onClick={() => goTo(i)}
							className={`carousel-dot ${i === index ? 'is-active' : ''}`}
						>
							<span className="sr-only">Ir a diapositiva {i + 1}</span>
						</button>
					))}
				</div>
			)}
		</div>
	);
};

export default React.memo(SimpleCarouselLite);
