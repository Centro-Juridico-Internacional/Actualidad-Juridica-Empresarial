import React, { useState } from 'react';

interface CalculationResult {
	cesantias: number;
	interesesCesantias: number;
	prima: number;
	vacaciones: number;
	total: number;
	diasTrabajados: number;
}

const LaborCalculator: React.FC = () => {
	const [startDate, setStartDate] = useState('');
	const [endDate, setEndDate] = useState('');
	const [salary, setSalary] = useState('');
	const [transportHelp, setTransportHelp] = useState(true);
	const [result, setResult] = useState<CalculationResult | null>(null);

	const AUXILIO_TRANSPORTE_2024 = 162000;
	const SALARIO_MINIMO_2024 = 1300000;

	const calculateDays = (start: Date, end: Date) => {
		// Cálculo aproximado de días (360 días año comercial para laboral)
		// Se suma 1 para incluir el día final
		const diffTime = Math.abs(end.getTime() - start.getTime());
		const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
		return diffDays;
	};

	const handleCalculate = (e: React.FormEvent) => {
		e.preventDefault();
		if (!startDate || !endDate || !salary) return;

		const start = new Date(startDate);
		const end = new Date(endDate);

		if (end < start) {
			alert('La fecha final no puede ser anterior a la inicial');
			return;
		}

		const dias = calculateDays(start, end);
		const salarioBase = Number(salary);

		// Base de liquidación: Salario + Aux. Transporte (si aplica)
		// Para Cesantías y Prima se incluye Aux. Transporte si gana < 2 SMMLV
		// Para Vacaciones NO se incluye Aux. Transporte

		const incluyeAuxilio = transportHelp && salarioBase <= SALARIO_MINIMO_2024 * 2;
		const valorAuxilio = incluyeAuxilio ? AUXILIO_TRANSPORTE_2024 : 0;

		const basePrestaciones = salarioBase + valorAuxilio;
		const baseVacaciones = salarioBase;

		// Fórmulas
		// Cesantías: (Salario * Días) / 360
		const cesantias = (basePrestaciones * dias) / 360;

		// Intereses: (Cesantías * Días * 0.12) / 360
		const intereses = (cesantias * dias * 0.12) / 360;

		// Prima: (Salario * Días) / 360 (Semestral, aquí simplificado al total del periodo para el ejemplo general)
		const prima = (basePrestaciones * dias) / 360;

		// Vacaciones: (Salario * Días) / 720
		const vacaciones = (baseVacaciones * dias) / 720;

		setResult({
			cesantias,
			interesesCesantias: intereses,
			prima,
			vacaciones,
			total: cesantias + intereses + prima + vacaciones,
			diasTrabajados: dias
		});
	};

	const formatCurrency = (val: number) => {
		return new Intl.NumberFormat('es-CO', {
			style: 'currency',
			currency: 'COP',
			maximumFractionDigits: 0
		}).format(val);
	};

	return (
		<div className="mx-auto w-full max-w-2xl overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xl">
			<div className="bg-green-700 p-6 text-center text-white">
				<h2 className="text-2xl font-bold">Calculadora de Liquidación Laboral</h2>
				<p className="mt-1 opacity-90">Estimación basada en normativa vigente Colombia 2024</p>
			</div>

			<div className="p-8">
				<form onSubmit={handleCalculate} className="space-y-6">
					<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
						<div>
							<label className="mb-2 block text-sm font-medium text-gray-700">Fecha Inicio</label>
							<input
								type="date"
								value={startDate}
								onChange={(e) => setStartDate(e.target.value)}
								className="bg-opacity-50 w-full rounded-lg border-gray-300 bg-gray-50 p-3 shadow-sm focus:border-green-500 focus:ring-green-500"
								required
							/>
						</div>
						<div>
							<label className="mb-2 block text-sm font-medium text-gray-700">Fecha Fin</label>
							<input
								type="date"
								value={endDate}
								onChange={(e) => setEndDate(e.target.value)}
								className="bg-opacity-50 w-full rounded-lg border-gray-300 bg-gray-50 p-3 shadow-sm focus:border-green-500 focus:ring-green-500"
								required
							/>
						</div>
					</div>

					<div>
						<label className="mb-2 block text-sm font-medium text-gray-700">
							Salario Mensual Base
						</label>
						<div className="relative rounded-md shadow-sm">
							<div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
								<span className="text-gray-500 sm:text-sm">$</span>
							</div>
							<input
								type="number"
								value={salary}
								onChange={(e) => setSalary(e.target.value)}
								className="bg-opacity-50 block w-full rounded-lg border-gray-300 bg-gray-50 p-3 pl-8 focus:border-green-500 focus:ring-green-500"
								placeholder="1300000"
								required
							/>
						</div>
					</div>

					<div className="flex items-center">
						<input
							id="transport"
							type="checkbox"
							checked={transportHelp}
							onChange={(e) => setTransportHelp(e.target.checked)}
							className="h-5 w-5 rounded border-gray-300 text-green-600 focus:ring-green-500"
						/>
						<label htmlFor="transport" className="ml-3 text-sm text-gray-700">
							¿Incluir Auxilio de Transporte?{' '}
							<span className="text-xs text-gray-500">(Si aplica por ley)</span>
						</label>
					</div>

					<button
						type="submit"
						className="flex w-full justify-center rounded-xl border border-transparent bg-green-600 px-4 py-4 text-lg font-bold text-white shadow-sm transition-colors hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:outline-none"
					>
						Calcular Liquidación
					</button>
				</form>

				{result && (
					<div className="animate-fadeIn mt-10 rounded-xl border border-green-100 bg-green-50 p-6">
						<h3 className="mb-4 border-b border-green-200 pb-2 text-lg font-bold text-green-900">
							Resultados Estimados
						</h3>

						<div className="space-y-3">
							<div className="flex items-center justify-between text-sm">
								<span className="text-gray-600">Días trabajados:</span>
								<span className="font-semibold text-gray-900">{result.diasTrabajados} días</span>
							</div>
							<div className="flex items-center justify-between">
								<span className="text-gray-700">Cesantías:</span>
								<span className="font-medium text-gray-900">
									{formatCurrency(result.cesantias)}
								</span>
							</div>
							<div className="flex items-center justify-between">
								<span className="text-gray-700">Intereses Cesantías:</span>
								<span className="font-medium text-gray-900">
									{formatCurrency(result.interesesCesantias)}
								</span>
							</div>
							<div className="flex items-center justify-between">
								<span className="text-gray-700">Prima de Servicios:</span>
								<span className="font-medium text-gray-900">{formatCurrency(result.prima)}</span>
							</div>
							<div className="flex items-center justify-between">
								<span className="text-gray-700">Vacaciones:</span>
								<span className="font-medium text-gray-900">
									{formatCurrency(result.vacaciones)}
								</span>
							</div>

							<div className="mt-4 flex items-center justify-between border-t-2 border-green-200 pt-4 text-lg font-bold md:text-xl">
								<span className="text-green-800">Total Liquidación:</span>
								<span className="text-green-700">{formatCurrency(result.total)}</span>
							</div>
						</div>

						<div className="mt-4 text-center text-xs text-gray-500">
							* Este cálculo es informativo y no constituye una liquidación oficial ni asesoría
							legal vinculante.
						</div>
					</div>
				)}
			</div>
		</div>
	);
};

export default LaborCalculator;
