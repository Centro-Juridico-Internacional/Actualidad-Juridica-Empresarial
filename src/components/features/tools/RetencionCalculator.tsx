import React, { useState } from 'react';
import jsPDF from 'jspdf';

const UVT_2025 = 47076; // Valor oficial DIAN

const Tooltip = ({ text }: { text: string }) => (
	<span className="group relative ml-1 cursor-pointer rounded-full bg-purple-100 px-[6px] py-[1px] text-xs font-bold text-purple-700">
		?
		<span className="absolute top-5 left-0 hidden w-64 scale-95 rounded-lg border border-purple-200 bg-white/90 p-3 text-xs text-gray-700 opacity-0 shadow-xl backdrop-blur-md transition group-hover:block group-hover:scale-100 group-hover:opacity-100">
			{text}
		</span>
	</span>
);

const RetencionCalculator = () => {
	const [salary, setSalary] = useState('');
	const [dedSalud, setDedSalud] = useState('');
	const [dedPension, setDedPension] = useState('');
	const [dependientes, setDependientes] = useState(false);
	const [intereses, setIntereses] = useState('');

	const [result, setResult] = useState<any | null>(null);

	const calc = (e: React.FormEvent) => {
		e.preventDefault();

		const bruto = Number(salary);

		// Procesamiento de Deducciones Legales (Art. 387 E.T.)
		const ds = Number(dedSalud) || 0;
		const dp = Number(dedPension) || 0;
		const dedIntereses = Number(intereses) || 0;

		// Deducción por Dependientes Económicos (Máximo 32 UVT mensuales)
		const dedDependientes = dependientes ? 32 * UVT_2025 : 0;

		// TOTAL deducciones
		const totalDeducciones = ds + dp + dedDependientes + dedIntereses;

		// Cálculo de la Renta Exenta del 25% (Límite legal mensual aplicado)
		const rentaExenta25 = Math.min(bruto * 0.25, 240 * UVT_2025);

		// Base de Renta Líquida Gravable para aplicación de tabla UVT
		const rentaLiquida = Math.max(bruto - totalDeducciones - rentaExenta25, 0);

		// Conversión de pesos colombianos (COP) a Unidad de Valor Tributario (UVT)
		const baseUVT = rentaLiquida / UVT_2025;

		// Aplicación de la Tabla Progresiva de Retención (Tarifa 2025)
		let retencion = 0;

		if (baseUVT <= 0) retencion = 0;
		else if (baseUVT <= 95) retencion = 0;
		else if (baseUVT <= 150) retencion = (baseUVT - 95) * (19 / 100) * UVT_2025;
		else if (baseUVT <= 360) retencion = (baseUVT - 150) * (28 / 100) * UVT_2025 + 55 * UVT_2025;
		else retencion = (baseUVT - 360) * (33 / 100) * UVT_2025 + 95 * UVT_2025;

		setResult({
			bruto,
			totalDeducciones,
			rentaExenta25,
			rentaLiquida,
			baseUVT,
			retencion
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
		doc.text('Informe de Retención en la Fuente', 14, 20);

		doc.setFontSize(12);
		doc.text(`Salario Bruto: ${money(result.bruto)}`, 14, 35);
		doc.text(`Deducciones Totales: ${money(result.totalDeducciones)}`, 14, 45);
		doc.text(`Renta exenta (25%): ${money(result.rentaExenta25)}`, 14, 55);
		doc.text(`Renta Líquida: ${money(result.rentaLiquida)}`, 14, 65);
		doc.text(`Base UVT: ${result.baseUVT.toFixed(2)} UVT`, 14, 75);
		doc.text(`Retención Mensual: ${money(result.retencion)}`, 14, 95);

		doc.save('retencion.pdf');
	};

	return (
		<div className="animate-fadeIn w-full max-w-3xl rounded-2xl border border-purple-200 bg-white p-10 shadow-lg shadow-purple-100/50">
			<h2 className="mb-6 text-3xl font-extrabold text-purple-700">
				Calculadora de Retención en la Fuente
			</h2>

			<form className="space-y-6" onSubmit={calc}>
				{/* Salario */}
				<div>
					<label className="font-medium text-gray-700">
						Salario bruto mensual
						<Tooltip text="Incluye todos los pagos constitutivos de salario." />
					</label>
					<input
						type="number"
						placeholder="Ej: 3.000.000"
						value={salary}
						onChange={(e) => setSalary(e.target.value)}
						className="w-full rounded-xl border bg-gray-50 p-3 focus:ring-2 focus:ring-purple-300"
					/>
				</div>

				{/* Deducciones */}
				<div>
					<label className="font-medium text-gray-700">
						Salud (4%)
						<Tooltip text="El aporte obligatorio del trabajador." />
					</label>
					<input
						type="number"
						placeholder="Ej: 120.000"
						value={dedSalud}
						onChange={(e) => setDedSalud(e.target.value)}
						className="w-full rounded-xl border bg-gray-50 p-3"
					/>
				</div>

				<div>
					<label className="font-medium text-gray-700">
						Pensión (4%)
						<Tooltip text="Aporte del trabajador que es deducible." />
					</label>
					<input
						type="number"
						placeholder="Ej: 120.000"
						value={dedPension}
						onChange={(e) => setDedPension(e.target.value)}
						className="w-full rounded-xl border bg-gray-50 p-3"
					/>
				</div>

				{/* Dependientes */}
				<div className="flex items-center gap-2">
					<input
						id="dependientes"
						type="checkbox"
						checked={dependientes}
						onChange={(e) => setDependientes(e.target.checked)}
					/>
					<label htmlFor="dependientes" className="text-sm text-gray-700">
						Declarar dependientes (máx. 32 UVT)
					</label>
				</div>

				{/* Intereses */}
				<div>
					<label className="font-medium text-gray-700">
						Intereses de vivienda
						<Tooltip text="Deducibles hasta el límite permitido por la DIAN." />
					</label>
					<input
						type="number"
						placeholder="Ej: 0"
						value={intereses}
						onChange={(e) => setIntereses(e.target.value)}
						className="w-full rounded-xl border bg-gray-50 p-3"
					/>
				</div>

				<button className="w-full rounded-xl bg-purple-700 py-3 font-bold text-white shadow transition hover:bg-purple-800">
					Calcular
				</button>
			</form>

			{result && (
				<div className="animate-slideUp mt-10 rounded-xl border border-purple-200 bg-purple-50 p-6 shadow-inner">
					<h3 className="mb-4 text-xl font-bold text-purple-800">Resultado</h3>

					<p>Renta líquida: {money(result.rentaLiquida)}</p>
					<p className="mt-1">Base en UVT: {result.baseUVT.toFixed(2)}</p>

					<p className="mt-3 text-lg font-bold text-purple-700">
						Retención mensual: {money(result.retencion)}
					</p>

					<button
						onClick={downloadPDF}
						className="mt-4 rounded-xl bg-purple-700 px-4 py-2 text-white transition hover:bg-purple-800"
					>
						Descargar PDF
					</button>
				</div>
			)}
		</div>
	);
};

export default RetencionCalculator;
