import React, { useEffect, useState } from 'react';
import Loader from './Loader';

const INITIAL_LOADER_TIME = 1000; // 1 segundo
const FAST_LOADER_TIME = 300; // 0.3 segundos

const LoaderWrapper = ({ children }: { children: React.ReactNode }) => {
	const [showLoader, setShowLoader] = useState(true);

	useEffect(() => {
		document.body.classList.add('body-loader');

		// Lee el tiempo del loader de sessionStorage o usa el inicial
		const loaderTime = sessionStorage.getItem('loaderTime');
		const time = loaderTime ? Number(loaderTime) : INITIAL_LOADER_TIME;

		const timer = setTimeout(() => {
			setShowLoader(false);
			document.body.classList.remove('body-loader');
			// Después de la primera vez, cambia el tiempo a 400ms
			sessionStorage.setItem('loaderTime', String(FAST_LOADER_TIME));
		}, time);

		// Cuando se recarga o cierra la pestaña, resetea el tiempo a 1000ms
		const resetLoaderTime = () => sessionStorage.setItem('loaderTime', String(INITIAL_LOADER_TIME));
		window.addEventListener('beforeunload', resetLoaderTime);

		return () => {
			clearTimeout(timer);
			document.body.classList.remove('body-loader');
			window.removeEventListener('beforeunload', resetLoaderTime);
		};
	}, []);

	return (
		<>
			{children}
			{showLoader && (
				<div className="force-loader fixed inset-0 z-50 flex items-center justify-center bg-white">
					<Loader />
				</div>
			)}
		</>
	);
};

export default LoaderWrapper;
