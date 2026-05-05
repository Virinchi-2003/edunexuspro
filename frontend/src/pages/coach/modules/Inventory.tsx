import React, { useState, useEffect } from 'react';
import { 
  Package, 
  ShoppingCart, 
  AlertTriangle, 
  Loader2, 
  Plus,
  ArrowRightLeft,
  PenTool,
  History,
  Trash2,
  CheckCircle2,
  Clock,
  ClipboardList
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter
} from '@/components/ui/dialog';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { toast } from 'sonner';

const CoachInventory: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [inventoryList, setInventoryList] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isRequisitionModalOpen, setIsRequisitionModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    itemName: '',
    category: '',
    totalQuantity: 0,
    lowStockAlert: 5
  });

  const [requisitionData, setRequisitionData] = useState({
    itemName: '',
    quantity: 1,
    priority: 'medium',
    reason: ''
  });

  const [checkoutData, setCheckoutData] = useState({
    studentId: '',
    quantity: 1,
    signature: ''
  });

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/coach/inventory/${user.schoolId}`);
      setInventoryList(res.data.data);
    } catch (error) {
      toast.error('Failed to load inventory');
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async () => {
    try {
      const res = await api.get(`/coach/inventory-transactions/${user.schoolId}`);
      setTransactions(res.data.data);
    } catch (error) {
      console.error('Failed to load transactions');
    }
  };

  const fetchStudents = async () => {
    try {
      const res = await api.get(`/coach/school-students/${user.schoolId}`);
      setStudents(res.data.data);
    } catch (error) {
      console.error('Failed to load students');
    }
  };

  useEffect(() => {
    fetchInventory();
    fetchTransactions();
    fetchStudents();
  }, []);

  const handleAddEquipment = async () => {
    if (!formData.itemName || formData.totalQuantity <= 0) return toast.error('Please fill all fields correctly');
    try {
      setSaving(true);
      await api.post('/coach/inventory', { ...formData, schoolId: user.schoolId });
      toast.success('Equipment added to inventory');
      setIsAddModalOpen(false);
      setFormData({ itemName: '', category: '', totalQuantity: 0, lowStockAlert: 5 });
      fetchInventory();
    } catch (error) {
      toast.error('Failed to add equipment');
    } finally {
      setSaving(false);
    }
  };

  const handleRaiseRequisition = async () => {
    if (!requisitionData.itemName || requisitionData.quantity <= 0) return toast.error('Please fill all fields');
    try {
      setSaving(true);
      await api.post('/coach/requisitions', { ...requisitionData, schoolId: user.schoolId });
      toast.success('Requisition raised and sent for approval');
      setIsRequisitionModalOpen(false);
      setRequisitionData({ itemName: '', quantity: 1, priority: 'medium', reason: '' });
    } catch (error) {
      toast.error('Failed to raise requisition');
    } finally {
      setSaving(false);
    }
  };

  const handleCheckout = async () => {
    if (!checkoutData.studentId || checkoutData.quantity <= 0) return toast.error('Please select student and quantity');
    try {
      setSaving(true);
      await api.post('/coach/inventory/checkout', {
        ...checkoutData,
        inventoryId: selectedItem.id,
        signature: 'SIG_' + Math.random().toString(36).substr(2, 9)
      });
      toast.success('Equipment checked out successfully');
      setIsCheckoutModalOpen(false);
      fetchInventory();
      fetchTransactions();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Checkout failed');
    } finally {
      setSaving(false);
    }
  };

  const handleCheckin = async (transactionId: string) => {
    try {
      await api.post('/coach/inventory/checkin', { transactionId, status: 'returned' });
      toast.success('Equipment returned');
      fetchInventory();
      fetchTransactions();
    } catch (error) {
      toast.error('Check-in failed');
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm('Are you sure you want to remove this item?')) return;
    try {
      await api.delete(`/coach/inventory/${id}`);
      toast.success('Item removed');
      fetchInventory();
    } catch (error) {
      toast.error('Failed to delete item');
    }
  };

  const lowStockItems = inventoryList.filter(i => i.availableQuantity < i.lowStockAlert);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
         <div>
            <h2 className="text-4xl font-display font-bold text-slate-900 tracking-tight">Inventory & Kit Tracking</h2>
            <p className="text-slate-500 font-medium mt-1">Real-time management of sports gear and institutional equipment</p>
         </div>
         <div className="flex gap-4 w-full md:w-auto">
            <Button 
              variant="outline" 
              className="rounded-2xl h-14 px-6 border-slate-200 bg-white font-bold gap-2 flex-1 md:flex-none shadow-sm hover:shadow-md transition-all"
              onClick={() => setIsHistoryModalOpen(true)}
            >
               <History className="w-5 h-5 text-indigo-600" /> Transaction History
            </Button>
            <Button 
              className="rounded-2xl h-14 bg-slate-900 text-white font-bold px-8 shadow-xl shadow-slate-200 gap-2 flex-1 md:flex-none hover:scale-[1.02] transition-transform"
              onClick={() => setIsAddModalOpen(true)}
            >
               <Plus className="w-5 h-5" /> Add Equipment
            </Button>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         <div className="lg:col-span-2 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               {loading && inventoryList.length === 0 ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <Card key={i} className="animate-pulse bg-slate-50 border-none h-64 rounded-[2.5rem]" />
                  ))
               ) : inventoryList.length === 0 ? (
                 <div className="col-span-full py-32 text-center bg-white rounded-[3rem] shadow-sm border-2 border-dashed border-slate-100">
                    <div className="w-24 h-24 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-6 text-slate-200">
                      <Package className="w-12 h-12" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900">No Inventory Found</h3>
                    <p className="text-slate-400 mt-2 font-medium">Add your first equipment to start tracking</p>
                    <Button 
                      variant="ghost" 
                      className="mt-6 text-indigo-600 font-bold gap-2 hover:bg-indigo-50 rounded-xl"
                      onClick={() => setIsAddModalOpen(true)}
                    >
                      <Plus className="w-4 h-4" /> Initialize Inventory
                    </Button>
                 </div>
               ) : (
                 inventoryList.map((item) => (
                  <Card key={item.id} className="border-none shadow-xl rounded-[2.5rem] bg-white overflow-hidden group hover:shadow-2xl transition-all duration-500">
                     <CardContent className="p-10">
                        <div className="flex justify-between items-start mb-8">
                           <div className="p-4 rounded-2xl bg-slate-50 text-slate-500 group-hover:bg-indigo-600 group-hover:text-white group-hover:scale-110 transition-all duration-500">
                              <Package className="w-7 h-7" />
                           </div>
                           <div className="flex gap-2">
                             <Badge className={`px-4 py-1.5 rounded-full font-bold uppercase text-[9px] tracking-widest border-none shadow-sm ${
                                item.availableQuantity < item.lowStockAlert ? 'bg-rose-500 text-white' : 'bg-emerald-500 text-white'
                             }`}>
                                {item.availableQuantity < item.lowStockAlert ? 'Low Stock' : 'In Stock'}
                             </Badge>
                             <Button 
                               variant="ghost" 
                               size="icon" 
                               className="h-8 w-8 rounded-full text-slate-200 hover:text-rose-500 hover:bg-rose-50"
                               onClick={() => handleDeleteItem(item.id)}
                              >
                               <Trash2 className="w-4 h-4" />
                             </Button>
                           </div>
                        </div>
                        
                        <h4 className="text-2xl font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{item.itemName}</h4>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-2">{item.category}</p>
                        
                        <div className="mt-10 space-y-4">
                           <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                              <span className="text-slate-400">Available: {item.availableQuantity} / {item.totalQuantity}</span>
                              <span className="text-indigo-600">{Math.round((item.availableQuantity / item.totalQuantity) * 100)}%</span>
                           </div>
                           <div className="h-2.5 bg-slate-50 rounded-full overflow-hidden">
                             <div 
                               className={`h-full transition-all duration-1000 ${item.availableQuantity < item.lowStockAlert ? 'bg-rose-500' : 'bg-indigo-600'}`} 
                               style={{ width: `${(item.availableQuantity / item.totalQuantity) * 100}%` }}
                             />
                           </div>
                        </div>

                        <div className="mt-10 pt-8 border-t border-slate-50 flex items-center justify-between">
                           <Button 
                             className="rounded-2xl h-14 px-8 bg-indigo-50 text-indigo-600 font-bold hover:bg-indigo-600 hover:text-white shadow-none hover:shadow-xl hover:shadow-indigo-100 transition-all duration-500 border-none group/btn"
                             onClick={() => {
                               setSelectedItem(item);
                               setCheckoutData({ ...checkoutData, quantity: 1 });
                               setIsCheckoutModalOpen(true);
                             }}
                            >
                              <ArrowRightLeft className="w-4 h-4 mr-2 group-hover/btn:rotate-180 transition-transform duration-500" /> Checkout Gear
                           </Button>
                           <Badge variant="outline" className="h-10 px-4 rounded-xl border-slate-100 text-slate-400 bg-slate-50 font-mono">
                             ID-{item.id.split('-')[0].toUpperCase()}
                           </Badge>
                        </div>
                     </CardContent>
                  </Card>
                ))
               )}
            </div>
         </div>

         <div className="space-y-8">
            <Card className="border-none shadow-2xl rounded-[3rem] bg-slate-900 text-white p-10 overflow-hidden relative">
               <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full -mr-32 -mt-32 blur-[100px]" />
               <div className="relative z-10">
                  <div className="w-16 h-16 rounded-3xl bg-white/10 flex items-center justify-center mb-8">
                    <PenTool className="w-8 h-8 text-indigo-400" />
                  </div>
                  <h4 className="text-3xl font-display font-bold mb-4 tracking-tight">Quick Check-in</h4>
                  <p className="text-slate-400 font-medium leading-relaxed mb-10 text-sm">
                     Streamlined gear returns. Capture student digital signatures for audit-ready records.
                  </p>
                  <div className="space-y-4">
                     <Button 
                        className="w-full rounded-[1.5rem] h-16 bg-white text-slate-900 font-bold shadow-2xl shadow-indigo-500/20 hover:scale-[1.02] transition-transform text-lg"
                        onClick={() => setIsHistoryModalOpen(true)}
                     >
                        <History className="w-5 h-5 mr-3" /> View Active Loans
                     </Button>
                     <Button 
                       variant="ghost" 
                       className="w-full rounded-[1.5rem] h-14 text-slate-400 font-bold hover:bg-white/5 hover:text-white"
                       onClick={() => setIsRequisitionModalOpen(true)}
                      >
                        <ClipboardList className="w-5 h-5 mr-3" /> Raise Requisition
                     </Button>
                  </div>
               </div>
            </Card>

            <Card className="border-none shadow-xl rounded-[3rem] bg-rose-50 p-10 border border-rose-100 relative overflow-hidden">
               <div className="absolute top-0 right-0 p-10 opacity-10">
                  <AlertTriangle className="w-24 h-24 text-rose-900" />
               </div>
               <div className="flex items-center gap-5 mb-10">
                  <div className="w-14 h-14 rounded-2xl bg-rose-500 text-white flex items-center justify-center shadow-xl shadow-rose-200">
                     <AlertTriangle className="w-7 h-7" />
                  </div>
                  <div>
                     <h4 className="text-xl font-bold text-slate-900">Low Stock Alerts</h4>
                     <p className="text-[10px] font-bold text-rose-500 uppercase tracking-[0.2em] mt-1">Action Required</p>
                  </div>
               </div>
               
               <div className="space-y-4">
                  {lowStockItems.map((item) => (
                    <div key={item.id} className="p-5 bg-white rounded-3xl border border-rose-100 flex items-center justify-between shadow-sm group hover:shadow-md transition-all">
                       <div>
                          <div className="text-sm font-bold text-slate-900">{item.itemName}</div>
                          <div className="text-[10px] text-rose-600 font-black uppercase tracking-widest mt-1">Level: {item.availableQuantity} units</div>
                       </div>
                       <Button 
                         size="icon" 
                         variant="ghost" 
                         className="h-10 w-10 rounded-full text-rose-400 hover:bg-rose-50 hover:text-rose-600"
                         onClick={() => {
                           setRequisitionData({...requisitionData, itemName: item.itemName});
                           setIsRequisitionModalOpen(true);
                         }}
                       >
                          <Plus className="w-5 h-5" />
                       </Button>
                    </div>
                  ))}
                  {lowStockItems.length === 0 && (
                    <div className="text-center py-8 flex flex-col items-center">
                       <CheckCircle2 className="w-10 h-10 text-emerald-300 mb-3" />
                       <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Inventory Levels Healthy</p>
                    </div>
                  )}
               </div>

               <Button 
                 className="w-full mt-10 rounded-[1.5rem] bg-rose-500 hover:bg-rose-600 text-white font-bold h-16 shadow-xl shadow-rose-200 text-lg transition-all hover:scale-[1.02]"
                 onClick={() => setIsRequisitionModalOpen(true)}
               >
                  <ShoppingCart className="w-5 h-5 mr-3" /> Raise Requisition
               </Button>
            </Card>
         </div>
      </div>

      {/* Add Equipment Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-[480px] rounded-[3rem] p-12 border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-3xl font-display font-bold text-slate-900">Add New Equipment</DialogTitle>
            <DialogDescription className="font-medium text-slate-500 mt-2">Initialize new sports gear in the institutional inventory.</DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-10">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Equipment Name</label>
              <Input 
                placeholder="e.g. Cricket Bats (Grade A)" 
                className="rounded-2xl h-14 bg-slate-50 border-none px-6 font-bold text-lg"
                value={formData.itemName}
                onChange={(e) => setFormData({...formData, itemName: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Category</label>
                <Input 
                  placeholder="e.g. Cricket" 
                  className="rounded-2xl h-14 bg-slate-50 border-none px-6 font-bold"
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Total Quantity</label>
                <Input 
                  type="number" 
                  className="rounded-2xl h-14 bg-slate-50 border-none px-6 font-bold"
                  value={formData.totalQuantity}
                  onChange={(e) => setFormData({...formData, totalQuantity: parseInt(e.target.value)})}
                />
              </div>
            </div>
            <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Low Stock Alert Level</label>
                <Input 
                  type="number" 
                  className="rounded-2xl h-14 bg-slate-50 border-none px-6 font-bold"
                  value={formData.lowStockAlert}
                  onChange={(e) => setFormData({...formData, lowStockAlert: parseInt(e.target.value)})}
                />
              </div>
          </div>

          <DialogFooter>
            <Button 
              className="w-full h-16 rounded-[1.5rem] bg-slate-900 hover:bg-slate-800 text-white font-bold text-xl shadow-2xl shadow-slate-200"
              onClick={handleAddEquipment}
              disabled={saving}
            >
              {saving ? <Loader2 className="w-6 h-6 animate-spin" /> : <Package className="w-6 h-6 mr-3" />}
              Launch Inventory
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Raise Requisition Modal */}
      <Dialog open={isRequisitionModalOpen} onOpenChange={setIsRequisitionModalOpen}>
        <DialogContent className="sm:max-w-[480px] rounded-[3rem] p-12 border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-3xl font-display font-bold text-slate-900">Raise Requisition</DialogTitle>
            <DialogDescription className="font-medium text-slate-500 mt-2">Formal request for new equipment procurement.</DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-10">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Item Name</label>
              <Input 
                placeholder="e.g. Football Kits" 
                className="rounded-2xl h-14 bg-slate-50 border-none px-6 font-bold text-lg"
                value={requisitionData.itemName}
                onChange={(e) => setRequisitionData({...requisitionData, itemName: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Quantity</label>
                <Input 
                  type="number" 
                  className="rounded-2xl h-14 bg-slate-50 border-none px-6 font-bold"
                  value={requisitionData.quantity}
                  onChange={(e) => setRequisitionData({...requisitionData, quantity: parseInt(e.target.value)})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Priority</label>
                <select 
                  className="w-full h-14 rounded-2xl bg-slate-50 border-none px-6 font-bold text-slate-900 appearance-none focus:ring-2 focus:ring-indigo-100"
                  value={requisitionData.priority}
                  onChange={(e) => setRequisitionData({...requisitionData, priority: e.target.value})}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Reason for Requisition</label>
              <textarea 
                className="w-full min-h-[100px] rounded-2xl bg-slate-50 border-none p-6 text-sm font-medium focus:ring-2 focus:ring-indigo-100 resize-none"
                placeholder="Explain why this procurement is necessary..."
                value={requisitionData.reason}
                onChange={(e) => setRequisitionData({...requisitionData, reason: e.target.value})}
              />
            </div>
          </div>

          <DialogFooter>
            <Button 
              className="w-full h-16 rounded-[1.5rem] bg-rose-500 hover:bg-rose-600 text-white font-bold text-xl shadow-2xl shadow-rose-100"
              onClick={handleRaiseRequisition}
              disabled={saving}
            >
              {saving ? <Loader2 className="w-6 h-6 animate-spin" /> : <ShoppingCart className="w-6 h-6 mr-3" />}
              Send Requisition
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Checkout Modal */}
      <Dialog open={isCheckoutModalOpen} onOpenChange={setIsCheckoutModalOpen}>
        <DialogContent className="sm:max-w-[480px] rounded-[3rem] p-12 border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-3xl font-display font-bold text-slate-900">Equipment Checkout</DialogTitle>
            <DialogDescription className="font-medium text-slate-500 mt-2">Assign {selectedItem?.itemName} to an athlete.</DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-10">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Select Student</label>
              <select 
                className="w-full h-14 rounded-2xl bg-slate-50 border-none px-6 font-bold text-slate-900 appearance-none focus:ring-2 focus:ring-indigo-100"
                value={checkoutData.studentId}
                onChange={(e) => setCheckoutData({...checkoutData, studentId: e.target.value})}
              >
                <option value="">Select an athlete...</option>
                {students.map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({s.studentId})</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Quantity</label>
              <Input 
                type="number" 
                max={selectedItem?.availableQuantity}
                min={1}
                className="rounded-2xl h-14 bg-slate-50 border-none px-6 font-bold text-lg"
                value={checkoutData.quantity}
                onChange={(e) => setCheckoutData({...checkoutData, quantity: parseInt(e.target.value)})}
              />
            </div>
            <div className="p-6 rounded-3xl bg-indigo-50 border border-indigo-100">
               <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest mb-4">Institutional Audit Agreement</p>
               <p className="text-[11px] text-indigo-900/60 leading-relaxed font-medium">
                 By clicking confirm, you authorize the checkout. Students are liable for damages or loss, with automated fines integrated into their fee structure.
               </p>
            </div>
          </div>

          <DialogFooter>
            <Button 
              className="w-full h-16 rounded-[1.5rem] bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xl shadow-2xl shadow-indigo-100"
              onClick={handleCheckout}
              disabled={saving}
            >
              {saving ? <Loader2 className="w-6 h-6 animate-spin" /> : <ArrowRightLeft className="w-6 h-6 mr-3" />}
              Authorize Checkout
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Transaction History Modal */}
      <Dialog open={isHistoryModalOpen} onOpenChange={setIsHistoryModalOpen}>
        <DialogContent className="sm:max-w-[700px] rounded-[3rem] p-12 border-none shadow-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-3xl font-display font-bold text-slate-900">Transaction History</DialogTitle>
            <DialogDescription className="font-medium text-slate-500 mt-2">Audit trail for all institutional sports equipment.</DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-10">
             {transactions.length === 0 ? (
               <div className="text-center py-20 text-slate-400">
                  <History className="w-12 h-12 mx-auto mb-4 opacity-20" />
                  <p className="font-bold uppercase text-[10px] tracking-widest">No transaction history found</p>
               </div>
             ) : (
               transactions.map((t) => (
                 <div key={t.id} className="p-6 rounded-3xl bg-slate-50 border border-slate-100 flex items-center justify-between group hover:bg-white hover:shadow-xl transition-all duration-500">
                    <div className="flex items-center gap-6">
                       <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm ${
                          t.status === 'active' ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'
                       }`}>
                          {t.status === 'active' ? <Clock className="w-6 h-6" /> : <CheckCircle2 className="w-6 h-6" />}
                       </div>
                       <div>
                          <h5 className="font-bold text-slate-900">{t.inventoryItem?.itemName}</h5>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                             {t.student?.name} • Qty: {t.quantity} • {new Date(t.transactionDate).toLocaleDateString()}
                          </p>
                       </div>
                    </div>
                    {t.status === 'active' ? (
                       <Button 
                         variant="outline" 
                         className="rounded-2xl h-12 px-6 border-slate-200 text-slate-900 font-bold hover:bg-slate-900 hover:text-white transition-all"
                         onClick={() => handleCheckin(t.id)}
                        >
                         Check-in
                       </Button>
                    ) : (
                       <Badge className="bg-emerald-50 text-emerald-600 border-none font-bold px-4 py-2 rounded-xl">
                          Returned
                       </Badge>
                    )}
                 </div>
               ))
             )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CoachInventory;
