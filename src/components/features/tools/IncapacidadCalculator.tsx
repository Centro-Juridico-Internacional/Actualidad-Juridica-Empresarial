import React, { useState } from 'react';
import jsPDF from 'jspdf';

const SALARIO_MINIMO_2025 = 1423500;

const Tooltip = ({ text }: { text: string }) => (
	<span className="group relative ml-1 cursor-pointer rounded-full bg-yellow-100 px-[6px] py-[1px] text-xs font-bold text-yellow-700">
		?
		<span className="absolute top-5 left-0 hidden w-64 scale-95 rounded-lg border border-yellow-200 bg-white/90 p-3 text-xs text-gray-700 opacity-0 shadow-xl backdrop-blur-md transition-opacity duration-200 group-hover:block group-hover:scale-100 group-hover:opacity-100">
			{text}
		</span>
	</span>
);

const IncapacidadCalculator = () => {
	const [salary, setSalary] = useState('');
	const [useMin, setUseMin] = useState(false);

	const [days, setDays] = useState('');
	const [type, setType] = useState('eg'); // eg = enfermedad general, at = accidente trabajo

	const [result, setResult] = useState<any | null>(null);

	const calculate = (e: React.FormEvent) => {
		e.preventDefault();

		const salarioBase = useMin ? SALARIO_MINIMO_2025 : Number(salary);
		const dias = Number(days);

		if (!dias || dias <= 0) return;

		// Valores finales
		let empresa = 0;
		let eps = 0;
		let arl = 0;

		// Enfermedad general
		if (type === 'eg') {
			if (dias >= 1) empresa += (salarioBase / 30) * 0.6667 * Math.min(dias, 2);
			if (dias > 2) eps += (salarioBase / 30) * 0.6667 * (dias - 2);
		}

		// Accidente de trabajo (ARL)
		if (type === 'at') {
			arl = (salarioBase / 30) * dias * 1.0;
		}

		const total = empresa + eps + arl;

		setResult({ empresa, eps, arl, total, dias });
	};

	const money = (v: number) =>
		new Intl.NumberFormat('es-CO', {
			style: 'currency',
			currency: 'COP',
			maximumFractionDigits: 0
		}).format(v);

	const downloadPDF = () => {
		const doc = new jsPDF();

		doc.setFontSize(18);
		doc.text('Informe de Incapacidad Médica', 14, 20);

		doc.setFontSize(12);
		doc.text(`Días de incapacidad: ${result.dias}`, 14, 40);
		doc.text(`Pago Empresa: ${money(result.empresa)}`, 14, 55);
		doc.text(`Pago EPS: ${money(result.eps)}`, 14, 65);
		doc.text(`Pago ARL: ${money(result.arl)}`, 14, 75);
		doc.text(`Total a recibir: ${money(result.total)}`, 14, 95);

		doc.save('incapacidad.pdf');
	};

	return (
		<div className="animate-fadeIn w-full max-w-3xl rounded-2xl border border-yellow-200 bg-white p-10 shadow-lg shadow-yellow-100/50">
			<h2 className="mb-6 text-3xl font-extrabold text-yellow-700">
				Calculadora de Incapacidad Médica
			</h2>

			<form className="space-y-6" onSubmit={calculate}>
				{/* Salario */}
				<div>
					<label className="font-medium text-gray-700">
						Salario mensual
						<Tooltip text="La base para cálculo es el salario dividido entre 30 días." />
					</label>

					<div className="mt-1 flex items-center gap-2">
						<input
							type="checkbox"
							checked={useMin}
							onChange={(e) => {
								setUseMin(e.target.checked);
								if (e.target.checked) setSalary(String(SALARIO_MINIMO_2025));
							}}
						/>
						<span className="text-sm text-gray-600">Usar SMMLV 2025</span>
					</div>

					<input
						type="number"
						placeholder="Ej: 2.000.000"
						disabled={useMin}
						value={salary}
						onChange={(e) => setSalary(e.target.value)}
						className="mt-2 w-full rounded-xl border bg-gray-50 p-3 focus:ring-2 focus:ring-yellow-300 disabled:bg-gray-200"
					/>
				</div>

				{/* Días */}
				<div>
					<label className="font-medium text-gray-700">Días de incapacidad</label>
					<input
						type="number"
						value={days}
						onChange={(e) => setDays(e.target.value)}
						className="w-full rounded-xl border bg-gray-50 p-3 focus:ring-2 focus:ring-yellow-300"
					/>
				</div>

				{/* Tipo */}
				<div>
					<label className="font-medium">Tipo de incapacidad</label>
					<select
						value={type}
						onChange={(e) => setType(e.target.value)}
						className="w-full rounded-xl border bg-gray-50 p-3 focus:ring-2 focus:ring-yellow-300"
					>
						<option value="eg">Enfermedad General (EPS)</option>
						<option value="at">Accidente de Trabajo (ARL)</option>
					</select>
				</div>

				<button className="w-full rounded-xl bg-yellow-600 py-3 font-bold text-white shadow transition hover:bg-yellow-700">
					Calcular
				</button>
			</form>

			{result && (
				<div className="animate-slideUp mt-10 rounded-xl border border-yellow-200 bg-yellow-50 p-6 shadow-inner">
					<h3 className="mb-4 text-xl font-bold text-yellow-800">Resultado</h3>

					<p className="text-gray-700">Pago Empresa: {money(result.empresa)}</p>
					<p className="text-gray-700">Pago EPS: {money(result.eps)}</p>
					<p className="text-gray-700">Pago ARL: {money(result.arl)}</p>

					<p className="mt-2 text-lg font-bold text-yellow-700">
						Total a recibir: {money(result.total)}
					</p>

					<button
						onClick={downloadPDF}
						className="mt-4 rounded-xl bg-yellow-600 px-4 py-2 text-white shadow transition hover:bg-yellow-700"
					>
						Descargar PDF
					</button>
				</div>
			)}
		</div>
	);
};

export default IncapacidadCalculator;
