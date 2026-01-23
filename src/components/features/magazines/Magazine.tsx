import React, { useEffect, useMemo, useRef, useState } from 'react';

// ✅ pdfjs-dist SOLO en cliente (evita DOMMatrix is not defined en SSR)
import workerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import '../../../styles/magazine.css';

// Fullscreen toggle function
const toggleFullscreen = async (element: HTMLElement | null) => {
	if (!document.fullscreenElement) {
		if (element) {
			await element.requestFullscreen();
		}
	} else {
		await document.exitFullscreen();
	}
};

type Props = {
	pdfUrl: string; // ej: /api/pdf?url=...
};

const clamp = (n: number, a: number, b: number) => Math.max(a, Math.min(b, n));
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

type Status = 'idle' | 'loading-pdf' | 'ready' | 'error';
type FlipDir = 'next' | 'prev';

type FlipState =
	// Estados de animación y capas
	| {
			active: false;
	  }
	| {
			active: true;
			dir: FlipDir;
			// Páginas involucradas en la transición (números)
			fromLeft: number | null;
			fromRight: number | null;
			toLeft: number | null;
			toRight: number | null;

			// Imágenes resueltas (DataURL en base64)
			// Capa Base (estática debajo del giro):
			baseLeftSrc: string | null;
			baseRightSrc: string | null;

			// Hoja en movimiento (giro 3D):
			flipFrontSrc: string | null; // Cara frontal (página saliente)
			flipBackSrc: string | null; // Cara posterior (página entrante)

			// Estado de la capa de superposición (Overlay)
			flipKey: string;

			// Fase de la animación: 'prep' (preparación) | 'run' (ejecución)
			phase: 'prep' | 'run';
	  };

/**
 * Componente Magazine (Flipbook Interactivo)
 *
 * Características:
 * - Escritorio: Spread de 2 páginas con animación 3D de libro real.
 * - Móvil: Vista de 1 página optimizada para estabilidad.
 * - Motor: Utiliza pdfjs-dist para renderizar PDF directamente a imágenes (DataURL).
 * - Rendimiento: Implementa precarga por lotes (batches) y sistema de cache en memoria.
 */
export default function Magazine({ pdfUrl }: Props) {
	const containerRef = useRef<HTMLDivElement>(null);
	const flipLayerRef = useRef<HTMLDivElement>(null);

	const [status, setStatus] = useState<Status>('idle');
	const [error, setError] = useState<string | null>(null);

	const [numPages, setNumPages] = useState(0);
	const [pageRatio, setPageRatio] = useState<number>(0.77);

	// Cache de renders: pageNumber -> dataURL
	const cacheRef = useRef<Map<number, string>>(new Map());

	const preloadRunId = useRef(0);

	// Índices
	const [spreadIndex, setSpreadIndex] = useState(0); // desktop
	const [mobilePage, setMobilePage] = useState(1); // mobile
	const [isMobile, setIsMobile] = useState(false);

	// Tamaños
	const [pageWidth, setPageWidth] = useState(520);

	// Estado de la capa de transición (Flip)
	const [flip, setFlip] = useState<FlipState>({ active: false });
	const animLockRef = useRef(false);

	// Touch and Click navigation for mobile
	const touchStartRef = useRef<{ x: number; y: number } | null>(null);

	// Fullscreen state
	const [isFullscreen, setIsFullscreen] = useState(false);

	// Fullscreen effect
	useEffect(() => {
		const handleFullscreenChange = () => {
			setIsFullscreen(!!document.fullscreenElement);
		};

		document.addEventListener('fullscreenchange', handleFullscreenChange);
		return () => {
			document.removeEventListener('fullscreenchange', handleFullscreenChange);
		};
	}, []);

	// ======================
	// ✅ Sizing (sin overflow)
	// ======================
	useEffect(() => {
		const el = containerRef.current;
		if (!el) return;

		const mq = window.matchMedia('(max-width: 768px)');

		const compute = () => {
			const mobile = mq.matches;
			setIsMobile(mobile);

			const gap = 0; // ✅ NO gap entre páginas
			const framePad = mobile ? 14 : 18;

			const cw = el.clientWidth;
			const stageMax = Math.min(1400, Math.max(320, cw));

			if (mobile) {
				const w = clamp(Math.floor(stageMax - framePad * 2 - 16), 280, 720);
				setPageWidth(w);
			} else {
				const w = clamp(Math.floor((stageMax - framePad * 2 - gap - 16) / 2), 320, 720);
				setPageWidth(w);
			}
		};

		compute();

		const ro = new ResizeObserver(() => compute());
		ro.observe(el);

		const onChange = () => compute();
		if ('addEventListener' in mq) mq.addEventListener('change', onChange);
		// @ts-ignore
		else mq.addListener(onChange);

		return () => {
			ro.disconnect();
			if ('removeEventListener' in mq) mq.removeEventListener('change', onChange);
			// @ts-ignore
			else mq.removeListener(onChange);
		};
	}, []);

	// ======================
	// ✅ Cargar PDF (cliente)
	// ======================
	useEffect(() => {
		let cancelled = false;

		async function run() {
			try {
				setStatus('loading-pdf');
				setError(null);

				cacheRef.current.clear();

				setNumPages(0);
				setSpreadIndex(0);
				setMobilePage(1);
				setFlip({ active: false });
				animLockRef.current = false;

				const pdfjs = await import('pdfjs-dist/build/pdf.mjs');
				pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;

				const loadingTask = pdfjs.getDocument({
					url: pdfUrl,
					disableAutoFetch: false,
					disableStream: false
				});

				const pdf = await loadingTask.promise;
				if (cancelled) return;

				setNumPages(pdf.numPages);

				const p1 = await pdf.getPage(1);
				const vp = p1.getViewport({ scale: 1 });
				const ratio = vp.width / vp.height;
				setPageRatio(ratio || 0.77);

				(window as any).__MAG_PDF__ = pdf;
				setStatus('ready');
			} catch (e: any) {
				setStatus('error');
				setError(String(e?.message ?? e));
			}
		}

		run();
		return () => {
			cancelled = true;
			preloadRunId.current += 1;
			(window as any).__MAG_PDF__ = null;
		};
	}, [pdfUrl]);

	// ======================
	// ✅ Escritorio: Pliegues (Spreads)
	// ======================
	const spreadCount = useMemo(() => {
		if (numPages <= 0) return 0;
		if (numPages === 1) return 1;
		if (numPages === 2) return 2;
		const interiorPages = numPages - 2;
		const interiorSpreads = Math.ceil(interiorPages / 2);
		return 1 + interiorSpreads + 1;
	}, [numPages]);

	function getSpreadPages(idx: number) {
		if (!numPages) return [null, null] as const;

		if (numPages === 1) return [null, 1] as const;

		if (idx === 0) return [null, 1] as const; // portada a la derecha
		if (idx === spreadCount - 1) return [numPages, null] as const; // contra a la izquierda

		const left = 2 + (idx - 1) * 2;
		const right = left + 1;
		const maxInterior = numPages - 1;

		return [left <= maxInterior ? left : null, right <= maxInterior ? right : null] as const;
	}

	const spreadPages = useMemo(
		() => getSpreadPages(spreadIndex),
		[spreadIndex, numPages, spreadCount]
	);

	// ======================
	// ✅ Móvil: Página única visible
	// ======================
	const mobileVisiblePage = useMemo(() => {
		if (!numPages) return null;
		return clamp(mobilePage, 1, numPages);
	}, [mobilePage, numPages]);

	// ======================
	// ✅ Etiqueta de navegação (Label)
	// ======================
	const label = useMemo(() => {
		if (!numPages) return '—';

		if (isMobile) {
			return `Página ${mobileVisiblePage ?? 1} de ${numPages}`;
		}

		const [l, r] = spreadPages;
		if (l && r) return `Páginas ${l}–${r} de ${numPages}`;
		if (r && !l) return `Portada (Página ${r} de ${numPages})`;
		if (l && !r) return `Contraportada (Página ${l} de ${numPages})`;
		return `Página — de ${numPages}`;
	}, [numPages, isMobile, mobileVisiblePage, spreadPages]);

	// ======================
	// ✅ Render page -> dataURL
	// ======================
	async function renderPageToDataUrl(pageNumber: number) {
		const cached = cacheRef.current.get(pageNumber);
		if (cached) return cached;

		const pdf = (window as any).__MAG_PDF__;
		if (!pdf) throw new Error('PDF no está listo en memoria.');

		const page = await pdf.getPage(pageNumber);

		const dpr = clamp(window.devicePixelRatio || 1, 1, 2);
		const scale = 1.6 * dpr;

		const viewport = page.getViewport({ scale });
		const canvas = document.createElement('canvas');
		const ctx = canvas.getContext('2d', { alpha: false });

		if (!ctx) throw new Error('No se pudo crear contexto canvas.');

		canvas.width = Math.floor(viewport.width);
		canvas.height = Math.floor(viewport.height);

		ctx.fillStyle = '#ffffff';
		ctx.fillRect(0, 0, canvas.width, canvas.height);

		await page.render({
			canvasContext: ctx,
			viewport,
			// @ts-ignore
			intent: 'display'
		}).promise;

		const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
		cacheRef.current.set(pageNumber, dataUrl);
		return dataUrl;
	}

	async function ensureSrc(pageNumber: number | null) {
		if (!pageNumber) return null;
		const cached = cacheRef.current.get(pageNumber);
		if (cached) return cached;
		return await renderPageToDataUrl(pageNumber);
	}

	// ======================
	// ✅ Precarga por lotes (Batches)
	// ======================
	useEffect(() => {
		if (status !== 'ready' || !numPages) return;

		const runId = ++preloadRunId.current;
		let cancelled = false;

		async function preloadAll() {
			const t0 = performance.now();

			const order: number[] = [];
			for (let p = 1; p <= numPages; p++) order.push(p);

			const batchSize = 2;
			let rendered = 0;
			let batch = 0;

			for (let i = 0; i < order.length; i += batchSize) {
				if (cancelled || preloadRunId.current !== runId) return;

				batch += 1;

				const chunk = order.slice(i, i + batchSize);

				await Promise.all(
					chunk.map(async (pageNumber) => {
						try {
							await renderPageToDataUrl(pageNumber);
							rendered += 1;
						} catch {
							// ignore
						}
					})
				);

				await sleep(18);
			}

			const ms = Math.round(performance.now() - t0);
		}

		preloadAll();

		return () => {
			cancelled = true;
		};
	}, [status, numPages]);

	// ======================
	// ✅ Imágenes visibles de la capa base (Base Layer)
	// ======================
	const [baseLeftSrc, setBaseLeftSrc] = useState<string | null>(null);
	const [baseRightSrc, setBaseRightSrc] = useState<string | null>(null);
	const [baseSingleSrc, setBaseSingleSrc] = useState<string | null>(null);

	useEffect(() => {
		let cancelled = false;

		async function load() {
			if (status !== 'ready') return;

			// Si hay flip activo, NO tocamos la base (para evitar “doble”)
			if (flip.active) return;

			if (isMobile) {
				const p = mobileVisiblePage;
				if (!p) return;

				const cached = cacheRef.current.get(p) ?? null;
				setBaseSingleSrc(cached);

				if (!cached) {
					const src = await renderPageToDataUrl(p);
					if (!cancelled) setBaseSingleSrc(src);
				}
				return;
			}

			const [l, r] = spreadPages;

			const lCached = l ? (cacheRef.current.get(l) ?? null) : null;
			const rCached = r ? (cacheRef.current.get(r) ?? null) : null;

			setBaseLeftSrc(lCached);
			setBaseRightSrc(rCached);

			if (l && !lCached) {
				const src = await renderPageToDataUrl(l);
				if (!cancelled) setBaseLeftSrc(src);
			}
			if (r && !rCached) {
				const src = await renderPageToDataUrl(r);
				if (!cancelled) setBaseRightSrc(src);
			}
		}

		load();
		return () => {
			cancelled = true;
		};
	}, [status, isMobile, spreadPages, mobileVisiblePage, flip.active]);

	// ======================
	// ✅ Navegación (con transición 3D estable en escritorio)
	// ======================
	const canPrev = useMemo(() => {
		if (status !== 'ready') return false;
		if (flip.active) return false;

		if (isMobile) return mobileVisiblePage ? mobileVisiblePage > 1 : false;
		return spreadIndex > 0;
	}, [status, flip.active, isMobile, mobileVisiblePage, spreadIndex]);

	const canNext = useMemo(() => {
		if (status !== 'ready') return false;
		if (flip.active) return false;

		if (isMobile) return mobileVisiblePage ? mobileVisiblePage < numPages : false;
		return spreadCount > 0 && spreadIndex < spreadCount - 1;
	}, [status, flip.active, isMobile, mobileVisiblePage, numPages, spreadIndex, spreadCount]);

	async function startFlip(dir: FlipDir) {
		if (status !== 'ready') return;
		if (animLockRef.current) return;
		if (flip.active) return;

		// Mobile: mantener estable (sin 3D por ahora). Si quieres luego lo hacemos flip 3D.
		if (isMobile) {
			if (dir === 'next') setMobilePage((p) => clamp(p + 1, 1, Math.max(1, numPages)));
			else setMobilePage((p) => clamp(p - 1, 1, Math.max(1, numPages)));
			return;
		}

		const fromIdx = spreadIndex;
		const toIdx = dir === 'next' ? spreadIndex + 1 : spreadIndex - 1;
		if (toIdx < 0 || toIdx > spreadCount - 1) return;

		animLockRef.current = true;

		const [fromLeft, fromRight] = getSpreadPages(fromIdx);
		const [toLeft, toRight] = getSpreadPages(toIdx);

		// ✅ Pre-resolver TODAS las imágenes que se necesitan para el flip
		// Para evitar “saltos” en medio de la animación.
		const [fromLeftSrc, fromRightSrc, toLeftSrc, toRightSrc] = await Promise.all([
			ensureSrc(fromLeft),
			ensureSrc(fromRight),
			ensureSrc(toLeft),
			ensureSrc(toRight)
		]);

		/**
		 * Lógica visual del flip (tipo libro real):
		 *
		 * NEXT:
		 *  - La hoja que gira es la DERECHA del spread actual.
		 *  - Frente de la hoja = fromRight
		 *  - Dorso de la hoja = toLeft
		 *  - Base debajo durante el flip:
		 *      izquierda = fromLeft (se queda)
		 *      derecha  = toRight (ya está “en el siguiente spread”, pero oculta por la hoja que gira)
		 *
		 * PREV:
		 *  - La hoja que gira es la IZQUIERDA del spread actual.
		 *  - Frente de la hoja = fromLeft
		 *  - Dorso de la hoja = toRight
		 *  - Base debajo:
		 *      izquierda = toLeft
		 *      derecha  = fromRight
		 */
		let baseL: string | null = null;
		let baseR: string | null = null;
		let front: string | null = null;
		let back: string | null = null;

		if (dir === 'next') {
			baseL = fromLeftSrc;
			baseR = toRightSrc;
			front = fromRightSrc;
			back = toLeftSrc;
		} else {
			baseL = toLeftSrc;
			baseR = fromRightSrc;
			front = fromLeftSrc;
			back = toRightSrc;
		}

		const flipKey = `${dir}:${fromIdx}->${toIdx}:${Date.now()}`;

		// 1) Montamos overlay en "prep" (sin rotar aún)
		setFlip({
			active: true,
			dir,
			fromLeft,
			fromRight,
			toLeft,
			toRight,
			baseLeftSrc: baseL,
			baseRightSrc: baseR,
			flipFrontSrc: front,
			flipBackSrc: back,
			flipKey,
			phase: 'prep'
		});

		// 2) En el siguiente frame, arrancamos la animación (phase run)
		requestAnimationFrame(() => {
			requestAnimationFrame(() => {
				setFlip((s) => (s.active ? { ...s, phase: 'run' } : s));
			});
		});
	}

	function prev() {
		startFlip('prev');
	}
	function next() {
		startFlip('next');
	}

	// ======================
	// ✅ Interacción Táctil y Clic (Mobile)
	// ======================
	const handleTouchStart = (e: React.TouchEvent) => {
		if (!isMobile) return;
		const touch = e.touches[0];
		touchStartRef.current = { x: touch.clientX, y: touch.clientY };
	};

	const handleTouchEnd = (e: React.TouchEvent) => {
		if (!isMobile || !touchStartRef.current) return;
		const touch = e.changedTouches[0];
		const deltaX = touch.clientX - touchStartRef.current.x;
		const deltaY = touch.clientY - touchStartRef.current.y;
		touchStartRef.current = null;

		// Umbral para considerar swipe (50px) y evitar swipes verticales accidentales
		if (Math.abs(deltaX) > 50 && Math.abs(deltaX) > Math.abs(deltaY)) {
			if (deltaX > 0) {
				if (canPrev) prev();
			} else {
				if (canNext) next();
			}
		}
	};

	const handleStageClick = (e: React.MouseEvent) => {
		const rect = e.currentTarget.getBoundingClientRect();
		const clickX = e.clientX - rect.left;
		const midpoint = rect.width / 2;

		if (clickX < midpoint) {
			if (canPrev) prev();
		} else {
			if (canNext) next();
		}
	};

	// Cuando termina la animación, conmutamos el spread REAL
	useEffect(() => {
		if (!flip.active) return;

		const layer = flipLayerRef.current;
		if (!layer) return;

		const onDone = (ev: TransitionEvent) => {
			// Solo nos interesa el transition del "sheet"
			if (!(ev.target instanceof HTMLElement)) return;
			if (!ev.target.classList.contains('mag-sheet')) return;

			const dir = flip.dir;
			const toIdx = dir === 'next' ? spreadIndex + 1 : spreadIndex - 1;

			// 1) Actualizar spread real
			setSpreadIndex(clamp(toIdx, 0, Math.max(0, spreadCount - 1)));

			// 2) Quitar overlay
			setFlip({ active: false });

			// 3) liberar lock
			animLockRef.current = false;
		};

		layer.addEventListener('transitionend', onDone);
		return () => {
			layer.removeEventListener('transitionend', onDone);
		};
	}, [flip.active, flip, spreadIndex, spreadCount]);

	// ======================
	// ✅ Dimensiones de Interfaz (UI)
	// ======================
	const pageHeight = useMemo(() => Math.round(pageWidth / pageRatio), [pageWidth, pageRatio]);

	const framePad = isMobile ? 14 : 18;
	const contentWidth = isMobile ? pageWidth : pageWidth * 2; // ✅ sin gap

	return (
		<div ref={containerRef} className={`mag-root ${isFullscreen ? 'mag-fullscreen' : ''}`}>
			<div className="mag-header">
				<span className="mag-kicker">EDICIÓN DIGITAL</span>
				<h2 className="mag-title">Nuestra Revista</h2>
			</div>

			<div className="mag-controls">
				<button className="mag-btn" onClick={prev} disabled={!canPrev}>
					← Anterior
				</button>

				<div className="mag-pill">{label}</div>

				<button className="mag-btn" onClick={() => toggleFullscreen(containerRef.current)}>
					{isFullscreen ? 'Salir Pantalla Completa' : 'Pantalla Completa'}
				</button>

				<button className="mag-btn" onClick={next} disabled={!canNext}>
					Siguiente →
				</button>
			</div>

			<div
				className="mag-stage"
				onTouchStart={handleTouchStart}
				onTouchEnd={handleTouchEnd}
				onClick={handleStageClick}
			>
				<div
					className={`mag-frame ${flip.active ? 'mag-frame--animating' : ''}`}
					style={{
						padding: framePad,
						width: contentWidth + framePad * 2
					}}
				>
					{/* Capa Base (Estática) - Renderiza las páginas debajo de la animación */}
					{isMobile ? (
						<div className="mag-single" style={{ height: pageHeight, width: pageWidth }}>
							<PageSlot
								key={`m:${mobileVisiblePage}`}
								kind="right"
								pageNumber={mobileVisiblePage}
								src={baseSingleSrc}
								height={pageHeight}
							/>
						</div>
					) : (
						<div className="mag-book" style={{ height: pageHeight, width: pageWidth * 2 }}>
							<div className="mag-spread" style={{ height: pageHeight, width: pageWidth * 2 }}>
								<PageSlot
									key={`baseL:${spreadPages[0]}`}
									kind="left"
									pageNumber={spreadPages[0]}
									src={baseLeftSrc}
									height={pageHeight}
								/>
								<PageSlot
									key={`baseR:${spreadPages[1]}`}
									kind="right"
									pageNumber={spreadPages[1]}
									src={baseRightSrc}
									height={pageHeight}
								/>
								<div className="mag-spine" />
							</div>

							{/* Capa de Animación (Overlay) - Solo en Escritorio */}
							{flip.active && (
								<div
									ref={flipLayerRef}
									className="mag-flip-layer"
									style={{ height: pageHeight, width: pageWidth * 2 }}
								>
									{/* Base "fantasma" controlada durante el giro para evitar saltos visuales */}
									<div
										className="mag-spread mag-spread--under"
										style={{ height: pageHeight, width: pageWidth * 2 }}
									>
										<PageSlot
											key={`underL:${flip.fromLeft}->${flip.toLeft}`}
											kind="left"
											pageNumber={flip.dir === 'next' ? flip.fromLeft : flip.toLeft}
											src={flip.baseLeftSrc}
											height={pageHeight}
										/>
										<PageSlot
											key={`underR:${flip.fromRight}->${flip.toRight}`}
											kind="right"
											pageNumber={flip.dir === 'next' ? flip.toRight : flip.fromRight}
											src={flip.baseRightSrc}
											height={pageHeight}
										/>
										<div className="mag-spine" />
									</div>

									{/* Hoja física que realiza el giro 3D */}
									<div
										key={flip.flipKey}
										className={[
											'mag-sheet',
											flip.dir === 'next' ? 'mag-sheet--next' : 'mag-sheet--prev',
											flip.phase === 'run' ? 'mag-sheet--run' : ''
										].join(' ')}
										style={{
											height: pageHeight,
											width: pageWidth
										}}
									>
										<div className="mag-face mag-face--front">
											<FaceImage src={flip.flipFrontSrc} alt="frente" />
										</div>
										<div className="mag-face mag-face--back">
											<FaceImage src={flip.flipBackSrc} alt="dorso" />
										</div>
									</div>
								</div>
							)}
						</div>
					)}
				</div>
			</div>

			{status === 'loading-pdf' && <div className="mag-hint">Cargando PDF…</div>}
			{status === 'error' && (
				<div className="mag-error">
					<b>Error:</b> {error}
				</div>
			)}
		</div>
	);
}

function FaceImage({ src, alt }: { src: string | null; alt: string }) {
	// ✅ NO renderiza <img> si no hay src (evita el icono de “imagen rota”)
	if (!src) return <div className="mag-face-blank" />;
	return <img src={src} alt={alt} className="mag-img" draggable={false} />;
}

function PageSlot({
	kind,
	pageNumber,
	src,
	height
}: {
	kind: 'left' | 'right';
	pageNumber: number | null;
	src: string | null;
	height: number;
}) {
	const isPlaceholder = !pageNumber;

	return (
		<div className={`mag-page ${isPlaceholder ? 'mag-page--placeholder' : ''}`} style={{ height }}>
			{isPlaceholder ? (
				<div className="mag-placeholder">
					<div className="mag-placeholder-inner">
						<div className="mag-placeholder-dot" />
						<div className="mag-placeholder-dot" />
						<div className="mag-placeholder-dot" />
					</div>
					<div className="mag-placeholder-text">
						{kind === 'left' ? 'Lomo / interior' : 'Lomo / interior'}
					</div>
				</div>
			) : src ? (
				<img
					key={`img:${pageNumber}`}
					src={src}
					alt={`Página ${pageNumber}`}
					className="mag-img"
					draggable={false}
				/>
			) : (
				<div className="mag-skeleton">
					<div className="mag-spinner" />
					<div className="mag-skeleton-text">Renderizando página {pageNumber}…</div>
				</div>
			)}
		</div>
	);
}
