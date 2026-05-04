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
  Info
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { toast } from 'sonner';

const CoachInventory: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [inventoryList, setInventoryList] = useState<any[]>([]);

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

  useEffect(() => {
    fetchInventory();
  }, []);

  if (loading && inventoryList.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="w-12 h-12 animate-spin text-amber-600" />
        <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">Scanning Equipment Shed...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
         <div>
            <h2 className="text-2xl font-display font-bold text-slate-900">Inventory & Kit Tracking</h2>
            <p className="text-sm text-slate-500 font-medium">Real-time management of sports gear and institutional equipment</p>
         </div>
         <div className="flex gap-3">
            <Button variant="outline" className="rounded-2xl h-12 border-slate-200 font-bold gap-2">
               <History className="w-4 h-4" /> Transaction History
            </Button>
            <Button className="rounded-2xl h-12 bg-slate-900 text-white font-bold px-6 shadow-xl shadow-slate-200 gap-2">
               <Plus className="w-4 h-4" /> Add Equipment
            </Button>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         {/* Main Inventory List */}
         <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               {inventoryList.map((item) => (
                 <Card key={item.id} className="border-none shadow-xl rounded-[2.5rem] bg-white overflow-hidden group hover:shadow-2xl transition-all duration-500">
                    <CardContent className="p-8">
                       <div className="flex justify-between items-start mb-6">
                          <div className={`p-3 rounded-2xl bg-slate-50 text-slate-500 group-hover:bg-indigo-600 group-hover:text-white transition-all`}>
                             <Package className="w-6 h-6" />
                          </div>
                          <Badge className={`px-3 py-1 rounded-full font-bold uppercase text-[9px] tracking-widest border-none ${
                             item.availableQuantity < item.lowStockAlert ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'
                          }`}>
                             {item.availableQuantity < item.lowStockAlert ? 'Low Stock' : 'In Stock'}
                          </Badge>
                       </div>
                       
                       <h4 className="text-xl font-bold text-slate-900">{item.itemName}</h4>
                       <p className="text-xs text-slate-400 font-medium uppercase tracking-widest mt-1">{item.category}</p>
                       
                       <div className="mt-8 space-y-4">
                          <div className="flex justify-between text-xs font-bold">
                             <span className="text-slate-400">Available: {item.availableQuantity}/{item.totalQuantity}</span>
                             <span className="text-slate-900">{Math.round((item.availableQuantity / item.totalQuantity) * 100)}%</span>
                          </div>
                          <Progress 
                            value={(item.availableQuantity / item.totalQuantity) * 100} 
                            className="h-2 rounded-full bg-slate-50" 
                            indicatorClassName={item.availableQuantity < item.lowStockAlert ? 'bg-rose-500' : 'bg-indigo-600'}
                          />
                       </div>

                       <div className="mt-8 pt-6 border-t border-slate-50 flex items-center justify-between">
                          <Button variant="ghost" size="sm" className="rounded-xl text-indigo-600 font-bold hover:bg-indigo-50">
                             <ArrowRightLeft className="w-4 h-4 mr-2" /> Checkout
                          </Button>
                          <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full text-slate-300">
                             <Info className="w-4 h-4" />
                          </Button>
                       </div>
                    </CardContent>
                 </Card>
               ))}
               
               {inventoryList.length === 0 && (
                 <div className="col-span-full py-20 text-center bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
                    <Package className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                    <p className="text-slate-400 font-bold">No inventory records found.</p>
                 </div>
               )}
            </div>
         </div>

         {/* Sidebar: Check-in & Procurement */}
         <div className="space-y-6">
            <Card className="border-none shadow-xl rounded-[2.5rem] bg-indigo-600 text-white p-8 overflow-hidden relative">
               <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl" />
               <div className="relative z-10">
                  <h4 className="text-xl font-bold mb-6">Quick Check-in</h4>
                  <p className="text-sm text-indigo-100 leading-relaxed mb-8">
                     Scan equipment QR code or capture student signature for gear returns.
                  </p>
                  <div className="space-y-3">
                     <Button className="w-full rounded-2xl h-14 bg-white text-indigo-600 font-bold shadow-xl shadow-indigo-900/20">
                        <PenTool className="w-5 h-5 mr-2" /> Capture Signature
                     </Button>
                     <Button variant="ghost" className="w-full rounded-2xl h-12 text-white font-bold hover:bg-white/10">
                        Manual Entry
                     </Button>
                  </div>
               </div>
            </Card>

            <Card className="border-none shadow-xl rounded-[2.5rem] bg-amber-50 p-8 border border-amber-100">
               <div className="flex items-center gap-3 mb-8">
                  <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-lg shadow-amber-200">
                     <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                     <h4 className="text-lg font-bold text-amber-900">Procurement Team</h4>
                     <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">Requisition Needed</p>
                  </div>
               </div>
               
               <div className="space-y-4">
                  {inventoryList.filter(i => i.availableQuantity < i.lowStockAlert).map((item) => (
                    <div key={item.id} className="p-4 bg-white rounded-2xl border border-amber-100 flex items-center justify-between">
                       <div>
                          <div className="text-xs font-bold text-slate-900">{item.itemName}</div>
                          <div className="text-[9px] text-amber-600 font-bold uppercase tracking-tighter">Only {item.availableQuantity} units left</div>
                       </div>
                       <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full text-amber-500 hover:bg-amber-50">
                          <Plus className="w-4 h-4" />
                       </Button>
                    </div>
                  ))}
                  {inventoryList.filter(i => i.availableQuantity < i.lowStockAlert).length === 0 && (
                    <div className="text-center py-4 text-xs font-bold text-slate-400 italic">No low stock alerts</div>
                  )}
               </div>

               <Button className="w-full mt-8 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold h-12 shadow-xl shadow-amber-200">
                  <ShoppingCart className="w-4 h-4 mr-2" /> Open Requisition
               </Button>
            </Card>

            {/* Fine Management Notice */}
            <div className="px-8">
               <div className="flex items-start gap-3 p-4 bg-slate-900 rounded-3xl text-white">
                  <Info className="w-5 h-5 text-indigo-400 mt-1 shrink-0" />
                  <p className="text-[10px] font-medium leading-relaxed opacity-80">
                     Lost kit fines are automatically calculated and added to the student's fee account upon "Lost" status confirmation.
                  </p>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
};

export default CoachInventory;
