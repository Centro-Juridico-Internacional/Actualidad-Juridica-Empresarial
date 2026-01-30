import React, { useRef, useState, useEffect } from 'react';
import emailjs from '@emailjs/browser';

const ContactForm = () => {
	const form = useRef<HTMLFormElement>(null);
	const [loading, setLoading] = useState(false);
	const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

	useEffect(() => {
		console.log('✅ ContactForm cargado');
	}, []);

	const sendEmail = (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);

		if (!form.current) return;

		// Uso de variables de entorno para la configuración segura de EmailJS
		const serviceId = import.meta.env.PUBLIC_EMAILJS_SERVICE_ID;
		const templateId = import.meta.env.PUBLIC_EMAILJS_TEMPLATE_ID;
		const publicKey = import.meta.env.PUBLIC_EMAILJS_PUBLIC_KEY;

		if (!serviceId || !templateId || !publicKey) {
			console.error('Faltan las variables de entorno de EmailJS');
			setStatus('error');
			setLoading(false);
			return;
		}

		// Inyectar campos ocultos con metadatos de auditoría dinámicamente
		const currentForm = form.current;
		const dateInput = document.createElement('input');
		dateInput.type = 'hidden';
		dateInput.name = 'date_sent';
		dateInput.value = new Date().toLocaleString('es-CO', { timeZone: 'America/Bogota' });
		currentForm.appendChild(dateInput);

		const locationInput = document.createElement('input');
		locationInput.type = 'hidden';
		locationInput.name = 'user_location';
		locationInput.value = Intl.DateTimeFormat().resolvedOptions().timeZone; // Proxy para ubicación aproximada (Zona Horaria)
		currentForm.appendChild(locationInput);

		const urlInput = document.createElement('input');
		urlInput.type = 'hidden';
		urlInput.name = 'site_url';
		urlInput.value = window.location.origin;
		currentForm.appendChild(urlInput);

		emailjs
			.sendForm(serviceId, templateId, currentForm, publicKey)
			.then(
				(result) => {
					console.log('✅ Enviado:', result);
					setStatus('success');
					if (form.current) form.current.reset();
				},
				(error) => {
					console.error('EmailJS Error:', error.text);
					setStatus('error');
				}
			)
			.finally(() => {
				// Limpieza de campos inyectados del DOM una vez enviado el correo
				if (currentForm.contains(dateInput)) currentForm.removeChild(dateInput);
				if (currentForm.contains(locationInput)) currentForm.removeChild(locationInput);
				if (currentForm.contains(urlInput)) currentForm.removeChild(urlInput);

				setLoading(false);
				// Ocultar mensaje de éxito tras 5 segundos de cortesía visual
				setTimeout(() => setStatus('idle'), 5000);
			});
	};

	return (
		<div className="rounded-2xl bg-white p-8 shadow-lg ring-1 ring-gray-100">
			<h2 className="mb-6 text-2xl font-bold text-gray-900">Envíanos un mensaje</h2>

			{status === 'success' && (
				<div className="border-primary-200 bg-primary-50 text-primary-700 mb-6 rounded-lg border p-4">
					¡Mensaje enviado con éxito! Nos pondremos en contacto contigo pronto.
				</div>
			)}

			{status === 'error' && (
				<div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
					Hubo un error al enviar el mensaje. Por favor intenta nuevamente o escríbenos
					directamente.
				</div>
			)}

			<form ref={form} onSubmit={sendEmail} className="space-y-4">
				<div>
					<label htmlFor="user_name" className="mb-1 block text-sm font-medium text-gray-700">
						Nombre Completo
					</label>
					<input
						type="text"
						name="user_name"
						id="user_name"
						required
						className="focus:border-primary-500 focus:ring-primary-500 w-full rounded-lg border border-gray-300 px-4 py-2 transition-colors outline-none focus:ring-2"
						placeholder="Juan Pérez"
					/>
				</div>

				<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
					<div>
						<label htmlFor="user_email" className="mb-1 block text-sm font-medium text-gray-700">
							Correo Electrónico
						</label>
						<input
							type="email"
							name="user_email"
							id="user_email"
							required
							className="focus:border-primary-500 focus:ring-primary-500 w-full rounded-lg border border-gray-300 px-4 py-2 transition-colors outline-none focus:ring-2"
							placeholder="centrojuridico@ejemplo.com"
						/>
					</div>
					<div>
						<label htmlFor="phone" className="mb-1 block text-sm font-medium text-gray-700">
							Celular / Teléfono
						</label>
						<input
							type="tel"
							name="phone"
							id="phone"
							required
							className="focus:border-primary-500 focus:ring-primary-500 w-full rounded-lg border border-gray-300 px-4 py-2 transition-colors outline-none focus:ring-2"
							placeholder="300 123 4567"
						/>
					</div>
				</div>

				<div>
					<label htmlFor="subject" className="mb-1 block text-sm font-medium text-gray-700">
						Asunto
					</label>
					<input
						type="text"
						name="subject"
						id="subject"
						required
						className="focus:border-primary-500 focus:ring-primary-500 w-full rounded-lg border border-gray-300 px-4 py-2 transition-colors outline-none focus:ring-2"
						placeholder="Consulta Jurídica..."
					/>
				</div>

				<div>
					<label htmlFor="message" className="mb-1 block text-sm font-medium text-gray-700">
						Mensaje
					</label>
					<textarea
						name="message"
						id="message"
						required
						rows={4}
						className="focus:border-primary-500 focus:ring-primary-500 w-full rounded-lg border border-gray-300 px-4 py-2 transition-colors outline-none focus:ring-2"
						placeholder="Escribe tu mensaje aquí..."
					></textarea>
				</div>

				<button
					type="submit"
					disabled={loading}
					className={`w-full rounded-lg px-6 py-3 font-bold text-white transition-all duration-300 ${
						loading
							? 'cursor-not-allowed bg-gray-400'
							: 'bg-secondary-500 hover:bg-secondary-600 transform hover:-translate-y-0.5 hover:shadow-lg'
					}`}
				>
					{loading ? 'Enviando...' : 'Enviar Mensaje'}
				</button>
			</form>
		</div>
	);
};

export default ContactForm;
