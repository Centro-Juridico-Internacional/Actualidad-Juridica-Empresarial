export type CarouselImage = {
	id: string;
	altImg: string;
	classNameProp: string;
	srcImg: string;
};

export interface CarouselProps {
	width: string;
	classNameProp?: string;
	dotDuration: boolean;
	autoplaySpeed?: number;
	data: CarouselImage[];
}
