import React, { useState, useEffect, useRef } from 'react';

interface ArticleAudioPlayerProps {
	title: string;
	content: string; // Texto plano (Sin etiquetas HTML/Markdown)
}

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5];

const ArticleAudioPlayer: React.FC<ArticleAudioPlayerProps> = ({ title, content }) => {
	const [isPlaying, setIsPlaying] = useState(false);
	const [isPaused, setIsPaused] = useState(false);
	const [speed, setSpeed] = useState(1);
	const [supported, setSupported] = useState(false);
	const [showStopTooltip, setShowStopTooltip] = useState(false);
	const [showSpeedMenu, setShowSpeedMenu] = useState(false);

	// Referencias para control de estado y orquestación de voz
	const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
	const charIndexRef = useRef<number>(0);
	const fullTextRef = useRef<string>('');
	const menuRef = useRef<HTMLDivElement>(null);
	const voicesRef = useRef<SpeechSynthesisVoice[]>([]);

	// Inicialización y limpieza del motor de síntesis
	// Configura los listeners globales para detener la voz al navegar o cerrar la pestaña.
	useEffect(() => {
		if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
			setSupported(true);
			fullTextRef.current = `${title}. ${content}`;

			// Carga de voces disponibles en el navegador (Local y Online)
			const loadVoices = () => {
				voicesRef.current = window.speechSynthesis.getVoices();
			};

			loadVoices();
			if (window.speechSynthesis.onvoiceschanged !== undefined) {
				window.speechSynthesis.onvoiceschanged = loadVoices;
			}

			// Listeners globales para detectar navegación y evitar solapamiento de audio
			const handleStopGlobal = () => {
				if (window.speechSynthesis.speaking) {
					window.speechSynthesis.cancel();
					handleReset();
				}
			};

			window.addEventListener('pagehide', handleStopGlobal);
			window.addEventListener('visibilitychange', () => {
				if (document.visibilityState === 'hidden') {
					// Opcional: Se podría pausar en lugar de detener,
					// pero se prefiere detener por privacidad del usuario.
					// handleStopGlobal();
				}
			});

			// Custom event for Astro ViewTransitions
			document.addEventListener('astro:before-preparation', handleStopGlobal);

			return () => {
				window.speechSynthesis.cancel();
				window.removeEventListener('pagehide', handleStopGlobal);
				document.removeEventListener('astro:before-preparation', handleStopGlobal);
			};
		}
	}, [title, content]);

	// Cerrar el menú de velocidad al hacer clic fuera del componente
	useEffect(() => {
		function handleClickOutside(event: MouseEvent) {
			if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
				setShowSpeedMenu(false);
			}
		}
		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, []);

	const getBestVoice = () => {
		const voices = voicesRef.current;
		if (voices.length === 0) return null;

		// 1. Prioridad: Español de Colombia (es-CO)
		const colombianVoices = voices.filter((v) => v.lang.includes('es-CO'));
		if (colombianVoices.length > 0) {
			const naturalColombian = colombianVoices.find(
				(v) => v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Online')
			);
			return naturalColombian || colombianVoices[0];
		}

		// 2. Respaldo (Fallback): Voces de Google/Microsoft Online para cualquier variante de español
		const preferredVoices = voices.filter(
			(v) =>
				v.lang.includes('es') &&
				(v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Online'))
		);
		if (preferredVoices.length > 0) return preferredVoices[0];

		// 3. Última opción: Cualquier voz disponible en español
		const spanishVoices = voices.filter((v) => v.lang.includes('es'));
		return spanishVoices.length > 0 ? spanishVoices[0] : null;
	};

	const speak = (startIndex: number, rate: number) => {
		if (!supported) return;

		// Asegurar una limpieza total antes de iniciar una nueva locución
		if (utteranceRef.current) {
			utteranceRef.current.onend = null;
			utteranceRef.current.onboundary = null;
		}

		window.speechSynthesis.cancel();

		const textToSpeak = fullTextRef.current.substring(startIndex);
		if (!textToSpeak.trim()) {
			handleReset();
			return;
		}

		// Pequeño retardo (timeout) para permitir que el motor del navegador se reinicie por completo
		setTimeout(() => {
			const utterance = new SpeechSynthesisUtterance(textToSpeak);
			const voice = getBestVoice();
			if (voice) {
				utterance.voice = voice;
				utterance.lang = voice.lang;
			} else {
				utterance.lang = 'es-ES';
			}

			utterance.rate = rate;
			utterance.pitch = 1.0;

			utterance.onboundary = (event) => {
				if (event.name === 'word') {
					charIndexRef.current = startIndex + event.charIndex;
				}
			};

			utterance.onend = () => {
				// Evitar reset si solo estamos cambiando la velocidad
				// (cancel() suele ser suficiente para disparar onend)
				if (!window.speechSynthesis.speaking) {
					handleReset();
				}
			};

			utterance.onerror = (e) => {
				if (e.error !== 'interrupted') {
					console.error('Speech error', e);
					handleReset();
				}
			};

			utteranceRef.current = utterance;
			window.speechSynthesis.speak(utterance);

			setIsPlaying(true);
			setIsPaused(false);
		}, 50);
	};

	const handleReset = () => {
		setIsPlaying(false);
		setIsPaused(false);
		charIndexRef.current = 0;
		utteranceRef.current = null;
	};

	const handlePlay = () => {
		if (isPaused) {
			window.speechSynthesis.resume();
			setIsPaused(false);
			setIsPlaying(true);
			return;
		}

		if (isPlaying) {
			window.speechSynthesis.pause();
			setIsPaused(true);
			setIsPlaying(false);
			return;
		}

		speak(charIndexRef.current, speed);
	};

	const handleStop = () => {
		if (window.speechSynthesis) {
			if (utteranceRef.current) {
				utteranceRef.current.onend = null;
				utteranceRef.current.onboundary = null;
			}
			window.speechSynthesis.cancel();
		}
		handleReset();
	};

	const handleSpeedChange = (newSpeed: number) => {
		setSpeed(newSpeed);
		setShowSpeedMenu(false);

		if (isPlaying || isPaused) {
			// Reiniciar desde el índice actual con la nueva velocidad de lectura
			speak(charIndexRef.current, newSpeed);
		}
	};

	return (
		<div
			className={`relative flex w-fit items-center gap-2 rounded-full border border-green-100 bg-white p-1.5 pr-4 shadow-sm transition-all hover:shadow-md ${!supported ? 'opacity-50 grayscale' : ''}`}
		>
			{/* Botón Play/Pause - Tamaño incrementado para mejor accesibilidad (Fitts's Law) */}
			<button
				onClick={handlePlay}
				disabled={!supported}
				className={`flex h-11 w-11 items-center justify-center rounded-full bg-green-600 text-white shadow-sm transition-all hover:bg-green-700 active:scale-95 ${!supported ? 'cursor-not-allowed' : ''}`}
				title={isPlaying ? 'Pausar' : isPaused ? 'Reanudar' : 'Escuchar noticia'}
			>
				{isPlaying ? (
					<svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2.5}
							d="M10 9v6m4-6v6"
						/>
					</svg>
				) : (
					<svg className="ml-0.5 h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2.5}
							d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
						/>
					</svg>
				)}
			</button>

			{/* Stop Button */}
			{(isPlaying || isPaused) && (
				<div className="relative">
					<button
						onClick={handleStop}
						onMouseEnter={() => setShowStopTooltip(true)}
						onMouseLeave={() => setShowStopTooltip(false)}
						className="flex h-8 w-8 items-center justify-center rounded-full bg-red-50 text-red-500 transition-colors hover:bg-red-100 hover:text-red-600"
						title="Detener reproducción"
					>
						<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2.5}
								d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
							/>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2.5}
								d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"
							/>
						</svg>
					</button>
					{showStopTooltip && (
						<div className="absolute bottom-full left-1/2 z-20 mb-2 -translate-x-1/2 rounded bg-gray-900 px-2 py-1 text-[10px] font-bold whitespace-nowrap text-white shadow-lg">
							DETENER
						</div>
					)}
				</div>
			)}

			<div className="mx-1 h-6 w-px bg-gray-100"></div>

			{/* Speed Control (Dropdown/Modal) */}
			<div className="relative" ref={menuRef}>
				<button
					onClick={() => setShowSpeedMenu(!showSpeedMenu)}
					disabled={!supported}
					className="flex h-7 min-w-[3rem] items-center justify-center gap-0.5 rounded-md border border-gray-100 bg-gray-50 text-[11px] font-bold text-gray-700 transition-colors hover:bg-green-50 hover:text-green-700"
					title="Velocidad de lectura"
				>
					{speed}x
					<svg
						className={`h-3 w-3 transition-transform ${showSpeedMenu ? 'rotate-180' : ''}`}
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
					</svg>
				</button>

				{/* Speed Menu */}
				{showSpeedMenu && (
					<div className="animate-fadeIn absolute bottom-full left-1/2 z-30 mb-2 flex w-24 -translate-x-1/2 flex-col-reverse overflow-hidden rounded-xl border border-gray-100 bg-white shadow-xl">
						{SPEEDS.map((s) => (
							<button
								key={s}
								onClick={() => handleSpeedChange(s)}
								className={`px-3 py-2 text-center text-xs font-medium transition-colors hover:bg-green-50 ${speed === s ? 'bg-green-100 font-bold text-green-800' : 'text-gray-600'}`}
							>
								{s}x {s === 1 && '(Normal)'}
							</button>
						))}
					</div>
				)}
			</div>

			{/* Texto de Estado y Feedback Visual */}
			<div className="ml-1 flex min-w-[70px] flex-col">
				<span className="text-[11px] leading-none font-bold text-gray-800">
					{isPlaying ? 'Leyendo...' : isPaused ? 'Pausado' : 'Escuchar'}
				</span>
				<div className="mt-1 h-[2px] w-full overflow-hidden rounded-full bg-gray-100">
					{isPlaying && <div className="h-full w-full animate-pulse bg-green-500"></div>}
				</div>
			</div>
		</div>
	);
};

export default ArticleAudioPlayer;
