import React, { useState } from 'react';
import jsPDF from 'jspdf';

// Valores oficiales
const SALARIO_MINIMO_2025 = 1423500;

// Tooltip elegante pastel
const Tooltip = ({ text }: { text: string }) => (
	<span className="group relative ml-1 cursor-pointer rounded-full bg-red-100 px-1.5 py-px text-xs font-bold text-red-700">
		?
		<span className="absolute top-5 left-0 z-50 hidden w-64 scale-95 rounded-lg border border-red-200 bg-white/90 p-3 text-xs text-gray-700 opacity-0 shadow-xl backdrop-blur-md transition-all duration-200 group-hover:block group-hover:scale-100 group-hover:opacity-100">
			{text}
		</span>
	</span>
);

const IndemnizacionCalculator = () => {
	const [salary, setSalary] = useState('');
	const [years, setYears] = useState('');
	const [months, setMonths] = useState('');
	const [contractType, setContractType] = useState('indefinido');
	const [fixedDuration, setFixedDuration] = useState('');
	const [useSMMLV, setUseSMMLV] = useState(false);
	const [result, setResult] = useState<number | null>(null);

	const calculate = (e: React.FormEvent) => {
		e.preventDefault();

		let salario = useSMMLV ? SALARIO_MINIMO_2025 : Number(salary);
		let totalYears = Number(years) + Number(months) / 12;
		let indemnizacion = 0;

		// Indemnización para contratos a término indefinido (Base legal: Código Sustantivo del Trabajo)
		if (contractType === 'indefinido') {
			if (salario <= SALARIO_MINIMO_2025 * 10) {
				indemnizacion =
					totalYears <= 1 ? salario * 30 : salario * (30 + 20 * Math.floor(totalYears - 1));
			} else {
				indemnizacion =
					totalYears <= 1 ? salario * 20 : salario * (20 + 15 * Math.floor(totalYears - 1));
			}
		}

		// Indemnización para contratos a término fijo (Valor del tiempo faltante)

		setResult(indemnizacion);
	};

	const money = (v: number) =>
		new Intl.NumberFormat('es-CO', {
			style: 'currency',
			currency: 'COP',
			maximumFractionDigits: 0
		}).format(v);

	const downloadPDF = () => {
		if (!result) return;

		const doc = new jsPDF();

		doc.setFontSize(18);
		doc.text('Informe de Indemnización por Despido', 14, 20);

		doc.setFontSize(12);
		doc.text(`Salario base: ${money(Number(salary))}`, 14, 40);
		doc.text(`Años trabajados: ${years} años y ${months} meses`, 14, 50);
		doc.text(`Tipo de contrato: ${contractType}`, 14, 60);
		doc.text(`Indemnización estimada: ${money(result)}`, 14, 80);

		doc.save('indemnizacion.pdf');
	};

	return (
		<div className="animate-fadeIn mx-auto w-full max-w-3xl rounded-2xl border border-red-200 bg-white p-10 shadow-lg shadow-red-100/50">
			<h2 className="mb-6 text-3xl font-extrabold text-red-700">Calculadora de Indemnización</h2>

			<form className="space-y-6" onSubmit={calculate}>
				{/* Salario */}
				<div className="space-y-2">
					<label className="font-medium text-gray-700">Salario mensual</label>

					<div className="flex items-center gap-2">
						<input
							type="checkbox"
							id="use-smmlv"
							checked={useSMMLV}
							onChange={(e) => {
								setUseSMMLV(e.target.checked);
								if (e.target.checked) setSalary(String(SALARIO_MINIMO_2025));
							}}
						/>
						<label htmlFor="use-smmlv" className="text-sm text-gray-600">
							Usar SMMLV 2025
						</label>
					</div>

					<input
						type="number"
						disabled={useSMMLV}
						placeholder="Ej: 2.000.000"
						value={salary}
						onChange={(e) => setSalary(e.target.value)}
						className="w-full rounded-xl border bg-gray-50 p-3 focus:ring-2 focus:ring-red-300 disabled:bg-gray-200"
					/>
				</div>

				{/* Años trabajados */}
				<div className="grid grid-cols-2 gap-4">
					<div>
						<label className="font-medium">Años trabajados</label>
						<input
							type="number"
							value={years}
							onChange={(e) => setYears(e.target.value)}
							className="w-full rounded-xl border bg-gray-50 p-3 focus:ring-2 focus:ring-red-300"
							placeholder="Ej: 2"
						/>
					</div>
					<div>
						<label className="font-medium">Meses trabajados</label>
						<input
							type="number"
							value={months}
							onChange={(e) => setMonths(e.target.value)}
							className="w-full rounded-xl border bg-gray-50 p-3 focus:ring-2 focus:ring-red-300"
							placeholder="Ej: 6"
						/>
					</div>
				</div>

				{/* Tipo de contrato */}
				<div>
					<label htmlFor="contract-type" className="font-medium">
						Tipo de contrato
					</label>
					<select
						id="contract-type"
						value={contractType}
						onChange={(e) => setContractType(e.target.value)}
						className="w-full rounded-xl border bg-gray-50 p-3 focus:ring-2 focus:ring-red-300"
					>
						<option value="indefinido">Término indefinido</option>
						<option value="fijo">Término fijo</option>
					</select>
				</div>

				{/* Si es fijo */}
				{contractType === 'fijo' && (
					<div>
						<label className="font-medium">Duración del contrato en meses (restantes)</label>
						<input
							type="number"
							value={fixedDuration}
							onChange={(e) => setFixedDuration(e.target.value)}
							className="w-full rounded-xl border bg-gray-50 p-3 focus:ring-2 focus:ring-red-300"
							placeholder="Ej: 12"
						/>
					</div>
				)}

				<button className="w-full rounded-xl bg-red-600 py-3 font-bold text-white shadow-md hover:bg-red-700">
					Calcular
				</button>
			</form>

			{result !== null && (
				<div className="animate-slideUp mt-10 rounded-xl border border-red-200 bg-red-50 p-6 shadow-inner">
					<h3 className="mb-3 text-xl font-bold text-red-800">Resultado</h3>

					<p className="mb-4 text-lg text-gray-800">
						Indemnización estimada: <strong className="text-red-700">{money(result)}</strong>
					</p>

					<button
						onClick={downloadPDF}
						className="mt-4 rounded-xl bg-red-600 px-4 py-2 text-white shadow transition hover:bg-red-700"
					>
						Descargar PDF
					</button>
				</div>
			)}
		</div>
	);
};

export default IndemnizacionCalculator;
