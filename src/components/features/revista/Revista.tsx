// filepath: src/components/home/Revista.tsx
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
	onInit: (pageFlip: any) => void;
	onFlip: (page: number) => void;
	onLoadSuccess: (data: { numPages: number }) => void;
	onLoadError: (error: Error) => void;
}

// Componente interno que NO se re-renderiza cuando cambia la página actual
const FlipBookInternal = React.memo(
	({
		pdfUrl,
		width,
		height,
		onInit,
		onFlip,
		onLoadSuccess,
		onLoadError
	}: FlipBookInternalProps) => {
		const bookRef = useRef<HTMLDivElement>(null);
		const [localNumPages, setLocalNumPages] = useState<number>(0);

		const onDocumentLoadSuccess = (data: { numPages: number }) => {
			setLocalNumPages(data.numPages);
			onLoadSuccess(data);
		};

		// Inicializar PageFlip solo cuando tengamos páginas renderizadas
		useEffect(() => {
			if (localNumPages > 0 && bookRef.current) {
				const timeout = setTimeout(() => {
					try {
						const pages = bookRef.current?.querySelectorAll('.page');
						if (pages && pages.length > 0) {
							const pageFlip = new PageFlip(bookRef.current as HTMLElement, {
								// Tamaño de UNA página (PageFlip se encarga de juntar dos)
								width,
								height,
								size: 'fixed',
								minWidth: 300,
								maxWidth: 1000,
								minHeight: 400,
								maxHeight: 1533,

								// Comportamiento tipo revista real
								showCover: true, // portada / contraportada
								usePortrait: false, // doble página en vista "libro"
								flippingTime: 900, // velocidad del giro (ms) similar a revista real
								maxShadowOpacity: 0.6, // sombras marcadas pero no exageradas
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
								onFlip(e.data + 1);
							});

							onInit(pageFlip);
						}
					} catch (err) {
						console.error('Error en PageFlip:', err);
					}
				}, 300);

				return () => clearTimeout(timeout);
			}
		}, [localNumPages, width, height]);

		// Opciones de PDF.js
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
					onLoadError={onLoadError}
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
	},
	(prev, next) =>
		prev.pdfUrl === next.pdfUrl && prev.width === next.width && prev.height === next.height
);

interface RevistaProps {
	pdfUrl: string;
	className?: string;
	width?: number;
	height?: number;
}

const Revista: React.FC<RevistaProps> = ({ pdfUrl, className = '', width = 600, height = 800 }) => {
	const [numPages, setNumPages] = useState<number>(0);
	const [currentPage, setCurrentPage] = useState<number>(1);
	const [loading, setLoading] = useState<boolean>(true);
	const [error, setError] = useState<string | null>(null);
	const pageFlipRef = useRef<any>(null);

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
		<div className={`revista-container ${className}`}>
			{/* Controles de navegación */}
			<div className="mb-6 flex flex-wrap items-center justify-center gap-4">
				<button
					onClick={goToPreviousPage}
					disabled={currentPage === 1 || loading}
					className="rounded-full bg-blue-600 px-6 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-gray-400"
				>
					← Anterior
				</button>

				<div className="shadow-panel flex items-center gap-2 rounded-full bg-white/90 px-4 py-2">
					<span className="text-sm font-medium text-gray-700">Página</span>
					<input
						type="number"
						min="1"
						max={numPages}
						value={currentPage}
						onChange={handlePageInputChange}
						className="w-16 rounded-full border border-gray-300 px-2 py-1 text-center text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
						disabled={loading}
					/>
					<span className="text-sm font-medium text-gray-700">de {numPages || '...'}</span>
				</div>

				<button
					onClick={goToNextPage}
					disabled={currentPage === numPages || loading}
					className="rounded-full bg-blue-600 px-6 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-gray-400"
				>
					Siguiente →
				</button>
			</div>

			{/* Indicador de carga */}
			{loading && (
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
			<div className="revista-inner flex w-full justify-center">
				<div className="w-full max-w-[95vw] sm:max-w-[650px] md:max-w-[900px] lg:max-w-[1100px] xl:max-w-[1300px]">
					<FlipBookInternal
						pdfUrl={pdfUrl}
						width={width}
						height={height}
						onInit={handleInit}
						onFlip={handleFlip}
						onLoadSuccess={handleLoadSuccess}
						onLoadError={handleLoadError}
					/>
				</div>
			</div>

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
          -webkit-user-select: none;
          -moz-user-select: none;
          -ms-user-select: none;
        }

        .revista-inner {
          perspective: 1600px;
        }

        .flipbook-container {
          margin: 0 auto;
          transform-style: preserve-3d;
        }

        /* --- PÁGINAS --- */

        .page {
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: #ffffff;
          border-radius: 0;
          box-shadow:
            0 10px 28px rgba(15, 23, 42, 0.22),
            0 4px 12px rgba(15, 23, 42, 0.16);
        }

        /* Portada / contraportada: bordes completos redondeados */
        .page-cover {
          border-radius: 14px;
          border: 1px solid rgba(15, 23, 42, 0.08);
        }

        /* Páginas interiores: sólo bordes EXTERNOS redondeados, unión recta */
        .page-inner.stf__item.--left {
          border-radius: 14px 0 0 14px;
        }

        .page-inner.stf__item.--right {
          border-radius: 0 14px 14px 0;
        }

        /* Single page (cuando PageFlip muestra solo una página) centrada y con radio completo */
        .stf__item.--simple {
          margin-left: auto;
          margin-right: auto;
          border-radius: 14px;
        }

        /* Wrapper del libro */
        .stf__wrapper {
          margin: 0 auto;
          border-radius: 16px;
          box-shadow:
            0 20px 55px rgba(15, 23, 42, 0.30),
            0 12px 30px rgba(15, 23, 42, 0.22);
        }

        .stf__block {
          box-shadow:
            0 2px 8px rgba(15, 23, 42, 0.14),
            0 1px 4px rgba(15, 23, 42, 0.10);
        }

        .stf__item {
          background: #ffffff;
        }

        /* Sombras del volteo controladas por PageFlip, sólo ajustamos el gradiente */
        .stf__hardPageShadow {
          background: linear-gradient(
            to right,
            rgba(0, 0, 0, 0.35) 0%,
            rgba(0, 0, 0, 0.12) 40%,
            rgba(0, 0, 0, 0) 100%
          );
        }

        .stf__softPageShadow {
          background: linear-gradient(
            to right,
            rgba(15, 23, 42, 0.18) 0%,
            rgba(15, 23, 42, 0.06) 40%,
            rgba(15, 23, 42, 0) 100%
          );
        }

        .stf__hardInnerShadow {
          background: linear-gradient(
            to left,
            rgba(0, 0, 0, 0.22) 0%,
            rgba(0, 0, 0, 0.06) 40%,
            rgba(0, 0, 0, 0) 100%
          );
        }

        .stf__pageCorner {
          background: radial-gradient(circle at 0 0,
            rgba(255, 255, 255, 0.98) 0%,
            rgba(148, 163, 184, 0.28) 40%,
            rgba(148, 163, 184, 0) 100%
          );
        }

        /* Sin animaciones ni transform en botones */
        .shadow-panel {
          box-shadow:
            0 8px 24px rgba(15, 23, 42, 0.18),
            0 3px 10px rgba(15, 23, 42, 0.10);
        }

        @media (max-width: 768px) {
          .revista-container {
            padding: 2rem 0.75rem 2.5rem;
          }

          .stf__wrapper {
            box-shadow:
              0 18px 48px rgba(15, 23, 42, 0.28),
              0 10px 26px rgba(15, 23, 42, 0.20);
          }
        }
      `}</style>
		</div>
	);
};

export default React.memo(Revista);
