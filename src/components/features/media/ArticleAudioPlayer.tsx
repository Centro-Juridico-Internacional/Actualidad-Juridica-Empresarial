import React, { useState, useEffect, useRef } from 'react';

interface ArticleAudioPlayerProps {
	title: string;
	content: string; // Plain text
}

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];

const ArticleAudioPlayer: React.FC<ArticleAudioPlayerProps> = ({ title, content }) => {
	const [isPlaying, setIsPlaying] = useState(false);
	const [isPaused, setIsPaused] = useState(false);
	const [speed, setSpeed] = useState(1);
	const [supported, setSupported] = useState(false);
	const [showStopTooltip, setShowStopTooltip] = useState(false);
	const [showSpeedMenu, setShowSpeedMenu] = useState(false);

	// Refs
	const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
	const charIndexRef = useRef<number>(0);
	const fullTextRef = useRef<string>('');
	const menuRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
			setSupported(true);
			fullTextRef.current = `${title}. ${content}`;
		}
		// Cleanup
		return () => {
			if (window.speechSynthesis) {
				window.speechSynthesis.cancel();
			}
		};
	}, [title, content]);

	// Close menu on click outside
	useEffect(() => {
		function handleClickOutside(event: MouseEvent) {
			if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
				setShowSpeedMenu(false);
			}
		}
		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, []);

	const speak = (startIndex: number, rate: number) => {
		if (!supported) return;

		// CRITICAL FIX: Detach previous onend listener to prevent race condition
		// where cancelling the previous speech triggers a "stop" logic that hides controls.
		if (utteranceRef.current) {
			utteranceRef.current.onend = null;
		}

		window.speechSynthesis.cancel();

		const textToSpeak = fullTextRef.current.substring(startIndex);
		if (!textToSpeak.trim()) {
			handleReset();
			return;
		}

		const utterance = new SpeechSynthesisUtterance(textToSpeak);
		utterance.lang = 'es-ES';
		utterance.rate = rate;

		utterance.onboundary = (event) => {
			if (event.name === 'word' || event.name === 'sentence') {
				charIndexRef.current = startIndex + event.charIndex;
			}
		};

		utterance.onend = () => {
			// Only reset if we are not manually restarting (state is managed manually during speed change)
			if (window.speechSynthesis.speaking === false) {
				handleReset();
			}
		};

		utterance.onerror = (e) => {
			console.error('Speech error', e);
			handleReset();
		};

		utteranceRef.current = utterance;
		window.speechSynthesis.speak(utterance);

		// Ensure state reflects playing
		setIsPlaying(true);
		setIsPaused(false);
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
			if (utteranceRef.current) utteranceRef.current.onend = null;
			window.speechSynthesis.cancel();
		}
		handleReset();
	};

	const handleSpeedChange = (newSpeed: number) => {
		setSpeed(newSpeed);
		setShowSpeedMenu(false); // Close menu

		// Instant apply if playing or paused
		if (isPlaying || isPaused) {
			speak(charIndexRef.current, newSpeed);
		}
	};

	return (
		<div
			className={`relative flex w-fit items-center gap-2 rounded-full border border-green-100 bg-white p-1.5 pr-4 shadow-sm transition-all hover:shadow-md ${!supported ? 'opacity-50 grayscale' : ''}`}
		>
			{/* Play/Pause Button - Increased Size (h-11 w-11) */}
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

			{/* Status Text */}
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
