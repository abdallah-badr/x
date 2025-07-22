import React, { useState, useCallback, useEffect } from 'react';
import { Plus, ArrowLeft, FileText } from 'lucide-react';
import { InvoiceData, InvoiceItem } from './types/Invoice';
import { InvoiceHeader } from './components/InvoiceHeader';
import { ItemsTable } from './components/ItemsTable';
import { InvoiceActions } from './components/InvoiceActions';
import { InvoicePreview } from './components/InvoicePreview';
import { InvoicesList } from './components/InvoicesList';
import {
  generateInvoiceNumber,
  calculateInvoiceTotal,
  createNewItem,
  saveInvoiceToStorage,
  getInvoicesFromStorage,
  deleteInvoiceFromStorage,
} from './utils/invoiceUtils';
import { exportToPDF, exportToPNG, exportInvoiceData } from './utils/exportUtils';

type AppMode = 'create' | 'edit' | 'preview' | 'list';

function App() {
  const [mode, setMode] = useState<AppMode>('list');
  const [currentInvoice, setCurrentInvoice] = useState<InvoiceData>(() => createNewInvoice());
  const [savedInvoices, setSavedInvoices] = useState<InvoiceData[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  function createNewInvoice(): InvoiceData {
    return {
      id: crypto.randomUUID(),
      invoiceNumber: generateInvoiceNumber(),
      customerName: '',
      primaryPhone: '',
      secondaryPhone: '',
      address: '',
      shippingCost: 0,
      notes: '',
      items: [createNewItem()],
      totalAmount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  useEffect(() => {
    setSavedInvoices(getInvoicesFromStorage());
  }, []);

  useEffect(() => {
    const total = calculateInvoiceTotal(currentInvoice.items, currentInvoice.shippingCost);
    setCurrentInvoice(prev => ({ ...prev, totalAmount: total }));
  }, [currentInvoice.items, currentInvoice.shippingCost]);

  const handleInvoiceChange = useCallback((updates: Partial<InvoiceData>) => {
    setCurrentInvoice(prev => ({
      ...prev,
      ...updates,
      updatedAt: new Date(),
    }));
  }, []);

  const handleItemsChange = useCallback((items: InvoiceItem[]) => {
    handleInvoiceChange({ items });
  }, [handleInvoiceChange]);

  const handleSave = useCallback(async () => {
    if (!currentInvoice.customerName.trim()) {
      alert('يرجى إدخال اسم العميل');
      return;
    }
    if (!currentInvoice.primaryPhone.trim()) {
      alert('يرجى إدخال رقم الهاتف الأساسي');
      return;
    }
    if (!currentInvoice.address.trim()) {
      alert('يرجى إدخال العنوان');
      return;
    }
    if (currentInvoice.items.length === 0) {
      alert('يرجى إضافة صنف واحد على الأقل');
      return;
    }

    setIsSaving(true);
    try {
      saveInvoiceToStorage(currentInvoice);
      setSavedInvoices(getInvoicesFromStorage());
      alert('تم حفظ الفاتورة بنجاح');
    } catch (error) {
      alert('حدث خطأ أثناء حفظ الفاتورة');
    } finally {
      setIsSaving(false);
    }
  }, [currentInvoice]);

  const handleExportPDF = useCallback(() => {
    exportToPDF(currentInvoice, 'invoice-preview');
  }, [currentInvoice]);

  const handleExportPNG = useCallback(() => {
    exportToPNG(currentInvoice, 'invoice-preview');
  }, [currentInvoice]);

  const handleExportData = useCallback(() => {
    exportInvoiceData(currentInvoice);
  }, [currentInvoice]);

  const handleLoadData = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        const loadedInvoice: InvoiceData = {
          ...data,
          id: crypto.randomUUID(),
          invoiceNumber: generateInvoiceNumber(),
          createdAt: new Date(data.createdAt),
          updatedAt: new Date(),
        };
        setCurrentInvoice(loadedInvoice);
        setMode('edit');
        alert('تم تحميل الفاتورة بنجاح');
      } catch (error) {
        alert('خطأ في قراءة الملف');
      }
    };
    reader.readAsText(file);
  }, []);

  const handleNewInvoice = useCallback(() => {
    setCurrentInvoice(createNewInvoice());
    setMode('create');
  }, []);

  const handleEditInvoice = useCallback((invoice: InvoiceData) => {
    setCurrentInvoice(invoice);
    setMode('edit');
  }, []);

  const handleViewInvoice = useCallback((invoice: InvoiceData) => {
    setCurrentInvoice(invoice);
    setMode('preview');
  }, []);

  const handleDeleteInvoice = useCallback((invoiceId: string) => {
    deleteInvoiceFromStorage(invoiceId);
    setSavedInvoices(getInvoicesFromStorage());
  }, []);

  const handlePreview = useCallback(() => {
    setMode('preview');
  }, []);

  const handleBackToList = useCallback(() => {
    setMode('list');
  }, []);

  const handleBackToEdit = useCallback(() => {
    setMode('edit');
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 font-body" dir="rtl">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Header */}
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-primary-800 font-display">
              نظام إدارة الفواتير
            </h1>
            <p className="text-gray-600 mt-1 font-body">
              {mode === 'list' && 'إدارة وتنظيم الفواتير'}
              {mode === 'create' && 'إنشاء فاتورة جديدة'}
              {mode === 'edit' && 'تعديل الفاتورة'}
              {mode === 'preview' && 'معاينة الفاتورة'}
            </p>
          </div>
          
          <div className="flex gap-3">
            {mode !== 'list' && (
              <button
                onClick={handleBackToList}
                className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-body"
              >
                <ArrowLeft className="w-4 h-4" />
                العودة للقائمة
              </button>
            )}
            
            {mode === 'list' && (
              <button
                onClick={handleNewInvoice}
                className="flex items-center gap-2 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-body"
              >
                <Plus className="w-5 h-5" />
                فاتورة جديدة
              </button>
            )}
            
            {mode === 'preview' && (
              <button
                onClick={handleBackToEdit}
                className="flex items-center gap-2 px-4 py-2 bg-success-600 text-white rounded-lg hover:bg-success-700 transition-colors font-body"
              >
                <FileText className="w-4 h-4" />
                تعديل
              </button>
            )}
          </div>
        </header>

        {/* Content */}
        <div className="space-y-6">
          {mode === 'list' && (
            <InvoicesList
              invoices={savedInvoices}
              onEdit={handleEditInvoice}
              onView={handleViewInvoice}
              onDelete={handleDeleteInvoice}
            />
          )}

          {(mode === 'create' || mode === 'edit') && (
            <>
              <InvoiceHeader
                invoice={currentInvoice}
                onInvoiceChange={handleInvoiceChange}
                isEditing={true}
              />
              
              <ItemsTable
                items={currentInvoice.items}
                onItemsChange={handleItemsChange}
                isEditing={true}
              />
              
              <InvoiceActions
                invoice={currentInvoice}
                onSave={handleSave}
                onExportPDF={handleExportPDF}
                onExportPNG={handleExportPNG}
                onExportData={handleExportData}
                onLoadData={handleLoadData}
                onPreview={handlePreview}
                isSaving={isSaving}
              />
              
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-center text-lg font-body">
                  <span className="text-gray-700">الإجمالي النهائي:</span>
                  <span className="text-2xl font-bold text-primary-700 font-mono">
                    {currentInvoice.totalAmount.toFixed(2)} ج.م
                  </span>
                </div>
              </div>
            </>
          )}

          {mode === 'preview' && (
            <div className="space-y-6">
              <InvoiceActions
                invoice={currentInvoice}
                onSave={handleSave}
                onExportPDF={handleExportPDF}
                onExportPNG={handleExportPNG}
                onExportData={handleExportData}
                onLoadData={handleLoadData}
                onPreview={handlePreview}
                isSaving={isSaving}
              />
              
              <div className="bg-gray-50 p-6 rounded-lg">
                <InvoicePreview invoice={currentInvoice} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;