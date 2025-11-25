export type CarouselImage = {
	id: string;
	title: string;
	image: string;
};

export interface CarouselProps {
	width: string;
	classNameProp?: string;
	dotDuration: boolean;
	autoplaySpeed?: number;
	data: CarouselImage[];
}
