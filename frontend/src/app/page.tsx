'use client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useRouter } from 'next/navigation'; // for Next.js 13+ App Router


import { useEffect, useState } from 'react';
type Patient = {
  id?: number;
  first_name: string;
  last_name: string;
  dob: string;
  sex: string;
  ethnic_background: string;
};
const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function HomePage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [isFetching, setIsFetching] = useState<boolean>(false);
  const [search, setSearch] = useState<string>('');
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [patientToDelete, setPatientToDelete] = useState<Patient | null>(null);

  const router = useRouter();
  const fetchPatients = async (pageNum: number) => {
    setIsFetching(true);
    try {
      const res = await fetch(`${API_URL}/patients?page=${pageNum}`);
      const data = await res.json();
      if (data.series?.success) {
        setPatients((prev) => [...prev, ...data.series.result.patients]);
        setTotalPages(data.series.result.total_pages);
      }
    } catch (error) {
      console.error('Error fetching patients:', error);
    } finally {
      setLoading(false);
      setIsFetching(false);
    }
  };

  useEffect(() => {
    fetchPatients(page);
  }, [page]);

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`${API_URL}/patients/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setPatients((prev) => prev.filter((p) => p.id !== id));
      } else {
        console.error('Failed to delete patient', await res.text());
      }
    } catch (error) {
      console.error('Error deleting patient:', error);
    }
  };

  // Infinite scroll
  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 300 &&
        !isFetching &&
        page < totalPages
      ) {
        setPage((prev) => prev + 1);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isFetching, page, totalPages]);

  // Filter
  useEffect(() => {
    if (!search) setFilteredPatients(patients);
    else {
      const filtered = patients.filter((p) =>
        `${p.first_name} ${p.last_name}`.toLowerCase().includes(search.toLowerCase())
      );
      setFilteredPatients(filtered);
    }
  }, [search, patients]);

  if (loading && patients.length === 0)
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="loader w-12 h-12 border-t-4 border-blue-500 rounded-full animate-spin"></div>
      </div>
    );

  return (
    <div className="p-6 min-h-screen bg-gray-100 flex justify-center">
      <div className="w-full max-w-8xl space-y-4">
        {/* Search Card */}
        <div className="bg-white rounded-lg shadow-sm p-3 flex items-center gap-3">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 1010.5 18a7.5 7.5 0 006.15-3.15z"
            />
          </svg>
          <Input
            placeholder="Search patients..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border-none shadow-none focus:ring-0"
          />
        </div>

        {/* Patients Table Card */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden p-3">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 uppercase tracking-wider">
                  Patient Name
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 uppercase tracking-wider">
                  Date of Birth
                </th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {filteredPatients.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-6 text-center text-gray-400">
                    No patients found
                  </td>
                </tr>
              ) : (
                filteredPatients.map((patient) => (
                  <tr key={patient.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">{`${patient.first_name} ${patient.last_name}`}</td>
                    <td className="px-4 py-3">{patient.dob}</td>
                    <td className="px-4 py-3 text-right flex justify-end gap-2">
                      <Button
                        asChild
                        variant="ghost"
                        size="lg"
                        onClick={() => router.push(`/process/${patient.id}`)}
                      >
                        <span className="text-lg text-blue-500">→</span>
                      </Button>
                      {/* Delete Dialog */}
                      <Dialog open={!!patientToDelete && patientToDelete.id === patient.id} onOpenChange={(open) => !open && setPatientToDelete(null)}>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="lg"
                            onClick={() => setPatientToDelete(patient)}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5-4h4m-4 0a1 1 0 00-1 1v0a1 1 0 001 1h4a1 1 0 001-1v0a1 1 0 00-1-1m-4 0h4" />
                            </svg>
                          </Button>
                        </DialogTrigger>

                        <DialogContent>
                          <DialogHeader className='text-center m-auto'>
                            <DialogTitle>Are you sure you want to delete this patient</DialogTitle>

                          </DialogHeader>
                          <DialogFooter className="flex justify-center items-center gap-2 m-auto">
                            <Button variant="outline" onClick={() => setPatientToDelete(null)}>Cancel</Button>
                            <Button
                              variant="destructive"
                              onClick={() => {
                                handleDelete(patient.id!);
                                setPatientToDelete(null);
                              }}
                            >
                              Delete
                            </Button>
                          </DialogFooter>

                        </DialogContent>
                      </Dialog>

                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Floating Add Button */}
        <Button
          onClick={() => setShowAddForm(true)}
          className="fixed bg-blue-500 hover:bg-blue-800 bottom-6 right-6 rounded-full w-14 h-14 flex items-center justify-center text-2xl shadow-lg"
        >
          +
        </Button>
      </div>
      {showAddForm && (
        <AddPatientForm
          onClose={() => setShowAddForm(false)}
          onAdd={(newPatient) => setPatients((prev) => [newPatient, ...prev])}
        />
      )}

    </div>

  );
}













import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogDescription } from "@/components/ui/dialog";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type AddPatient = {
  first_name: string;
  last_name: string;
  dob: string;
  sex: string;
  ethnic_background: string;
};

type Props = {
  onClose: () => void;
  onAdd: (patient: AddPatient) => void;
};

function AddPatientForm({ onClose, onAdd }: Props) {
  const [formData, setFormData] = useState<Patient>({
    first_name: '',
    last_name: '',
    dob: '',
    sex: 'other',
    ethnic_background: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/patients`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.series?.success && data.series.result?.patient) {
        onAdd(data.series.result.patient);
        onClose();
      }
    } catch (error) {
      console.error('Error adding patient:', error);
    } finally {
      setSubmitting(false);
    }
  };
  return (
    <Dialog open onOpenChange={onClose}>
      {/* Overlay with blur */}
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40" />

      <DialogContent className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 max-w-md w-full bg-white p-6 rounded-2xl shadow-xl z-50">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-800">
            Add New Patient
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-4">
          {/* First Name */}
          <div className="flex flex-col">
            <label htmlFor="first_name" className="text-gray-700 font-medium mb-1">
              First Name
            </label>
            <Input
              id="first_name"
              name="first_name"
              placeholder="Enter first name"
              value={formData.first_name}
              onChange={handleChange}
              className="shadow-sm rounded-lg"
              required
            />
          </div>

          {/* Last Name */}
          <div className="flex flex-col">
            <label htmlFor="last_name" className="text-gray-700 font-medium mb-1">
              Last Name
            </label>
            <Input
              id="last_name"
              name="last_name"
              placeholder="Enter last name"
              value={formData.last_name}
              onChange={handleChange}
              className="shadow-sm rounded-lg"
              required
            />
          </div>

          {/* Date of Birth */}
          <div className="flex flex-col">
            <label htmlFor="dob" className="text-gray-700 font-medium mb-1">
              Date of Birth
            </label>
            <Input
              type="date"
              id="dob"
              name="dob"
              value={formData.dob}
              onChange={handleChange}
              className="shadow-sm rounded-lg"
              required
            />
            <span className="text-sm text-gray-400 mt-1">Format: dd/mm/yyyy</span>
          </div>
          {/* Sex */}
          <div className="flex flex-col w-full">
            <label htmlFor="sex" className="text-gray-700 font-medium mb-1">
              Sex
            </label>
            <Select
              value={formData.sex}
              onValueChange={(val) => setFormData({ ...formData, sex: val })}
            >
              <SelectTrigger id="sex" className="shadow-sm rounded-lg w-full">
                <SelectValue placeholder="Select sex" />
              </SelectTrigger>
              <SelectContent className="w-full">
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>


          {/* Ethnic Background */}
          <div className="flex flex-col">
            <label htmlFor="ethnic_background" className="text-gray-700 font-medium mb-1">
              Ethnic Background
            </label>
            <Input
              id="ethnic_background"
              name="ethnic_background"
              placeholder="Enter ethnic background"
              value={formData.ethnic_background}
              onChange={handleChange}
              className="shadow-sm rounded-lg"
              required
            />
          </div>

          <DialogFooter className="flex justify-end gap-3 mt-5">
            <Button variant="outline" onClick={onClose} className="w-24">
              Cancel
            </Button>
            <Button type="submit" className="w-28 bg-blue-600 text-white hover:bg-blue-700" disabled={submitting}>
              {submitting ? 'Adding...' : 'Add Patient'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );

}
