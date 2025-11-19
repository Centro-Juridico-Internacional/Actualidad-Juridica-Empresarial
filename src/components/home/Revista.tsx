// filepath: src/components/home/Revista.tsx
import React, { useState, useRef, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { PageFlip } from 'page-flip';

// Importar estilos necesarios para react-pdf
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Configurar el worker de PDF.js usando jsDelivr CDN (con CORS habilitado)
pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

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
	const bookRef = useRef<HTMLDivElement>(null);

	const handleLoadSuccess = ({ numPages }: { numPages: number }) => {
		console.log('PDF cargado exitosamente:', numPages, 'páginas');
		setNumPages(numPages);
		setLoading(false);
		setError(null);
	};

	const handleLoadError = (error: Error) => {
		console.error('Error cargando PDF:', error);
		setError('Error al cargar el PDF. Por favor verifica la URL del archivo.');
		setLoading(false);
	};

	// Inicializar PageFlip después de que el PDF esté cargado
	useEffect(() => {
		if (bookRef.current && numPages > 0 && !pageFlipRef.current) {
			// Esperar un momento para que los elementos Page se rendericen
			setTimeout(() => {
				try {
					const pages = document.querySelectorAll('.page');
					console.log('Páginas encontradas para PageFlip:', pages.length);
					console.log('bookRef.current:', bookRef.current);

					if (pages.length > 0 && bookRef.current) {
						console.log('Intentando inicializar PageFlip...');

						const pageFlip = new PageFlip(bookRef.current, {
							width: width,
							height: height,
							size: 'fixed' as const,
							minWidth: 300,
							maxWidth: 1000,
							minHeight: 400,
							maxHeight: 1533,
							showCover: true,
							mobileScrollSupport: true,
							swipeDistance: 30,
							flippingTime: 1000,
							usePortrait: true,
							startZIndex: 0,
							autoSize: true,
							maxShadowOpacity: 0.5,
							showPageCorners: true,
							disableFlipByClick: false
						});

						console.log('PageFlip instance created:', pageFlip);

						pageFlip.loadFromHTML(pages as any);
						console.log('loadFromHTML called');

						pageFlip.on('flip', (e: any) => {
							console.log('Page flipped to:', e.data + 1);
							setCurrentPage(e.data + 1);
						});

						pageFlipRef.current = pageFlip;
						console.log('PageFlip inicializado correctamente');
					} else {
						console.warn('No pages found or bookRef is null');
					}
				} catch (err) {
					console.error('Error inicializando PageFlip dentro del setTimeout:', err);
				}
			}, 1000); // Incrementé el timeout a 1 segundo
		}
	}, [numPages, width, height]);

	const goToPreviousPage = () => {
		if (pageFlipRef.current && currentPage > 1) {
			pageFlipRef.current.flipPrev();
		}
	};

	const goToNextPage = () => {
		if (pageFlipRef.current && currentPage < numPages) {
			pageFlipRef.current.flipNext();
		}
	};

	const goToPage = (pageNumber: number) => {
		if (pageFlipRef.current && pageNumber >= 1 && pageNumber <= numPages) {
			pageFlipRef.current.flip(pageNumber - 1);
		}
	};

	const handlePageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const pageNum = parseInt(e.target.value);
		if (!isNaN(pageNum)) {
			goToPage(pageNum);
		}
	};

	return (
		<div className={`revista-container ${className}`}>
			{/* Controles de navegación */}
			<div className="mb-6 flex items-center justify-center gap-4">
				<button
					onClick={goToPreviousPage}
					disabled={currentPage === 1 || loading}
					className="rounded-lg bg-blue-600 px-6 py-2 text-white shadow-lg transition-colors duration-200 hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400"
					aria-label="Página anterior"
				>
					← Anterior
				</button>

				<div className="flex items-center gap-2 rounded-lg bg-white px-4 py-2 shadow-md">
					<span className="font-medium text-gray-700">Página</span>
					<input
						type="number"
						min="1"
						max={numPages}
						value={currentPage}
						onChange={handlePageInputChange}
						className="w-16 rounded border border-gray-300 px-2 py-1 text-center focus:ring-2 focus:ring-blue-500 focus:outline-none"
						disabled={loading}
						aria-label="Número de página"
					/>
					<span className="font-medium text-gray-700">de {numPages || '...'}</span>
				</div>

				<button
					onClick={goToNextPage}
					disabled={currentPage === numPages || loading}
					className="rounded-lg bg-blue-600 px-6 py-2 text-white shadow-lg transition-colors duration-200 hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400"
					aria-label="Página siguiente"
				>
					Siguiente →
				</button>
			</div>

			{/* Indicador de carga */}
			{loading && (
				<div className="flex flex-col items-center justify-center py-20">
					<div className="mb-4 h-16 w-16 animate-spin rounded-full border-t-4 border-b-4 border-blue-600"></div>
					<p className="text-lg text-gray-600">Cargando revista...</p>
				</div>
			)}

			{/* Mensaje de error */}
			{error && (
				<div className="mb-4 rounded-lg border border-red-400 bg-red-100 px-6 py-4 text-red-700">
					<p className="font-bold">Error</p>
					<p>{error}</p>
				</div>
			)}

			{/* Contenedor del libro */}
			<div className="flex items-center justify-center">
				<Document
					file={pdfUrl}
					onLoadSuccess={handleLoadSuccess}
					onLoadError={handleLoadError}
					loading=""
				>
					<div ref={bookRef} className="flipbook-container">
						{numPages > 0 &&
							Array.from({ length: numPages }, (_, index) => {
								const pageNumber = index + 1;
								return (
									<div key={pageNumber} className="page bg-white shadow-2xl" data-density="hard">
										<Page
											pageNumber={pageNumber}
											width={width}
											renderTextLayer={false}
											renderAnnotationLayer={false}
											loading={
												<div className="flex h-full items-center justify-center">
													<div className="animate-pulse text-gray-400">
														Cargando página {pageNumber}...
													</div>
												</div>
											}
										/>
									</div>
								);
							})}
					</div>
				</Document>
			</div>

			{/* Barra de progreso */}
			{!loading && numPages > 0 && (
				<div className="mx-auto mt-6 w-full max-w-4xl">
					<div className="h-2 overflow-hidden rounded-full bg-gray-200">
						<div
							className="h-full bg-blue-600 transition-all duration-300 ease-out"
							style={{ width: `${(currentPage / numPages) * 100}%` }}
						/>
					</div>
					<p className="mt-2 text-center text-sm text-gray-600">
						Progreso: {Math.round((currentPage / numPages) * 100)}%
					</p>
				</div>
			)}

			<style>{`
        .flipbook-container {
          margin: 0 auto;
          transform-style: preserve-3d;
        }

        .page {
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-center;
        }

        .revista-container {
          user-select: none;
          -webkit-user-select: none;
          -moz-user-select: none;
          -ms-user-select: none;
        }

        /* Estilos mejorados para el flipbook con sombras multicapa */
        .stf__wrapper {
          box-shadow: 
            0 20px 60px rgba(0, 0, 0, 0.3),
            0 10px 30px rgba(0, 0, 0, 0.2),
            0 5px 15px rgba(0, 0, 0, 0.15);
          border-radius: 8px;
          transition: box-shadow 0.3s ease;
        }

        .stf__wrapper:hover {
          box-shadow: 
            0 25px 70px rgba(0, 0, 0, 0.35),
            0 15px 40px rgba(0, 0, 0, 0.25),
            0 8px 20px rgba(0, 0, 0, 0.2);
        }

        .stf__block {
          box-shadow: 
            0 2px 10px rgba(0, 0, 0, 0.12),
            0 1px 5px rgba(0, 0, 0, 0.08);
        }

        .stf__item {
          border: 1px solid rgba(0, 0, 0, 0.1);
          background: #fff;
        }

        /* Sombras más realistas durante el volteo */
        .stf__hardPageShadow {
          background: linear-gradient(
            to right,
            rgba(0, 0, 0, 0.4) 0%,
            rgba(0, 0, 0, 0.15) 50%,
            rgba(0, 0, 0, 0) 100%
          );
        }

        .stf__hardInnerShadow {
          background: linear-gradient(
            to left,
            rgba(0, 0, 0, 0.2) 0%,
            rgba(0, 0, 0, 0.05) 50%,
            rgba(0, 0, 0, 0) 100%
          );
        }

        /* Mejorar botones con transiciones suaves */
        button {
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }

        button:not(:disabled):hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(37, 99, 235, 0.4);
        }

        button:not(:disabled):active {
          transform: translateY(0);
          box-shadow: 0 2px 8px rgba(37, 99, 235, 0.3);
        }

        /* Animación suave para la barra de progreso */
        .transition-all {
          transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
        }

        /* Mejorar esquinas de página */
        .stf__pageCorner {
          background: linear-gradient(135deg, 
            rgba(255, 255, 255, 0.1) 0%,
            rgba(0, 0, 0, 0.05) 100%
          );
        }

        /* Responsive improvements */
        @media (max-width: 768px) {
          .stf__wrapper {
            box-shadow: 
              0 15px 45px rgba(0, 0, 0, 0.25),
              0 8px 20px rgba(0, 0, 0, 0.15);
          }
        }
      `}</style>
		</div>
	);
};

export default Revista;
