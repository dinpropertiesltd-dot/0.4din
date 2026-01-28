
import React, { useState, useMemo } from 'react';
import { PropertyFile, Transaction } from '../types';
import { 
  Search, 
  Eye, 
  Edit,
  X,
  Plus,
  Trash2,
  Save,
  Building,
  UserPlus,
  FilePlus,
  ArrowRight,
  Info,
  Download,
  FileSpreadsheet,
  MapPin,
  Database,
  Banknote
} from 'lucide-react';

interface PropertyPortalProps {
  allFiles: PropertyFile[];
  setAllFiles: (files: PropertyFile[]) => void;
  onPreviewStatement?: (file: PropertyFile) => void;
  isLocalDataPinned?: boolean;
}

const PropertyPortal: React.FC<PropertyPortalProps> = ({ 
  allFiles, 
  setAllFiles,
  onPreviewStatement,
  isLocalDataPinned
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingFile, setEditingFile] = useState<PropertyFile | null>(null);
  const [isCreatingFile, setIsCreatingFile] = useState(false);
  const [tempTransactions, setTempTransactions] = useState<Transaction[]>([]);

  // New File State
  const [newFileData, setNewFileData] = useState<Partial<PropertyFile>>({
    fileNo: '',
    ownerCNIC: '',
    ownerName: '',
    plotSize: '5 Marla-Residential',
    plotValue: 0,
    regDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
    currencyNo: '-',
    fatherName: '',
    cellNo: '',
    address: '',
    plotNo: '-',
    block: '-',
    park: '-',
    corner: '-',
    mainBoulevard: '-'
  });

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', maximumFractionDigits: 0 }).format(val);
  };

  const handleExportRegistry = () => {
    if (allFiles.length === 0) return;
    const headers = ['File Number', 'Owner Name', 'Father Name', 'CNIC', 'Cell No', 'Plot Size', 'Plot', 'Block', 'Park', 'Corner', 'MB', 'Total Value', 'Paid', 'Balance', 'Reg Date', 'Address'];
    const rows = allFiles.map(f => [`"${f.fileNo}"`, `"${f.ownerName}"`, `"${f.fatherName}"`, `"${f.ownerCNIC}"`, `"${f.cellNo}"`, `"${f.plotSize}"`, `"${f.plotNo}"`, `"${f.block}"`, `"${f.park}"`, `"${f.corner}"`, `"${f.mainBoulevard}"`, f.plotValue, f.paymentReceived, f.balance, `"${f.regDate}"`, `"${f.address.replace(/\n/g, ' ')}"`]);
    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `DIN_Property_Registry_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const startEditLedger = (file: PropertyFile) => {
    setEditingFile(file);
    setTempTransactions([...file.transactions].sort((a, b) => a.seq - b.seq));
  };

  const updateTempTrans = (index: number, field: keyof Transaction, value: any) => {
    const updated = [...tempTransactions];
    const trans = { ...updated[index], [field]: value };
    if (field === 'receivable' || field === 'amount_paid') {
      trans.balduedeb = Math.max(0, (Number(trans.receivable) || 0) - (Number(trans.amount_paid) || 0));
    }
    updated[index] = trans;
    setTempTransactions(updated);
  };

  const addTempTrans = () => {
    const newTrans: Transaction = {
      seq: tempTransactions.length + 1,
      transid: Date.now(),
      line_id: 0,
      shortname: '',
      duedate: new Date().toLocaleDateString('en-GB').replace(/\//g, '-'),
      receivable: 0,
      u_intno: tempTransactions.length + 1,
      u_intname: 'INSTALLMENT',
      transtype: '13',
      itemcode: editingFile?.fileNo || '',
      plottype: 'Residential',
      currency: 'PKR',
      description: '',
      doctotal: editingFile?.plotValue || 0,
      status: 'Unpaid',
      balance: 0,
      balduedeb: 0,
      paysrc: null,
      amount_paid: 0,
      receipt_date: '',
      mode: 'Cash',
      surcharge: 0
    };
    setTempTransactions([...tempTransactions, newTrans]);
  };

  const deleteTempTrans = (index: number) => {
    setTempTransactions(tempTransactions.filter(((_, i) => i !== index)));
  };

  const saveLedger = () => {
    if (!editingFile) return;
    const updatedFiles = allFiles.map(f => {
      if (f.fileNo === editingFile.fileNo) {
        const sortedTrans = [...tempTransactions].sort((a, b) => a.seq - b.seq);
        const received = sortedTrans.reduce((sum, t) => sum + (Number(t.amount_paid) || 0), 0);
        const totalOS = sortedTrans.reduce((sum, t) => sum + (Number(t.balduedeb) || 0), 0);
        return { ...f, transactions: sortedTrans, paymentReceived: received, balance: totalOS };
      }
      return f;
    });
    setAllFiles(updatedFiles);
    setEditingFile(null);
  };

  const filteredInventory = allFiles.filter(f => 
    f.fileNo.toLowerCase().includes(searchTerm.toLowerCase()) || 
    f.ownerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.ownerCNIC.includes(searchTerm)
  );

  return (
    <div className="space-y-6 sm:space-y-10 animate-in fade-in duration-700 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight uppercase">Registry</h1>
            {isLocalDataPinned && <span className="px-2 py-0.5 bg-indigo-100 text-indigo-600 rounded text-[8px] font-black uppercase tracking-widest border border-indigo-200">Imported</span>}
          </div>
          <p className="text-slate-500 font-medium uppercase tracking-widest text-[10px]">Identity &rarr; Financials &rarr; Location Flow</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleExportRegistry} className="hidden sm:flex items-center gap-2 px-6 py-4 bg-white border border-slate-200 text-slate-600 rounded-2xl text-[11px] font-black uppercase hover:bg-slate-50 transition-all shadow-sm">
            <FileSpreadsheet size={18} /> Export CSV
          </button>
          <button onClick={() => setIsCreatingFile(true)} className="bg-slate-900 text-white hover:bg-black px-8 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl flex items-center justify-center gap-3 active:scale-95">
            <FilePlus size={18} /> Enrollment
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] sm:rounded-[3.5rem] shadow-2xl border border-slate-200 overflow-hidden">
        <div className="p-6 sm:p-10 border-b flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="relative w-full max-w-xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input type="text" placeholder="Search Identity (Name/CNIC) or File ID..." className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-slate-900/5 transition-all" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          </div>
        </div>
        
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-[10px] uppercase font-black text-slate-400 tracking-widest border-b">
                <th className="px-8 py-6">Identity Info</th>
                <th className="px-8 py-6">Financial Status</th>
                <th className="px-8 py-6">Location</th>
                <th className="px-8 py-6 text-right">Operations</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredInventory.map((f) => (
                <tr key={f.fileNo} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-8 py-8">
                    <div className="font-black text-slate-900 text-sm uppercase">{f.ownerName}</div>
                    <div className="text-[10px] text-emerald-600 font-black uppercase tracking-widest mt-1">ID: {f.fileNo}</div>
                    <div className="text-[10px] text-slate-400 font-bold mt-1">CNIC: {f.ownerCNIC}</div>
                  </td>
                  <td className="px-8 py-8">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-[10px] font-black uppercase">
                        <span className="text-slate-400">Value:</span> 
                        <span className="text-slate-900">{formatCurrency(f.plotValue)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] font-black uppercase">
                        <span className="text-slate-400">Paid:</span> 
                        <span className="text-emerald-600">{formatCurrency(f.paymentReceived)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] font-black uppercase">
                        <span className="text-slate-400">O/S:</span> 
                        <span className="text-rose-600">{formatCurrency(f.balance)}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-8">
                    <div className="text-[10px] font-black uppercase text-slate-600 leading-relaxed">
                      {f.plotNo !== '-' ? `Plot: ${f.plotNo}` : ''} {f.block !== '-' ? `Block: ${f.block}` : ''}<br/>
                      {f.plotSize}
                    </div>
                  </td>
                  <td className="px-8 py-8 text-right flex justify-end gap-2">
                    <button onClick={() => startEditLedger(f)} className="p-2.5 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all"><Edit size={16} /></button>
                    <button onClick={() => onPreviewStatement?.(f)} className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-600 hover:text-white transition-all"><Eye size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Editing Modal Content (Keep existing functionality but standardizing mapping) */}
      {editingFile && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/90 backdrop-blur-md overflow-hidden lg:p-4">
          <div className="bg-white lg:rounded-[3rem] w-full max-w-6xl h-full lg:h-[90vh] shadow-2xl flex flex-col border border-white/20">
            <div className="p-6 sm:p-8 border-b bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="w-14 h-14 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-xl shadow-blue-600/20"><Building size={24} /></div>
                <div>
                  <h2 className="text-2xl font-black text-slate-900 uppercase">Editor: {editingFile.fileNo}</h2>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Translation Layer Active</p>
                </div>
              </div>
              <button onClick={() => setEditingFile(null)} className="p-3 bg-white border border-slate-200 text-slate-400 rounded-2xl hover:text-red-500 transition-all"><X size={32} /></button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-[9px] uppercase font-black text-slate-400 tracking-widest border-b">
                    <th className="pb-4 px-2">Due Date</th>
                    <th className="pb-4 px-2">Int Type</th>
                    <th className="pb-4 px-2">Receivable</th>
                    <th className="pb-4 px-2">Paid</th>
                    <th className="pb-4 px-2">Instrument No</th>
                    <th className="pb-4 px-2 text-right">Ops</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {tempTransactions.map((t, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                      <td className="py-4 px-2">
                        <input type="text" value={t.duedate} onChange={(e) => updateTempTrans(idx, 'duedate', e.target.value)} className="w-28 bg-transparent border-b border-transparent focus:border-blue-500 outline-none text-xs font-bold" />
                      </td>
                      <td className="py-4 px-2">
                        <input type="text" value={t.u_intname} onChange={(e) => updateTempTrans(idx, 'u_intname', e.target.value)} className="w-32 bg-transparent border-b border-transparent focus:border-blue-500 outline-none text-xs font-black uppercase" />
                      </td>
                      <td className="py-4 px-2">
                        <input type="number" value={t.receivable || 0} onChange={(e) => updateTempTrans(idx, 'receivable', parseInt(e.target.value))} className="w-24 bg-transparent border-b border-transparent focus:border-blue-500 outline-none text-xs font-black text-blue-600" />
                      </td>
                      <td className="py-4 px-2">
                        <input type="number" value={t.amount_paid || 0} onChange={(e) => updateTempTrans(idx, 'amount_paid', parseInt(e.target.value))} className="w-24 bg-transparent border-b border-transparent focus:border-blue-500 outline-none text-xs font-black text-emerald-600" />
                      </td>
                      <td className="py-4 px-2">
                        <input type="text" value={t.instrument_no || ''} onChange={(e) => updateTempTrans(idx, 'instrument_no', e.target.value)} className="w-32 bg-transparent border-b border-transparent focus:border-blue-500 outline-none text-xs font-bold" />
                      </td>
                      <td className="py-4 px-2 text-right">
                        <button onClick={() => deleteTempTrans(idx)} className="p-2 text-slate-300 hover:text-red-500 transition-all"><Trash2 size={16} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-8 border-t bg-slate-50 flex items-center justify-between">
              <button onClick={addTempTrans} className="px-6 py-4 bg-slate-200 text-slate-700 rounded-2xl text-[10px] font-black uppercase hover:bg-slate-300 transition-all flex items-center gap-2"><Plus size={16} /> Add Ledger Entry</button>
              <button onClick={saveLedger} className="px-12 py-5 bg-emerald-600 text-white rounded-3xl font-black text-[11px] uppercase tracking-widest shadow-xl flex items-center gap-4 transition-all active:scale-95"><Save size={18} /> Commit Ledger Update</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PropertyPortal;
