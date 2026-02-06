
import React, { useState, useEffect } from 'react';
import { Employee } from '../types';

interface EmployeeFormProps {
  onAdd: (employee: Employee) => void;
  onUpdate: (employee: Employee) => void;
  editingEmployee: Employee | null;
  onCancelEdit: () => void;
}

export const EmployeeForm: React.FC<EmployeeFormProps> = ({ 
  onAdd, 
  onUpdate, 
  editingEmployee, 
  onCancelEdit 
}) => {
  const [formData, setFormData] = useState<Employee>({
    name: '',
    registration: '',
    role: '',
    workHours: 40
  });

  useEffect(() => {
    if (editingEmployee) {
      setFormData(editingEmployee);
    } else {
      setFormData({ name: '', registration: '', role: '', workHours: 40 });
    }
  }, [editingEmployee]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.registration || !formData.role) return;
    
    if (editingEmployee) {
      onUpdate(formData);
    } else {
      onAdd(formData);
    }
    
    setFormData({ name: '', registration: '', role: '', workHours: 40 });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'workHours' ? parseInt(value) || 0 : value
    }));
  };

  return (
    <div className={`bg-white p-6 rounded-xl shadow-sm border transition-colors ${editingEmployee ? 'border-amber-200 ring-1 ring-amber-100' : 'border-slate-200'}`}>
      <h2 className="text-xl font-semibold mb-6 text-slate-800 flex items-center gap-2">
        {editingEmployee ? (
          <>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Editar Colaborador
          </>
        ) : (
          <>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
            Novo Colaborador
          </>
        )}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Nome Completo</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            placeholder="Ex: João da Silva"
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Matrícula</label>
            <input
              type="text"
              name="registration"
              value={formData.registration}
              onChange={handleChange}
              required
              placeholder="Ex: 2024001"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Carga Horária (Semanal)</label>
            <input
              type="number"
              name="workHours"
              value={formData.workHours}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Função</label>
          <input
            type="text"
            name="role"
            value={formData.role}
            onChange={handleChange}
            required
            placeholder="Ex: Desenvolvedor Senior"
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
          />
        </div>

        <div className="flex gap-2 mt-2">
          {editingEmployee && (
            <button
              type="button"
              onClick={onCancelEdit}
              className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold py-2.5 px-4 rounded-lg transition-colors"
            >
              Cancelar
            </button>
          )}
          <button
            type="submit"
            className={`flex-[2] text-white font-semibold py-2.5 px-4 rounded-lg transition-colors shadow-sm ${editingEmployee ? 'bg-amber-500 hover:bg-amber-600' : 'bg-blue-600 hover:bg-blue-700'}`}
          >
            {editingEmployee ? 'Salvar Alterações' : 'Cadastrar Colaborador'}
          </button>
        </div>
      </form>
    </div>
  );
};
