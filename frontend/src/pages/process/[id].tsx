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
const API_URL = process.env.NEXT_PUBLIC_API_URL;
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

    // Dialog states
    const [fetchError, setFetchError] = useState<string | null>(null);
    const [processError, setProcessError] = useState<string | null>(null);

    // Fetch patient name
    useEffect(() => {
        if (!patientId) return;
        fetch(`${API_URL}/patients/${patientId}`)
            .then(res => {
                if (!res.ok) throw new Error(`Server responded with ${res.status}`);
                return res.json();
            })
            .then(data => {
                const patient = data.series?.result?.patient;
                if (!patient) throw new Error('Patient data missing');
                setPatientName(`${patient.first_name} ${patient.last_name}`);
            })
            .catch(err => {
                console.error(err);
                setFetchError('Could not connect to server. Please check your connection.');
            });
    }, [patientId]);

    const processPatient = useCallback(
    debounce(async (weightValue: number, heightValue: number) => {
        if (!patientId) return;
        setLoading(true);
        setProcessError(null); // reset previous errors
        try {
            const res = await fetch(`${API_URL}/patients/${patientId}/process`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    weight: { value: weightValue, unit: 'kg' },
                    height: { value: heightValue / 100, unit: 'm' },
                }),
            });

            if (!res.ok) {
                // Handle throttling
                if (res.status === 429) {
                    const data = await res.json();
                    const msg = data.detail || '';
                    const match = msg.match(/Expected available in (\d+) seconds/);
                    const seconds = match ? match[1] : '';
                    setProcessError(
                        seconds
                            ? `Server is busy. Please try again after ${seconds} seconds.`
                            : 'Server is busy. Please try again after a few seconds.'
                    );
                    return;
                }
                throw new Error(`Server responded with ${res.status}`);
            }

            const data = await res.json();

            if (!data.results || data.results.length === 0) {
                setGraphData([]);
                return;
            }

            const concentrations = data.results.map(d => d.concentration);
            setXAxisDomain([Math.min(...concentrations), Math.max(...concentrations)]);
            setGraphData(data.results);

        } catch (err) {
            console.error(err);
            if (!processError) {
                setProcessError('Server is busy. Please try again after a few seconds.');
            }
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
                                    label={{ value: 'Sample', position: 'insideBottom', offset: -5, fontSize: 12, fill: '#4b5563' }}
                                />
                                <YAxis
                                    dataKey="duration_30_m"
                                    label={{ value: 'Concentration', angle: -90, position: 'insideLeft', fontSize: 12, fill: '#4b5563' }}
                                />
                                <Tooltip
                                    formatter={(value, name) => {
                                        if (name === "duration_30_m") return [`${value}`, "Duration (30 min)"];
                                        if (name === "concentration") return [`${value}`, "Concentration"];
                                        return value;
                                    }}
                                />
                                <Line type="monotone" dataKey="duration_30_m" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    ) : (
                        <p className="text-gray-500 mt-10 text-center">
                            Enter weight and height to see the graph
                        </p>
                    )}
                </main>
            </div>

            {/* Fetch Error Dialog */}
            <Dialog open={!!fetchError} onOpenChange={() => setFetchError(null)}>
                <DialogContent>
                    <DialogHeader className="text-center">
                        <DialogTitle>Connection Error</DialogTitle>
                        <p>{fetchError}</p>
                    </DialogHeader>
                    <DialogFooter className="flex justify-center">
                        <Button variant="outline" onClick={() => setFetchError(null)}>Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Process Error Dialog */}
            <Dialog open={!!processError} onOpenChange={() => setProcessError(null)}>
                <DialogContent>
                    <DialogHeader className="text-center">
                        <DialogTitle>Server Busy</DialogTitle>
                        <p>{processError}</p>
                    </DialogHeader>
                    <DialogFooter className="flex justify-center">
                        <Button variant="outline" onClick={() => setProcessError(null)}>Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default PatientProcess;
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
