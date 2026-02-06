
import React, { useState, useEffect, useRef } from 'react';
import { Employee } from '../types';
import { sqliteService } from '../services/sqliteService';

declare const jspdf: any;

interface TimesheetModuleProps {
  employees: Employee[];
}

export const TimesheetModule: React.FC<TimesheetModuleProps> = ({ employees }) => {
  const [selectedId, setSelectedId] = useState<string>('');
  const [month, setMonth] = useState<number>(new Date().getMonth());
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [headerContent, setHeaderContent] = useState<string>('NOME DA EMPRESA\nSECRETARIA DE ADMINISTRAÇÃO\nDEPARTAMENTO DE RECURSOS HUMANOS');
  const [isSavingHeader, setIsSavingHeader] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);

  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  useEffect(() => {
    const loadHeader = async () => {
      const savedHeader = await sqliteService.getConfig('timesheet_header');
      if (savedHeader) {
        setHeaderContent(savedHeader);
        if (editorRef.current) {
          editorRef.current.innerHTML = savedHeader;
        }
      } else if (editorRef.current) {
        editorRef.current.innerText = headerContent;
      }
    };
    loadHeader();
  }, []);

  const handleSaveHeader = async () => {
    if (!editorRef.current) return;
    setIsSavingHeader(true);
    const content = editorRef.current.innerHTML;
    try {
      await sqliteService.setConfig('timesheet_header', content);
      setHeaderContent(content);
      alert("Cabeçalho salvo com sucesso!");
    } catch (err) {
      alert("Erro ao salvar cabeçalho.");
    } finally {
      setIsSavingHeader(false);
    }
  };

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    if (editorRef.current) editorRef.current.focus();
  };

  const handlePrint = () => {
    const employee = employees.find(e => e.id?.toString() === selectedId);
    if (!employee) return alert("Selecione um servidor primeiro.");

    const doc = new jspdf.jsPDF();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    // Header do Documento (Cabeçalho Institucional)
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = editorRef.current?.innerHTML || headerContent;
    const lines = tempDiv.innerText.split('\n').filter(line => line.trim() !== '');
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    let currentY = 15;
    lines.forEach(line => {
      doc.text(line.toUpperCase(), 105, currentY, { align: 'center' });
      currentY += 5;
    });

    currentY += 5;
    doc.setFontSize(14);
    doc.text("FOLHA DE FREQUÊNCIA INDIVIDUAL", 105, currentY, { align: 'center' });
    currentY += 8;
    
    doc.setLineWidth(0.2);
    doc.rect(10, currentY, 190, 25); // Border for header info
    
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(`SERVIDOR: ${employee.name.toUpperCase()}`, 12, currentY + 7);
    doc.text(`MATRÍCULA: ${employee.registration}`, 12, currentY + 13);
    doc.text(`CARGO/FUNÇÃO: ${employee.role}`, 12, currentY + 19);
    
    doc.text(`TURNO: ${employee.shift}`, 120, currentY + 7);
    doc.text(`MÊS DE REFERÊNCIA: ${months[month].toUpperCase()}`, 120, currentY + 13);
    doc.text(`ANO: ${year}`, 120, currentY + 19);

    // Tabela de Frequência (Removido Retorno, Coluna 3 vira Assinatura)
    const tableData = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d);
      const dayName = date.toLocaleDateString('pt-BR', { weekday: 'short' });
      const isWeekend = date.getDay() === 0 || date.getDay() === 6;
      
      tableData.push([
        `${d.toString().padStart(2, '0')} (${dayName})`,
        isWeekend ? '---' : '',
        isWeekend ? '---' : '',
        isWeekend ? '---' : '',
        isWeekend ? (date.getDay() === 0 ? 'DOMINGO' : 'SÁBADO') : ''
      ]);
    }

    doc.autoTable({
      startY: currentY + 30,
      head: [['DIA', 'ENTRADA', 'ASSINATURA', 'SAÍDA', 'ASSINATURA']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold', lineWidth: 0.1 },
      styles: { fontSize: 8, cellPadding: 1.5, lineWidth: 0.1, lineColor: [0, 0, 0] },
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 25 },
        2: { cellWidth: 45 },
        3: { cellWidth: 25 },
        4: { cellWidth: 'auto' }
      }
    });

    // Footer signatures
    const finalY = (doc as any).lastAutoTable.finalY + 20;
    doc.setLineWidth(0.1);
    doc.line(20, finalY, 90, finalY);
    doc.text("Assinatura do Servidor", 55, finalY + 5, { align: 'center' });
    
    doc.line(120, finalY, 190, finalY);
    doc.text("Assinatura Chefia Imediata", 155, finalY + 5, { align: 'center' });

    doc.save(`folha_ponto_${employee.registration}_${months[month].toLowerCase()}.pdf`);
  };

  return (
    <div className="space-y-6">
      {/* Área de Configuração do Cabeçalho */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          Configuração do Cabeçalho Institucional
        </h3>
        
        <div className="border border-slate-200 rounded-lg overflow-hidden">
          <div className="bg-slate-50 border-b border-slate-200 p-2 flex flex-wrap gap-1">
            <button onClick={() => execCommand('bold')} className="p-1.5 hover:bg-slate-200 rounded text-slate-700 font-bold border border-transparent hover:border-slate-300" title="Negrito">B</button>
            <button onClick={() => execCommand('italic')} className="p-1.5 hover:bg-slate-200 rounded text-slate-700 italic border border-transparent hover:border-slate-300" title="Itálico">I</button>
            <div className="w-px h-6 bg-slate-300 mx-1 self-center"></div>
            <button onClick={() => execCommand('justifyLeft')} className="p-1.5 hover:bg-slate-200 rounded text-slate-700 border border-transparent hover:border-slate-300" title="Esquerda">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h10M4 18h16" /></svg>
            </button>
            <button onClick={() => execCommand('justifyCenter')} className="p-1.5 hover:bg-slate-200 rounded text-slate-700 border border-transparent hover:border-slate-300" title="Centralizado">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M7 12h10M4 18h16" /></svg>
            </button>
          </div>
          <div 
            ref={editorRef}
            contentEditable
            className="p-4 min-h-[120px] bg-white outline-none focus:ring-2 focus:ring-blue-100 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap"
            onBlur={(e) => setHeaderContent(e.currentTarget.innerHTML)}
          ></div>
        </div>
        
        <div className="mt-4 flex justify-end">
          <button 
            onClick={handleSaveHeader}
            disabled={isSavingHeader}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-lg transition-all shadow-sm"
          >
            {isSavingHeader ? (
              <div className="animate-spin h-3 w-3 border-2 border-white border-t-transparent rounded-full"></div>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
            )}
            SALVAR CABEÇALHO PADRÃO
          </button>
        </div>
      </div>

      {/* Seleção de Servidor e Data */}
      <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200">
        <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Gerar Folha de Frequência
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest">Servidor</label>
            <select 
              className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
            >
              <option value="">Selecione um colaborador...</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.name} ({emp.registration})</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest">Mês de Referência</label>
            <select 
              className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
              value={month}
              onChange={(e) => setMonth(parseInt(e.target.value))}
            >
              {months.map((m, idx) => (
                <option key={m} value={idx}>{m}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest">Ano</label>
            <input 
              type="number" 
              className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value))}
            />
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-100 p-6 rounded-xl text-center">
          <p className="text-blue-800 text-sm mb-6 max-w-lg mx-auto leading-relaxed">
            Certifique-se de que o cabeçalho acima esteja correto antes de gerar o PDF. 
            Ele será exibido no topo de cada folha de frequência emitida.
          </p>
          <button
            onClick={handlePrint}
            disabled={!selectedId}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold py-3 px-10 rounded-lg transition-all shadow-lg hover:shadow-xl flex items-center gap-2 mx-auto uppercase tracking-wider text-sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Gerar PDF Agora
          </button>
        </div>
      </div>
    </div>
  );
};
