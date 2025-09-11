'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { debounce } from 'lodash';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts';

interface GraphResult {
    duration_30_m: number;
    concentration: number;
}

const PatientProcess: React.FC = () => {
    const params = useParams();
    const router = useRouter();
    const patientId = params?.id;

    const [patientName, setPatientName] = useState<string>('');
    const [weight, setWeight] = useState<number>(0);
    const [height, setHeight] = useState<number>(0);
    const [graphData, setGraphData] = useState<GraphResult[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [xAxisDomain, setXAxisDomain] = useState<[number, number]>([0, 100]);

    // Fetch patient name
    useEffect(() => {
        if (!patientId) return;
        fetch(`http://localhost/api/patients/${patientId}`)
            .then(res => res.json())
            .then(data => {
                const patient = data.series.result.patient;
                setPatientName(`${patient.first_name} ${patient.last_name}`);
            })
            .catch(console.error);
    }, [patientId]);

    // Debounced API call
    const processPatient = useCallback(
        debounce(async (weightValue: number, heightValue: number) => {
            if (!patientId) return;
            setLoading(true);

            try {
                const res = await fetch(`http://localhost/api/patients/${patientId}/process`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        weight: { value: weightValue, unit: 'kg' },
                        height: { value: heightValue / 100, unit: 'm' },
                    }),
                });

                const data = await res.json();

                if (!data.results || data.results.length === 0) {
                    setGraphData([]);
                    return;
                }

                // Keep durations as-is, only adjust X-axis domain
                const concentrations = data.results.map(d => d.concentration);
                setXAxisDomain([Math.min(...concentrations), Math.max(...concentrations)]);

                setGraphData(data.results);

            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }, 500),
        [patientId]
    );

    // Call API when inputs change
    useEffect(() => {
        processPatient(weight, height);
    }, [weight, height, processPatient]);

    return (
        <div className="flex flex-col h-screen p-6 bg-gray-50">
            {/* Header */}
            <header className="flex gap-5 items-center mb-6">
                <button
                    onClick={() => router.push('/')}
                    className="font-medium hover:underline"
                >
                    ← Back to Patients
                </button>
                <h1 className="text-2xl font-bold text-gray-800">{patientName}</h1>
            </header>

            {/* Main content */}
            <div className="flex flex-1 gap-6 h-full">
                {/* Aside Form */}
                <aside className="w-64 p-6 bg-white border rounded-xl shadow-lg flex flex-col gap-6">
                    <div>
                        <label className="block text-gray-700 font-medium mb-2">Weight (kg)</label>
                        <input
                            type="number"
                            value={weight}
                            onChange={(e) => setWeight(Number(e.target.value))}
                            className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 appearance-none"
                            placeholder="e.g., 70"
                        />
                    </div>
                    <div>
                        <label className="block text-gray-700 font-medium mb-2">Height (cm)</label>
                        <input
                            type="number"
                            value={height}
                            onChange={(e) => setHeight(Number(e.target.value))}
                            className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 appearance-none"
                            placeholder="e.g., 175"
                        />
                    </div>
                    {loading && <p className="text-sm text-gray-500 mt-2">Processing...</p>}
                </aside>

                {/* Graph */}
                <main className="flex-1 p-6 bg-white border rounded-xl shadow-lg flex flex-col">
                    <h2 className="text-xl text-center font-semibold mb-4">Sample Concentration Chart</h2>
                    {graphData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={500}>
                            <LineChart data={graphData} margin={{ top: 20, right: 20, left: 0, bottom: 40 }}>

                                <CartesianGrid strokeDasharray="4 4" stroke="#e2e8f0" />
                                <XAxis
                                    dataKey="concentration"
                                    domain={xAxisDomain}
                                    label={{
                                        value: 'Sample',
                                        position: 'insideBottom',
                                        offset: -5,
                                        fontSize: 12,
                                        fill: '#4b5563',
                                    }}
                                />
                                <YAxis
                                    dataKey="duration_30_m"
                                    label={{
                                        value: 'Cencenlration',
                                        angle: -90,
                                        position: 'insideLeft',
                                        fontSize: 12,
                                        fill: '#4b5563',
                                    }}
                                />
                                <Tooltip
                                    formatter={(value, name) => {
                                        if (name === "duration_30_m") return [`${value}`, "Duration (30 min)"];
                                        if (name === "concentration") return [`${value}`, "Concentration"];
                                        return value;
                                    }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="duration_30_m"
                                    stroke="#3b82f6"
                                    strokeWidth={3}
                                    dot={{ r: 4 }}
                                    activeDot={{ r: 6 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    ) : (
                        <p className="text-gray-500 mt-10 text-center">
                            Enter weight and height to see the graph
                        </p>
                    )}
                </main>
            </div>
        </div>
    );
};

export default PatientProcess;
