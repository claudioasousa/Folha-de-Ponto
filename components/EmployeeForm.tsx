
import React, { useState, useEffect } from 'react';
import { Employee, ShiftType } from '../types';

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
    shift: 'Manhã'
  });

  useEffect(() => {
    if (editingEmployee) {
      setFormData(editingEmployee);
    } else {
      setFormData({ name: '', registration: '', role: '', shift: 'Manhã' });
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
    
    setFormData({ name: '', registration: '', role: '', shift: 'Manhã' });
  };

  return (
    <div className={`bg-white p-6 rounded-xl shadow-sm border transition-colors ${editingEmployee ? 'border-amber-200 ring-1 ring-amber-100' : 'border-slate-200'}`}>
      <h2 className="text-lg font-bold mb-6 text-slate-800 flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
        {editingEmployee ? 'Editar Servidor' : 'Cadastrar Servidor'}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Servidor</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            required
            placeholder="Nome completo do servidor"
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Matrícula</label>
            <input
              type="text"
              value={formData.registration}
              onChange={(e) => setFormData({...formData, registration: e.target.value})}
              required
              placeholder="Nº Matrícula"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Turno</label>
            <select
              value={formData.shift}
              onChange={(e) => setFormData({...formData, shift: e.target.value as ShiftType})}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-white"
            >
              <option value="Manhã">Manhã</option>
              <option value="Tarde">Tarde</option>
              <option value="Noite">Noite</option>
              <option value="Integral">Integral</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Função / Cargo</label>
          <input
            type="text"
            value={formData.role}
            onChange={(e) => setFormData({...formData, role: e.target.value})}
            required
            placeholder="Ex: Professor, Administrativo..."
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
          />
        </div>

        <div className="flex gap-2 pt-2">
          {editingEmployee && (
            <button
              type="button"
              onClick={onCancelEdit}
              className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-2.5 px-4 rounded-lg transition-colors text-sm"
            >
              Cancelar
            </button>
          )}
          <button
            type="submit"
            className={`flex-[2] text-white font-bold py-2.5 px-4 rounded-lg transition-colors shadow-sm text-sm ${editingEmployee ? 'bg-amber-500 hover:bg-amber-600' : 'bg-blue-600 hover:bg-blue-700'}`}
          >
            {editingEmployee ? 'Salvar Alterações' : 'Confirmar Cadastro'}
          </button>
        </div>
      </form>
    </div>
  );
};
