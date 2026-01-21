declare module 'pdfjs-dist/build/pdf.mjs' {
	export interface GlobalWorkerOptions {
		workerSrc: string;
	}

	export const GlobalWorkerOptions: GlobalWorkerOptions;

	export interface DocumentInitParameters {
		url?: string;
		data?: Uint8Array;
		disableAutoFetch?: boolean;
		disableStream?: boolean;
	}

	export interface PDFDocumentProxy {
		numPages: number;
		getPage(pageNumber: number): Promise<PDFPageProxy>;
	}

	export interface PDFPageProxy {
		getViewport(options: { scale: number }): PDFPageViewport;
		render(options: { canvasContext: CanvasRenderingContext2D; viewport: PDFPageViewport }): {
			promise: Promise<void>;
		};
	}

	export interface PDFPageViewport {
		width: number;
		height: number;
	}

	export interface PDFLoadingTask {
		promise: Promise<PDFDocumentProxy>;
	}

	export function getDocument(src: string | DocumentInitParameters): PDFLoadingTask;
}
