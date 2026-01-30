import React, { useRef, useState, useEffect } from 'react';
import emailjs from '@emailjs/browser';

const PautaContactForm = () => {
	const form = useRef<HTMLFormElement>(null);
	const [loading, setLoading] = useState(false);
	const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

	useEffect(() => {
		console.log('✅ PautaContactForm cargado');
	}, []);

	const sendEmail = (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);

		if (!form.current) return;

		// Uso de variables de entorno para la configuración segura de EmailJS
		const serviceId = import.meta.env.PUBLIC_EMAILJS_SERVICE_ID;
		const templateId = 'template_yx57vqo';
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
		<div className="border-primary-500 from-primary-800 to-primary-900 ring-primary-400 mx-auto flex max-h-[90dvh] w-full max-w-3xl flex-col rounded-2xl border bg-linear-to-br shadow-xl ring-2">
			<div className="shrink-0 p-2 sm:p-4 md:p-6">
				<h2 className="text-center text-xl font-bold text-white sm:text-2xl md:text-3xl">
					Contacto para Pautas Publicitarias
				</h2>
				<p className="text-primary-100 text-center text-sm sm:text-base md:text-lg">
					¿Interesado en anunciarte con nosotros? Completa el formulario y te contactaremos con
					información sobre tarifas y opciones disponibles.
				</p>

				{status === 'success' && (
					<div className="border-primary-300 bg-primary-100 text-primary-800 mb-4 rounded-lg border p-3 text-sm">
						¡Mensaje enviado con éxito! Nos pondremos en contacto contigo pronto para discutir las
						opciones de publicidad.
					</div>
				)}

				{status === 'error' && (
					<div className="mb-4 rounded-lg border border-red-300 bg-red-100 p-3 text-sm text-red-800">
						Hubo un error al enviar el mensaje. Por favor intenta nuevamente o escríbenos
						directamente.
					</div>
				)}
			</div>

			<div className="grow overflow-y-auto px-4 pb-4 sm:px-6 sm:pb-6 md:px-8 md:pb-8">
				<form ref={form} onSubmit={sendEmail} className="space-y-3 sm:space-y-4">
					<div>
						<label
							htmlFor="client"
							className="mb-1 block text-xs font-semibold text-white sm:text-sm"
						>
							Nombre Completo
						</label>
						<input
							type="text"
							name="client"
							id="client"
							required
							className="border-primary-300 focus:border-primary-500 focus:ring-primary-500 w-full rounded-lg border-2 bg-white px-3 py-2 text-sm transition-all outline-none focus:ring-2"
							placeholder="Juan Pérez"
						/>
					</div>

					<div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2">
						<div>
							<label
								htmlFor="email"
								className="mb-1 block text-xs font-semibold text-white sm:text-sm"
							>
								Correo Electrónico
							</label>
							<input
								type="email"
								name="email"
								id="email"
								required
								className="border-primary-300 focus:border-primary-500 focus:ring-primary-500 w-full rounded-lg border-2 bg-white px-3 py-2 text-sm transition-all outline-none focus:ring-2"
								placeholder="empresa@ejemplo.com"
							/>
						</div>
						<div>
							<label
								htmlFor="phone"
								className="mb-1 block text-xs font-semibold text-white sm:text-sm"
							>
								Celular / Teléfono
							</label>
							<input
								type="tel"
								name="phone"
								id="phone"
								required
								className="border-primary-300 focus:border-primary-500 focus:ring-primary-500 w-full rounded-lg border-2 bg-white px-3 py-2 text-sm transition-all outline-none focus:ring-2"
								placeholder="300 123 4567"
							/>
						</div>
					</div>

					<div>
						<label
							htmlFor="company_name"
							className="mb-1 block text-xs font-semibold text-white sm:text-sm"
						>
							Nombre de la Empresa
						</label>
						<input
							type="text"
							name="company_name"
							id="company_name"
							required
							className="border-primary-300 focus:border-primary-500 focus:ring-primary-500 w-full rounded-lg border-2 bg-white px-3 py-2 text-sm transition-all outline-none focus:ring-2"
							placeholder="Empresa S.A.S."
						/>
					</div>

					<div>
						<label
							htmlFor="affiliate"
							className="mb-1 block text-xs font-semibold text-white sm:text-sm"
						>
							¿Eres afiliado a CJI?
						</label>
						<select
							name="affiliate"
							id="affiliate"
							required
							className="border-primary-300 focus:border-primary-500 focus:ring-primary-500 w-full rounded-lg border-2 bg-white px-3 py-2 text-sm transition-all outline-none focus:ring-2"
						>
							<option value="">Selecciona una opción</option>
							<option value="afiliado">Sí, soy afiliado a CJI</option>
							<option value="no_afiliado">No, no soy afiliado a CJI</option>
						</select>
					</div>

					<div>
						<label
							htmlFor="subject"
							className="mb-1 block text-xs font-semibold text-white sm:text-sm"
						>
							Tipo de Publicidad Interesada
						</label>
						<select
							name="subject"
							id="subject"
							required
							className="border-primary-300 focus:border-primary-500 focus:ring-primary-500 w-full resize-none rounded-lg border-2 bg-white px-3 py-2 text-sm transition-all outline-none focus:ring-2"
						>
							<option value="">Selecciona el tipo de publicidad</option>
							<option value="banner_web">Banner en sitio web</option>
							<option value="revista_impresa">Publicidad en revista impresa</option>
							<option value="redes_sociales">Publicidad en redes sociales</option>
							<option value="email_marketing">Email marketing</option>
							<option value="patrocinio_evento">Patrocinio de evento</option>
							<option value="otro">Otro</option>
						</select>
					</div>

					<div>
						<label
							htmlFor="message"
							className="mb-1 block text-xs font-semibold text-white sm:text-sm"
						>
							Detalles Adicionales
						</label>
						<textarea
							name="message"
							id="message"
							required
							rows={3}
							className="border-primary-300 focus:border-primary-500 focus:ring-primary-500 w-full resize-none rounded-lg border-2 bg-white px-3 py-2 text-sm transition-all outline-none focus:ring-2"
							placeholder="Describe tu campaña publicitaria, presupuesto aproximado, duración deseada, etc."
						></textarea>
					</div>
				</form>
			</div>

			<div className="shrink-0 p-4 pt-0 sm:p-6 md:p-8">
				<button
					type="submit"
					disabled={loading}
					onClick={(e) => {
						e.preventDefault();
						sendEmail(e as any);
					}}
					className={`w-full rounded-lg px-4 py-3 text-base font-bold text-white transition-all duration-300 ${
						loading
							? 'cursor-not-allowed bg-gray-400'
							: 'bg-secondary-600 hover:bg-secondary-700 hover:shadow-xl'
					}`}
				>
					{loading ? 'Enviando Solicitud...' : 'Enviar Solicitud de Pauta'}
				</button>
			</div>
		</div>
	);
};

export default PautaContactForm;
