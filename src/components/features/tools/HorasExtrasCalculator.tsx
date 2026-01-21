import React, { useState } from 'react';
import jsPDF from 'jspdf';

const SALARIO_MINIMO_2025 = 1423500;

const Tooltip = ({ text }: { text: string }) => (
	<span className="group relative ml-1 cursor-pointer rounded-full bg-blue-100 px-[6px] py-[1px] text-xs font-bold text-blue-700">
		?
		<span className="absolute top-5 left-0 hidden w-64 scale-95 rounded-lg border border-blue-200 bg-white/90 p-3 text-xs text-gray-700 opacity-0 shadow-xl backdrop-blur-md transition-all duration-200 group-hover:block group-hover:scale-100 group-hover:opacity-100">
			{text}
		</span>
	</span>
);

const HorasExtrasCalculator = () => {
	const [salary, setSalary] = useState('');
	const [useMin, setUseMin] = useState(false);

	const [extraDiurna, setExtraDiurna] = useState(0);
	const [extraNocturna, setExtraNocturna] = useState(0);
	const [dominicalDiurna, setDominicalDiurna] = useState(0);
	const [dominicalNocturna, setDominicalNocturna] = useState(0);
	const [nocturnoOrdinario, setNocturnoOrdinario] = useState(0);

	const [result, setResult] = useState<any | null>(null);

	const calculate = (e: React.FormEvent) => {
		e.preventDefault();

		const baseSalary = useMin ? SALARIO_MINIMO_2025 : Number(salary);
		const valorHora = baseSalary / 240;

		const total =
			extraDiurna * valorHora * 1.25 +
			extraNocturna * valorHora * 1.75 +
			nocturnoOrdinario * valorHora * 1.35 +
			dominicalDiurna * valorHora * 1.75 +
			dominicalNocturna * valorHora * 2.1;

		setResult({
			valorHora,
			total,
			extraDiurna,
			extraNocturna,
			dominicalDiurna,
			dominicalNocturna,
			nocturnoOrdinario
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
		doc.text('Informe de Horas Extras y Recargos', 14, 20);

		doc.setFontSize(12);
		doc.text(`Valor hora: ${money(result.valorHora)}`, 14, 40);
		doc.text(`Total a pagar: ${money(result.total)}`, 14, 50);

		doc.save('horas-extras.pdf');
	};

	return (
		<div className="mx-auto w-full max-w-3xl rounded-2xl border border-blue-200 bg-white p-10 shadow-lg shadow-blue-100/50">
			<h2 className="mb-6 text-3xl font-extrabold text-blue-700">Calculadora de Horas Extras</h2>

			<form className="space-y-6" onSubmit={calculate}>
				{/* Salario */}
				<div>
					<label className="font-medium text-gray-700">Salario mensual</label>

					<label className="mt-1 flex items-center gap-2">
						<input
							type="checkbox"
							checked={useMin}
							onChange={(e) => {
								setUseMin(e.target.checked);
								if (e.target.checked) setSalary(String(SALARIO_MINIMO_2025));
							}}
						/>
						<span className="text-sm">Usar SMMLV 2025</span>
					</label>

					<input
						type="number"
						disabled={useMin}
						value={salary}
						placeholder="Ej: 2.000.000"
						onChange={(e) => setSalary(e.target.value)}
						className="mt-2 w-full rounded-xl border bg-gray-50 p-3 focus:ring-2 focus:ring-blue-300 disabled:bg-gray-200"
					/>
				</div>

				{/* Horas */}
				<div className="grid grid-cols-2 gap-4">
					<div>
						<label>Extra Diurna (+25%)</label>
						<input
							type="number"
							value={extraDiurna}
							onChange={(e) => setExtraDiurna(Number(e.target.value))}
							className="w-full rounded-xl border p-3"
							placeholder="0"
						/>
					</div>

					<div>
						<label>Extra Nocturna (+75%)</label>
						<input
							type="number"
							value={extraNocturna}
							onChange={(e) => setExtraNocturna(Number(e.target.value))}
							className="w-full rounded-xl border p-3"
							placeholder="0"
						/>
					</div>

					<div>
						<label>Nocturno Ordinario (+35%)</label>
						<input
							type="number"
							value={nocturnoOrdinario}
							onChange={(e) => setNocturnoOrdinario(Number(e.target.value))}
							className="w-full rounded-xl border p-3"
							placeholder="0"
						/>
					</div>

					<div>
						<label>Dominical Diurno (+75%)</label>
						<input
							type="number"
							value={dominicalDiurna}
							onChange={(e) => setDominicalDiurna(Number(e.target.value))}
							className="w-full rounded-xl border p-3"
							placeholder="0"
						/>
					</div>

					<div>
						<label>Dominical Nocturno (+110%)</label>
						<input
							type="number"
							value={dominicalNocturna}
							onChange={(e) => setDominicalNocturna(Number(e.target.value))}
							className="w-full rounded-xl border p-3"
							placeholder="0"
						/>
					</div>
				</div>

				<button className="w-full rounded-xl bg-blue-600 py-3 font-bold text-white shadow transition hover:bg-blue-700">
					Calcular
				</button>
			</form>

			{result && (
				<div className="animate-slideUp mt-10 rounded-xl border border-blue-200 bg-blue-50 p-6 shadow-inner">
					<h3 className="mb-3 text-xl font-bold text-blue-900">Resultado</h3>

					<p className="text-gray-700">Valor por hora: {money(result.valorHora)}</p>
					<p className="mt-2 text-gray-700">
						Total a pagar: <strong className="text-blue-700">{money(result.total)}</strong>
					</p>

					<button
						onClick={downloadPDF}
						className="mt-4 rounded-xl bg-blue-600 px-4 py-2 text-white shadow transition hover:bg-blue-700"
					>
						Descargar PDF
					</button>
				</div>
			)}
		</div>
	);
};

export default HorasExtrasCalculator;
