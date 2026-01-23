import React, { useRef, useState } from 'react';
import emailjs from '@emailjs/browser';

const ContactForm = () => {
	console.log('🚀 ContactForm montado en el cliente');
	const form = useRef<HTMLFormElement>(null);
	const [loading, setLoading] = useState(false);
	const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

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
			console.log('serviceId:', serviceId);
			console.log('templateId:', templateId);
			console.log('publicKey:', publicKey);
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
				<div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4 text-green-700">
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
						className="w-full rounded-lg border border-gray-300 px-4 py-2 transition-colors outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500"
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
							className="w-full rounded-lg border border-gray-300 px-4 py-2 transition-colors outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500"
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
							className="w-full rounded-lg border border-gray-300 px-4 py-2 transition-colors outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500"
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
						className="w-full rounded-lg border border-gray-300 px-4 py-2 transition-colors outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500"
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
						className="w-full rounded-lg border border-gray-300 px-4 py-2 transition-colors outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500"
						placeholder="Escribe tu mensaje aquí..."
					></textarea>
				</div>

				<button
					type="submit"
					disabled={loading}
					className={`w-full rounded-lg px-6 py-3 font-bold text-white transition-all duration-300 ${
						loading
							? 'cursor-not-allowed bg-gray-400'
							: 'transform bg-green-700 hover:-translate-y-0.5 hover:bg-green-800 hover:shadow-lg'
					}`}
				>
					{loading ? 'Enviando...' : 'Enviar Mensaje'}
				</button>
			</form>
		</div>
	);
};

export default ContactForm;
