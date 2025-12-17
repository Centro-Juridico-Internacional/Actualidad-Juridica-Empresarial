// filepath: src/components/features/revista/Revista.tsx
import React, { useState, useRef, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { PageFlip } from 'page-flip';

// Importar estilos necesarios para react-pdf
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Configurar el worker de PDF.js usando jsDelivr CDN (con CORS habilitado)
pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface FlipBookInternalProps {
	pdfUrl: string;
	width: number;
	height: number;
	isMobile: boolean;
	onInit: (pageFlip: any) => void;
	onFlip: (page: number) => void;
	onLoadSuccess: (data: { numPages: number }) => void;
	onLoadError: (error: Error) => void;
}

const FlipBookInternal = React.memo(
	({
		pdfUrl,
		width,
		height,
		isMobile,
		onInit,
		onFlip,
		onLoadSuccess,
		onLoadError
	}: FlipBookInternalProps) => {
		const bookRef = useRef<HTMLDivElement>(null);
		const [localNumPages, setLocalNumPages] = useState<number>(0);
		const flipInstanceRef = useRef<any>(null);

		// Guardamos callbacks en refs para NO re-inicializar PageFlip por cambios de identidad
		const onInitRef = useRef(onInit);
		const onFlipRef = useRef(onFlip);
		const onLoadSuccessRef = useRef(onLoadSuccess);
		const onLoadErrorRef = useRef(onLoadError);

		useEffect(() => {
			onInitRef.current = onInit;
		}, [onInit]);

		useEffect(() => {
			onFlipRef.current = onFlip;
		}, [onFlip]);

		useEffect(() => {
			onLoadSuccessRef.current = onLoadSuccess;
		}, [onLoadSuccess]);

		useEffect(() => {
			onLoadErrorRef.current = onLoadError;
		}, [onLoadError]);

		const onDocumentLoadSuccess = (data: { numPages: number }) => {
			setLocalNumPages(data.numPages);
			onLoadSuccessRef.current(data);
		};

		// Inicializar / reinicializar PageFlip cuando haya páginas o cambie modo (mobile/desktop)
		// ⚠️ Importante: NO depende de onFlip/onInit (por refs) para evitar recreaciones al cambiar currentPage
		useEffect(() => {
			if (localNumPages > 0 && bookRef.current) {
				const timeout = setTimeout(() => {
					try {
						const pages = bookRef.current?.querySelectorAll('.page');
						if (pages && pages.length > 0) {
							// Destruir instancia anterior si existe
							if (flipInstanceRef.current) {
								flipInstanceRef.current.destroy();
								flipInstanceRef.current = null;
							}

							const pageFlip = new PageFlip(bookRef.current as HTMLElement, {
								width,
								height,
								size: 'fixed' as any,
								minWidth: 300,
								maxWidth: 1000,
								minHeight: 400,
								maxHeight: 1533,

								showCover: true,
								// En mobile: una sola página; en desktop: doble página
								usePortrait: isMobile,

								flippingTime: 650,
								maxShadowOpacity: 0.6,
								drawShadow: true,
								showPageCorners: true,
								disableFlipByClick: false,
								clickEventForward: true,
								mobileScrollSupport: true,
								swipeDistance: 30,
								startZIndex: 20,
								autoSize: true
							});

							pageFlip.loadFromHTML(pages as any);

							pageFlip.on('flip', (e: any) => {
								// PageFlip da índice 0-based
								onFlipRef.current(e.data + 1);
							});

							flipInstanceRef.current = pageFlip;
							onInitRef.current(pageFlip);
						}
					} catch (err) {
						console.error('Error en PageFlip:', err);
					}
				}, 250);

				return () => {
					clearTimeout(timeout);
				};
			}
		}, [localNumPages, width, height, isMobile]);

		// Cleanup al desmontar
		useEffect(() => {
			return () => {
				if (flipInstanceRef.current) {
					try {
						flipInstanceRef.current.destroy();
					} catch {
						// noop
					}
					flipInstanceRef.current = null;
				}
			};
		}, []);

		const pdfOptions = React.useMemo(
			() => ({
				cMapUrl: `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/cmaps/`,
				cMapPacked: true,
				standardFontDataUrl: `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/standard_fonts/`,
				disableAutoFetch: false,
				disableStream: false,
				disableRange: false
			}),
			[]
		);

		return (
			<div className="flex items-center justify-center">
				<Document
					file={pdfUrl}
					onLoadSuccess={onDocumentLoadSuccess}
					onLoadError={(err) => onLoadErrorRef.current(err)}
					loading=""
					options={pdfOptions}
				>
					<div ref={bookRef} className="flipbook-container">
						{localNumPages > 0 &&
							Array.from({ length: localNumPages }, (_, index) => {
								const isCover = index === 0 || index === localNumPages - 1;

								return (
									<div
										key={index + 1}
										className={`page ${isCover ? 'page-cover' : 'page-inner'} bg-white`}
										data-density={isCover ? 'hard' : 'soft'}
									>
										<Page
											pageNumber={index + 1}
											width={width}
											renderTextLayer={false}
											renderAnnotationLayer={false}
											loading={
												<div className="flex h-full items-center justify-center">
													<div className="text-gray-400">Cargando...</div>
												</div>
											}
										/>
									</div>
								);
							})}
					</div>
				</Document>
			</div>
		);
	}
);

interface RevistaProps {
	pdfUrl: string;
	className: string; // obligatorio
	height: number; // obligatorio
	width?: number; // opcional, se calcula si no viene
}

// Proporción real de tus medidas
const BASE_HEIGHT = 900;
const BASE_WIDTH = 700;
const ASPECT_RATIO = BASE_WIDTH / BASE_HEIGHT;
const MOBILE_BREAKPOINT = 768; // px

const Revista: React.FC<RevistaProps> = ({ pdfUrl, className, width, height }) => {
	const [numPages, setNumPages] = useState<number>(0);
	const [currentPage, setCurrentPage] = useState<number>(1);
	const [loading, setLoading] = useState<boolean>(true);
	const [error, setError] = useState<string | null>(null);
	const pageFlipRef = useRef<any>(null);

	// Lazy-load: solo montar flipbook cuando entra al viewport
	const containerRef = useRef<HTMLDivElement>(null);
	const [isVisible, setIsVisible] = useState<boolean>(false);

	// Fullscreen
	const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

	// Detectar si es mobile por ancho de ventana
	const [isMobile, setIsMobile] = useState<boolean>(() => {
		if (typeof window === 'undefined') return false;
		return window.innerWidth <= MOBILE_BREAKPOINT;
	});

	useEffect(() => {
		const handleResize = () => {
			if (typeof window === 'undefined') return;
			setIsMobile(window.innerWidth <= MOBILE_BREAKPOINT);
		};

		window.addEventListener('resize', handleResize);
		return () => window.removeEventListener('resize', handleResize);
	}, []);

	// IntersectionObserver para lazy-load (carga el flipbook un poco antes)
	useEffect(() => {
		if (!containerRef.current) return;

		const obs = new IntersectionObserver(
			([entry]) => {
				if (entry.isIntersecting) {
					setIsVisible(true);
					obs.disconnect();
				}
			},
			{ rootMargin: '200px' }
		);

		obs.observe(containerRef.current);
		return () => obs.disconnect();
	}, []);

	// Fullscreen handlers
	useEffect(() => {
		const onFsChange = () => {
			setIsFullscreen(!!document.fullscreenElement);
		};
		document.addEventListener('fullscreenchange', onFsChange);
		return () => document.removeEventListener('fullscreenchange', onFsChange);
	}, []);

	const toggleFullscreen = async () => {
		try {
			if (!containerRef.current) return;

			if (!document.fullscreenElement) {
				await containerRef.current.requestFullscreen();
			} else {
				await document.exitFullscreen();
			}
		} catch (e) {
			console.error('Fullscreen error:', e);
		}
	};

	// Calcular proporción automáticamente
	const computedHeight = height;
	const computedWidth = width ?? Math.round(computedHeight * ASPECT_RATIO);

	// Callbacks estables (para no romper PageFlip)
	const handleInit = React.useCallback((pageFlip: any) => {
		pageFlipRef.current = pageFlip;
	}, []);

	const handleFlip = React.useCallback((page: number) => {
		setCurrentPage(page);
	}, []);

	const handleLoadSuccess = React.useCallback(({ numPages }: { numPages: number }) => {
		setNumPages(numPages);
		setLoading(false);
		setError(null);
		// Mantener currentPage consistente
		setCurrentPage((prev) => Math.min(prev, numPages || prev));
	}, []);

	const handleLoadError = React.useCallback((error: Error) => {
		console.error('Error cargando PDF:', error);
		setError('Error al cargar el PDF.');
		setLoading(false);
	}, []);

	const goToPreviousPage = () => {
		if (pageFlipRef.current) pageFlipRef.current.flipPrev();
	};

	const goToNextPage = () => {
		if (pageFlipRef.current) pageFlipRef.current.flipNext();
	};

	const goToPage = (pageNumber: number) => {
		if (pageFlipRef.current) pageFlipRef.current.flip(pageNumber - 1);
	};

	const handlePageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const pageNum = parseInt(e.target.value);
		if (!isNaN(pageNum)) goToPage(pageNum);
	};

	return (
		<div ref={containerRef} className={`revista-container ${className}`}>
			{/* Controles de navegación */}
			<div className="mb-6 flex flex-wrap items-center justify-center gap-4">
				<button
					onClick={goToPreviousPage}
					disabled={currentPage === 1 || loading}
					className="rounded-full bg-blue-600 px-6 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-gray-400"
				>
					← Anterior
				</button>

				<button
					onClick={toggleFullscreen}
					className="rounded-full bg-gray-900 px-6 py-2 text-sm font-semibold text-white transition hover:bg-gray-800"
				>
					{isFullscreen ? 'Salir pantalla completa' : 'Pantalla completa'}
				</button>

				<div className="shadow-panel flex items-center gap-2 rounded-full bg-white/90 px-4 py-2">
					<span className="text-sm font-medium text-gray-700">Página</span>
					<input
						type="number"
						min="1"
						max={numPages || 1}
						value={currentPage}
						aria-label={`Página ${currentPage}`}
						onChange={handlePageInputChange}
						className="w-16 rounded-full border border-gray-300 px-2 py-1 text-center text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
						disabled={loading}
					/>
					<span className="text-sm font-medium text-gray-700">de {numPages || '...'}</span>
				</div>

				<button
					onClick={goToNextPage}
					disabled={numPages > 0 ? currentPage === numPages || loading : loading}
					className="rounded-full bg-blue-600 px-6 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-gray-400"
				>
					Siguiente →
				</button>
			</div>

			{/* Precarga visual: primera página (rápida) mientras aún no entra a viewport */}
			{!isVisible && (
				<div className="flex flex-col items-center justify-center py-10">
					<div className="mb-3 text-sm text-gray-600">Vista previa…</div>
					<div className="rounded-md bg-white shadow-md">
						<Document file={pdfUrl} loading="">
							<Page
								pageNumber={1}
								width={computedWidth}
								renderTextLayer={false}
								renderAnnotationLayer={false}
								loading={
									<div className="flex h-[200px] w-[200px] items-center justify-center text-gray-400">
										Cargando…
									</div>
								}
							/>
						</Document>
					</div>
				</div>
			)}

			{/* Indicador de carga */}
			{isVisible && loading && (
				<div className="flex flex-col items-center justify-center py-16">
					<div className="mb-4 h-10 w-10 rounded-full border-[3px] border-blue-200 border-t-blue-600" />
					<p className="text-sm text-gray-600">Cargando revista...</p>
				</div>
			)}

			{/* Mensaje de error */}
			{error && (
				<div className="mb-4 rounded-xl border border-red-300 bg-red-50 px-6 py-4 text-sm text-red-700 shadow-sm">
					<p>{error}</p>
				</div>
			)}

			{/* FlipBook */}
			{isVisible && !error && (
				<div className="revista-inner flex w-full justify-center">
					<div className="w-full max-w-[95vw] sm:max-w-[650px] md:max-w-[900px] lg:max-w-[1100px] xl:max-w-[1300px]">
						<FlipBookInternal
							pdfUrl={pdfUrl}
							width={computedWidth}
							height={computedHeight}
							isMobile={isMobile}
							onInit={handleInit}
							onFlip={handleFlip}
							onLoadSuccess={handleLoadSuccess}
							onLoadError={handleLoadError}
						/>
					</div>
				</div>
			)}

			{/* Barra de progreso */}
			{!loading && numPages > 0 && (
				<div className="mx-auto mt-6 w-full max-w-xl">
					<div className="h-2 overflow-hidden rounded-full bg-gray-200/80">
						<div
							className="h-full rounded-full bg-blue-600"
							style={{ width: `${(currentPage / numPages) * 100}%` }}
						/>
					</div>
					<p className="mt-2 text-center text-xs text-gray-600">
						Progreso: {Math.round((currentPage / numPages) * 100)}%
					</p>
				</div>
			)}

			<style>{`
        .revista-container {
          position: relative;
          padding: 2.5rem 1rem 3rem;
          background:
            radial-gradient(circle at top, #e0ebff 0, transparent 55%),
            radial-gradient(circle at bottom, #fefce8 0, #ffffff 45%);
          user-select: none;
        }

        .revista-inner {
          perspective: 1600px;
        }

        .flipbook-container {
          margin: 0 auto;
          transform-style: preserve-3d;
        }

        /* --- PÁGINAS (revista real) --- */
        .page {
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: #ffffff;

          /* Shadow base (modo escritorio / tablet) */
          box-shadow:
            0 15px 25px rgba(0,0,0,0.18),
            0 8px 15px rgba(0,0,0,0.12),
            0 3px 6px rgba(0,0,0,0.10);

          border-radius: 0;
        }

        .page-cover {
          border-radius: 0;
          border: 1px solid rgba(0,0,0,0.05);
        }

        .page-inner {
          border-radius: 0;
        }

        /* Doble página: unión recta */
        .stf__item.--left .page-inner,
        .stf__item.--right .page-inner {
          border-radius: 0;
        }

        /* Una sola página centrada */
        .stf__item.--simple {
          margin-left: auto;
          margin-right: auto;
        }
        .stf__item.--simple .page {
          border-radius: 0;
        }

        /* Wrapper del libro sin sombras extra */
        .stf__wrapper,
        .stf__block,
        .stf__item {
          background: transparent;
          box-shadow: none;
        }

        /* Sombras del volteo (solo gradientes) */
        .stf__hardPageShadow {
          background: linear-gradient(
            to right,
            rgba(0,0,0,0.35) 0%,
            rgba(0,0,0,0.12) 40%,
            rgba(0,0,0,0) 100%
          );
        }

        .stf__softPageShadow {
          background: linear-gradient(
            to right,
            rgba(0,0,0,0.18) 0%,
            rgba(0,0,0,0.06) 40%,
            rgba(0,0,0,0) 100%
          );
        }

        .shadow-panel {
          box-shadow:
            0 8px 22px rgba(0,0,0,0.22),
            0 3px 10px rgba(0,0,0,0.12);
        }

        /* =======================
           ESTILOS ESPECÍFICOS MOBILE
           ======================= */
        @media (max-width: 768px) {
          /* Fondo más neutro y menos recargado */
          .revista-container {
            padding: 1.5rem 0.75rem 2rem;
            background: linear-gradient(to bottom, #f9fafb 0, #ffffff 60%, #f3f4f6 100%);
          }

          /* Controles de navegación en columna, centrados */
          .revista-container > .mb-6 {
            flex-direction: column;
            align-items: stretch;
            gap: 0.75rem;
            margin-bottom: 1.5rem;
          }

          .revista-container > .mb-6 button,
          .revista-container > .mb-6 .shadow-panel {
            width: 100%;
            max-width: 320px;
            margin: 0 auto;
          }

          .revista-inner {
            perspective: 1200px;
          }

          .revista-container .flipbook-container {
            max-width: 100%;
          }

          .page {
            box-shadow:
              0 12px 22px rgba(15, 23, 42, 0.18),
              0 6px 12px rgba(15, 23, 42, 0.14);
          }

          .stf__hardPageShadow,
          .stf__softPageShadow {
            opacity: 0.9;
          }

          .mx-auto.mt-6.w-full.max-w-xl {
            margin-top: 1.25rem;
          }
        }
      `}</style>
		</div>
	);
};

export default React.memo(Revista);
