/**
 * Representa una imagen del carrusel con su información asociada
 */
export type CarouselImage = {
	/** Identificador único de la imagen */
	id: string;
	/** Título descriptivo de la imagen */
	title: string;
	/** URL de la imagen */
	image: string;
	/** URL de destino al hacer click (opcional) */
	url?: string;
};

/**
 * Propiedades del componente Carousel
 */
export interface CarouselProps {
	/** Ancho del carrusel (puede ser en px, %, etc.) */
	width: string;
	/** Clases CSS adicionales para personalización */
	className?: string;
	/** Indica si se debe mostrar la duración en los puntos de navegación */
	dotDuration: boolean;
	/** Velocidad de reproducción automática en milisegundos */
	autoplaySpeed?: number;
	/** Indica si el carrusel y sus imágenes deben tener bordes redondeados */
	rounded?: boolean;
	/** Array de imágenes a mostrar en el carrusel */
	data: CarouselImage[];
}
