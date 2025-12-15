import React, { useState, useCallback } from 'react';

// Valores oficiales
const SALARIO_MINIMO_2025 = 1423500;
const AUXILIO_TRANSPORTE_2025 = 200000;

// Tooltip mejorado (pastel + animación fade/scale)
const Tooltip = React.memo(({ text }: { text: string }) => (
	<span className="group relative ml-1 cursor-pointer rounded-full bg-green-100 px-[6px] py-[1px] text-xs font-bold text-green-700 transition select-none hover:bg-green-200">
		?
		<span className="absolute top-5 left-0 z-50 hidden w-64 scale-95 rounded-lg border border-green-200 bg-white/95 p-3 text-xs text-gray-700 opacity-0 shadow-xl backdrop-blur-md transition-all duration-200 group-hover:block group-hover:scale-100 group-hover:opacity-100">
			{text}
		</span>
	</span>
));

interface CalculationResult {
	dias: number;
	cesantias: number;
	intereses: number;
	prima1: number;
	prima2: number;
	vacaciones: number;
	total: number;
	pension: number;
	salud: number;
	fondoSolidaridad: number;
}

const LaborCalculator = () => {
	const [startDate, setStartDate] = useState('');
	const [endDate, setEndDate] = useState('');
	const [salary, setSalary] = useState('');
	const [useMinSalary, setUseMinSalary] = useState(false);
	const [useAuxilio, setUseAuxilio] = useState(true);
	const [primaPagada, setPrimaPagada] = useState(false);

	const [result, setResult] = useState<CalculationResult | null>(null);

	// Cálculo oficial 30/360
	const commercialDays = useCallback((start: Date, end: Date) => {
		return (
			end.getDate() -
			start.getDate() +
			(end.getMonth() - start.getMonth()) * 30 +
			(end.getFullYear() - start.getFullYear()) * 360 +
			1
		);
	}, []);

	const commercialDaysInRange = useCallback(
		(start: Date, end: Date, r1: Date, r2: Date) => {
			const realStart = start > r1 ? start : r1;
			const realEnd = end < r2 ? end : r2;

			if (realEnd < realStart) return 0;

			return commercialDays(realStart, realEnd);
		},
		[commercialDays]
	);

	const calculate = (e: React.FormEvent) => {
		e.preventDefault();

		const start = new Date(startDate);
		const end = new Date(endDate);

		if (end < start) {
			alert('La fecha final no puede ser antes de la inicial.');
			return;
		}

		const salarioBase = useMinSalary ? SALARIO_MINIMO_2025 : Number(salary);
		const auxilio =
			useAuxilio && salarioBase <= SALARIO_MINIMO_2025 * 2 ? AUXILIO_TRANSPORTE_2025 : 0;

		const dias = commercialDays(start, end);

		const year = start.getFullYear();
		const sem1Start = new Date(year, 0, 1);
		const sem1End = new Date(year, 5, 30);
		const sem2Start = new Date(year, 6, 1);
		const sem2End = new Date(year, 11, 31);

		const dias1 = commercialDaysInRange(start, end, sem1Start, sem1End);
		const dias2 = commercialDaysInRange(start, end, sem2Start, sem2End);

		const basePrest = salarioBase + auxilio;

		const cesantias = (basePrest * dias) / 360;
		const intereses = (cesantias * 0.12 * dias) / 360;
		const prima1 = (basePrest * dias1) / 360;
		const prima2 = (basePrest * dias2) / 360;

		const primaTotal = prima1 + prima2 - (primaPagada ? prima1 : 0);

		const vacaciones = (salarioBase * dias) / 720;
		const total = cesantias + intereses + primaTotal + vacaciones;

		const pension = salarioBase * 0.04;
		const salud = salarioBase * 0.04;
		const fondoSolidaridad = salarioBase >= SALARIO_MINIMO_2025 * 4 ? salarioBase * 0.01 : 0;

		setResult({
			dias,
			cesantias,
			intereses,
			prima1,
			prima2,
			vacaciones,
			total,
			pension,
			salud,
			fondoSolidaridad
		});
	};

	const money = (v: number) =>
		new Intl.NumberFormat('es-CO', {
			style: 'currency',
			currency: 'COP',
			maximumFractionDigits: 0
		}).format(v);

	return (
		<div className="mx-auto w-full max-w-3xl rounded-2xl border border-gray-100 bg-white p-10 shadow-lg shadow-green-100/50 transition-all duration-500">
			<h2 className="mb-6 text-3xl font-extrabold tracking-tight text-green-700">
				Calculadora de Liquidación Laboral
			</h2>

			<form className="space-y-6" onSubmit={calculate}>
				{/* Fechas */}
				<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
					<div>
						<label className="font-medium text-gray-700">Fecha Inicio</label>
						<input
							type="date"
							required
							value={startDate}
							onChange={(e) => setStartDate(e.target.value)}
							className="w-full rounded-xl border bg-gray-50 p-3 transition hover:border-green-300 focus:ring-2 focus:ring-green-300"
						/>
					</div>

					<div>
						<label className="font-medium text-gray-700">Fecha Fin</label>
						<input
							type="date"
							required
							value={endDate}
							onChange={(e) => setEndDate(e.target.value)}
							className="w-full rounded-xl border bg-gray-50 p-3 transition hover:border-green-300 focus:ring-2 focus:ring-green-300"
						/>
					</div>
				</div>

				{/* Salario */}
				<div className="space-y-2">
					<div className="flex items-center justify-between">
						<label className="font-medium text-gray-700">Salario Mensual Base</label>

						<label className="flex items-center gap-2 text-sm">
							<input
								type="checkbox"
								checked={useMinSalary}
								onChange={(e) => {
									setUseMinSalary(e.target.checked);
									if (e.target.checked) setSalary(String(SALARIO_MINIMO_2025));
								}}
							/>
							Usar SMMLV 2025
						</label>
					</div>

					<input
						type="number"
						disabled={useMinSalary}
						placeholder="Ej: 2.000.000"
						value={salary}
						onChange={(e) => setSalary(e.target.value)}
						className="w-full rounded-xl border bg-gray-50 p-3 transition hover:border-green-300 focus:ring-2 focus:ring-green-300 disabled:bg-gray-200"
					/>
				</div>

				{/* Auxilio */}
				<label className="flex items-start gap-3 text-sm text-gray-700">
					<input
						type="checkbox"
						checked={useAuxilio}
						onChange={(e) => setUseAuxilio(e.target.checked)}
					/>
					Incluir Auxilio de Transporte ({money(AUXILIO_TRANSPORTE_2025)})
				</label>

				{/* Prima Pagada */}
				<label className="flex items-start gap-3 text-sm text-gray-700">
					<input
						type="checkbox"
						checked={primaPagada}
						onChange={(e) => setPrimaPagada(e.target.checked)}
					/>
					¿Ya se pagó la prima del primer semestre?
				</label>

				<button className="w-full rounded-xl bg-green-600 py-3 font-bold text-white shadow-md transition-all hover:bg-green-700 active:scale-[0.98]">
					Calcular
				</button>
			</form>

			{/* Resultados */}
			{result && (
				<div className="mt-10 animate-[fadeIn_0.5s_ease] rounded-xl border border-green-200 bg-gradient-to-br from-green-50 to-white p-6 shadow-inner">
					<h3 className="mb-4 text-xl font-bold text-green-900">Resultados</h3>

					<div className="space-y-3 text-sm">
						<div className="flex justify-between">
							<span>
								Días trabajados{' '}
								<Tooltip text="Tiempo calculado usando el método oficial del Ministerio: cada mes cuenta como 30 días." />
							</span>
							<strong>{result.dias}</strong>
						</div>

						<div className="flex justify-between">
							<span>
								Cesantías{' '}
								<Tooltip text="Un ahorro obligatorio que la empresa te debe por tu tiempo de trabajo." />
							</span>
							<strong>{money(result.cesantias)}</strong>
						</div>

						<div className="flex justify-between">
							<span>
								Intereses{' '}
								<Tooltip text="Un extra del 12% anual sobre tus cesantías, proporcional al tiempo trabajado." />
							</span>
							<strong>{money(result.intereses)}</strong>
						</div>

						<div className="flex justify-between">
							<span>
								Prima 1er semestre{' '}
								<Tooltip text="Pago adicional por tu trabajo entre enero y junio." />
							</span>
							<strong>{money(result.prima1)}</strong>
						</div>

						<div className="flex justify-between">
							<span>
								Prima 2º semestre{' '}
								<Tooltip text="Pago adicional por tu trabajo entre julio y diciembre." />
							</span>
							<strong>{money(result.prima2)}</strong>
						</div>

						<div className="flex justify-between">
							<span>
								Vacaciones{' '}
								<Tooltip text="El valor equivalente al descanso remunerado que ganaste por tu trabajo." />
							</span>
							<strong>{money(result.vacaciones)}</strong>
						</div>

						<hr className="my-5 border-green-300" />

						<div className="flex justify-between text-xl font-bold text-green-700">
							<span>Total Liquidación</span>
							<span>{money(result.total)}</span>
						</div>

						<h4 className="mt-6 text-lg font-bold text-green-800">Aportes a Seguridad Social</h4>

						<div className="mt-2 space-y-2">
							<div className="flex justify-between">
								<span>Pensión (4%)</span>
								<span>{money(result.pension)}</span>
							</div>

							<div className="flex justify-between">
								<span>Salud (4%)</span>
								<span>{money(result.salud)}</span>
							</div>

							<div className="flex justify-between">
								<span>Fondo de solidaridad</span>
								<span>{money(result.fondoSolidaridad)}</span>
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default LaborCalculator;
