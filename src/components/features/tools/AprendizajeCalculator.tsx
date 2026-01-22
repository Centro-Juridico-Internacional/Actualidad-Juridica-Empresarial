import React, { useState } from 'react';
import jsPDF from 'jspdf';

const SMMLV_2025 = 1423500;
const AUX_TRANSPORTE_2025 = 200000;

const Tooltip = ({ text }: { text: string }) => (
	<span className="group relative ml-1 cursor-pointer rounded-full bg-teal-100 px-[6px] py-[1px] text-xs font-bold text-teal-700">
		?
		<span className="absolute top-5 left-0 hidden w-64 scale-95 rounded-lg border border-teal-200 bg-white/90 p-3 text-xs text-gray-700 opacity-0 shadow-xl backdrop-blur-md transition group-hover:block group-hover:scale-100 group-hover:opacity-100">
			{text}
		</span>
	</span>
);

const AprendizajeCalculator = () => {
	const [phase, setPhase] = useState('lectiva');
	const [months, setMonths] = useState('');
	const [monthsLeft, setMonthsLeft] = useState('');

	const [result, setResult] = useState<any | null>(null);

	const calc = (e: React.FormEvent) => {
		e.preventDefault();

		const m = Number(months);
		const faltantes = Number(monthsLeft);

		// Cálculo de Auxilios según Fase Legal (Ley 789 de 2002)
		const auxLectiva = SMMLV_2025 * 0.5;
		const auxProductiva = SMMLV_2025 * 0.75;

		const aux = phase === 'lectiva' ? auxLectiva : auxProductiva;

		const totalAuxilio = aux * m;

		// Indemnización por terminación anticipada (1 SMMLV por mes o fracción faltante)
		const indemnizacion = faltantes <= 0 ? 0 : faltantes * SMMLV_2025;

		setResult({
			aux,
			totalAuxilio,
			indemnizacion,
			months: m,
			faltantes
		});
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
		doc.text('Informe de Contrato de Aprendizaje', 14, 20);

		doc.setFontSize(12);
		doc.text(`Auxilio mensual: ${money(result.aux)}`, 14, 40);
		doc.text(`Meses: ${result.months}`, 14, 50);
		doc.text(`Total auxilio: ${money(result.totalAuxilio)}`, 14, 60);
		doc.text(`Meses faltantes: ${result.faltantes}`, 14, 80);
		doc.text(`Indemnización final: ${money(result.indemnizacion)}`, 14, 90);

		doc.save('contrato-aprendizaje.pdf');
	};

	return (
		<div className="animate-fadeIn w-full max-w-3xl rounded-2xl border border-teal-200 bg-white p-10 shadow-lg shadow-teal-100/50">
			<h2 className="mb-6 text-3xl font-extrabold text-teal-700">
				Calculadora de Contrato de Aprendizaje
			</h2>

			<form className="space-y-6" onSubmit={calc}>
				{/* Selección de Fase del Contrato (Afecta el % del auxilio) */}
				<div>
					<label htmlFor="phase-select" className="font-medium text-gray-700">
						Fase del contrato
						<Tooltip text="La fase lectiva paga el 50% del SMMLV. La productiva, el 75%." />
					</label>
					<select
						id="phase-select"
						value={phase}
						onChange={(e) => setPhase(e.target.value)}
						className="w-full rounded-xl border bg-gray-50 p-3 focus:ring-2 focus:ring-teal-300"
					>
						<option value="lectiva">Fase Lectiva</option>
						<option value="productiva">Fase Productiva</option>
					</select>
				</div>

				{/* Meses */}
				<div>
					<label className="font-medium text-gray-700">Meses trabajados</label>
					<input
						type="number"
						value={months}
						onChange={(e) => setMonths(e.target.value)}
						className="w-full rounded-xl border bg-gray-50 p-3 focus:ring-2 focus:ring-teal-300"
						placeholder="Ej: 4"
					/>
				</div>

				{/* Meses faltantes */}
				<div>
					<label className="font-medium text-gray-700">
						Meses faltantes (solo si hubo terminación)
						<Tooltip text="La empresa debe pagar 1 SMMLV por cada mes o fracción faltante." />
					</label>
					<input
						type="number"
						value={monthsLeft}
						onChange={(e) => setMonthsLeft(e.target.value)}
						className="w-full rounded-xl border bg-gray-50 p-3 focus:ring-2 focus:ring-teal-300"
						placeholder="Ej: 2"
					/>
				</div>

				<button className="w-full rounded-xl bg-teal-600 py-3 font-bold text-white shadow transition hover:bg-teal-700">
					Calcular
				</button>
			</form>

			{result && (
				<div className="animate-slideUp mt-10 rounded-xl border border-teal-200 bg-teal-50 p-6 shadow-inner">
					<h3 className="mb-4 text-xl font-bold text-teal-800">Resultados</h3>

					<p>Auxilio mensual: {money(result.aux)}</p>
					<p className="mt-1">Total auxilio: {money(result.totalAuxilio)}</p>

					<p className="mt-3 text-lg font-bold text-teal-700">
						Indemnización: {money(result.indemnizacion)}
					</p>

					<button
						onClick={downloadPDF}
						className="mt-4 rounded-xl bg-teal-600 px-4 py-2 text-white transition hover:bg-teal-700"
					>
						Descargar PDF
					</button>
				</div>
			)}
		</div>
	);
};

export default AprendizajeCalculator;
