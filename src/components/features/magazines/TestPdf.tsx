import React, { useMemo, useState, useCallback } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import workerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;

type Props = {
	pdfUrl: string;
};

export default function testPdf({ pdfUrl }: Props) {
	const [numPages, setNumPages] = useState<number>(0);
	const [page, setPage] = useState<number>(1);
	const [error, setError] = useState<string | null>(null);

	// Ancho fijo para estabilidad (luego lo hacemos responsive sin que “salte”)
	const pageWidth = 920;

	const onLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
		setNumPages(numPages);
		setPage(1);
		setError(null);
	}, []);

	const onLoadError = useCallback((e: any) => {
		console.error('[testPdf] onLoadError', e);
		setError(String(e?.message ?? e));
	}, []);

	const prev = useCallback(() => setPage((p) => Math.max(1, p - 1)), []);
	const next = useCallback(
		() => setPage((p) => (numPages ? Math.min(numPages, p + 1) : p + 1)),
		[numPages]
	);

	const canPrev = page > 1;
	const canNext = numPages ? page < numPages : true;

	const options = useMemo(() => ({}), []);

	return (
		<section className="mx-auto my-10 w-full max-w-[980px] px-4">
			<div className="mb-4 text-center">
				<h2 className="text-3xl font-bold text-gray-900">Nuestra Revista</h2>
				<p className="mt-1 text-sm text-gray-600">Vista simple (paso a paso)</p>
			</div>

			<div className="mb-4 flex items-center justify-center gap-3">
				<button
					onClick={prev}
					disabled={!canPrev}
					className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm disabled:opacity-40"
				>
					← Anterior
				</button>

				<div className="rounded-full border border-gray-100 bg-white px-5 py-2 text-sm font-semibold text-gray-700 shadow-sm">
					Página {page} de {numPages || '—'}
				</div>

				<button
					onClick={next}
					disabled={!canNext}
					className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm disabled:opacity-40"
				>
					Siguiente →
				</button>
			</div>

			{error && (
				<div className="mb-4 rounded-xl bg-white p-4 text-center shadow">
					<p className="font-semibold text-red-600">Error cargando PDF: {error}</p>
				</div>
			)}

			<div className="overflow-hidden rounded-2xl bg-white shadow">
				<Document
					file={pdfUrl}
					options={options}
					onLoadSuccess={onLoadSuccess}
					onLoadError={onLoadError}
					loading={<div className="p-10 text-center text-gray-500">Cargando PDF...</div>}
				>
					<div className="flex justify-center p-4">
						<Page
							pageNumber={page}
							width={pageWidth}
							renderTextLayer={false}
							renderAnnotationLayer={false}
							loading={<div className="p-10 text-gray-500">Cargando página…</div>}
						/>
					</div>
				</Document>
			</div>
		</section>
	);
}
