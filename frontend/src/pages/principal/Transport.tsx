import { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Bus, 
  Users, 
  Clock, 
  Plus, 
  Trash2, 
  AlertTriangle,
  Phone,
  Navigation,
  Loader2,
  MoreVertical,
  FileSpreadsheet,
  Download,
  Upload
} from "lucide-react";
import * as XLSX from 'xlsx';
import { toast } from "sonner";
import api from "@/lib/api";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const TransportManagement = () => {
  const [buses, setBuses] = useState<any[]>([]);
  const [routes, setRoutes] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [schoolId, setSchoolId] = useState("");

  // Form States
  const [isBusDialogOpen, setIsBusDialogOpen] = useState(false);
  const [editingBus, setEditingBus] = useState<any>(null);
  const [busForm, setBusForm] = useState({
    busNumber: "",
    driverName: "",
    driverPhone: "",
    cleanerName: "",
    cleanerPhone: "",
    capacity: "",
    vehicleType: "Bus",
    routeId: "",
    status: "active"
  });

  const [isRouteDialogOpen, setIsRouteDialogOpen] = useState(false);
  const [routeForm, setRouteForm] = useState({
    routeName: "",
    area: ""
  });

  const [isStopDialogOpen, setIsStopDialogOpen] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<any>(null);
  const [stopForm, setStopForm] = useState({
    stopName: "",
    arrivalTime: "",
    order: "1"
  });

  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [assignForm, setAssignForm] = useState({
    userId: "",
    role: "student",
    routeId: "",
    stopId: ""
  });

  const [isExcelDialogOpen, setIsExcelDialogOpen] = useState(false);
  const [excelData, setExcelData] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [assignmentSearch, setAssignmentSearch] = useState("");
  const [routeFilter, setRouteFilter] = useState("");
  const [stopFilter, setStopFilter] = useState("");

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    setSchoolId(user.schoolId);
    fetchData(user.schoolId);
  }, []);

  const fetchData = async (sid: string) => {
    try {
      setLoading(true);
      const [busesRes, routesRes, studentsRes, staffRes, assignRes] = await Promise.all([
        api.get(`/transport/bus/${sid}`),
        api.get(`/transport/route/${sid}`),
        api.get(`/students/school/${sid}`),
        api.get(`/staff/school/${sid}`),
        api.get(`/transport/assignments/${sid}`)
      ]);

      setBuses(busesRes.data.data);
      setRoutes(routesRes.data.data);
      setStudents(studentsRes.data.data);
      setStaffList(staffRes.data.data);
      setAssignments(assignRes.data.data);
    } catch (error) {
      toast.error("Failed to fetch transport data");
    } finally {
      setLoading(false);
    }
  };

  const handleBusSubmit = async () => {
    try {
      if (editingBus) {
        await api.put(`/transport/bus/${editingBus.id}`, { ...busForm, schoolId });
        toast.success("Bus updated successfully");
      } else {
        await api.post(`/transport/bus`, { ...busForm, schoolId });
        toast.success("Bus created successfully");
      }
      setIsBusDialogOpen(false);
      setEditingBus(null);
      setBusForm({ busNumber: "", driverName: "", driverPhone: "", cleanerName: "", cleanerPhone: "", capacity: "", vehicleType: "Bus", routeId: "", status: "active" });
      fetchData(schoolId);
    } catch (error) {
      toast.error("Failed to save bus");
    }
  };

  const handleDeleteBus = async (id: string) => {
    if (!confirm("Are you sure you want to delete this bus?")) return;
    try {
      await api.delete(`/transport/bus/${id}`);
      toast.success("Bus deleted");
      fetchData(schoolId);
    } catch (error) {
      toast.error("Failed to delete bus");
    }
  };

  const handleRouteSubmit = async () => {
    try {
      await api.post(`/transport/route`, { ...routeForm, schoolId });
      toast.success("Route created");
      setIsRouteDialogOpen(false);
      setRouteForm({ routeName: "", area: "" });
      fetchData(schoolId);
    } catch (error) {
      toast.error("Failed to create route");
    }
  };

  const handleStopSubmit = async () => {
    try {
      await api.post(`/transport/stop`, { ...stopForm, routeId: selectedRoute.id });
      toast.success("Stop added");
      setIsStopDialogOpen(false);
      setStopForm({ stopName: "", arrivalTime: "", order: "1" });
      fetchData(schoolId);
    } catch (error) {
      toast.error("Failed to add stop");
    }
  };

  const handleAssignSubmit = async () => {
    try {
      await api.post(`/transport/assign`, { ...assignForm, schoolId });
      toast.success("User assigned to transport");
      setIsAssignDialogOpen(false);
      setAssignForm({ userId: "", role: "student", routeId: "", stopId: "" });
      fetchData(schoolId);
    } catch (error) {
      const msg = (error as any).response?.data?.message || "Failed to assign transport";
      toast.error(msg);
    }
  };

  const handleDeleteAssignment = async (id: string) => {
    if (!confirm("Remove this assignment?")) return;
    try {
      await api.delete(`/transport/assign/${id}`);
      toast.success("Assignment removed");
      fetchData(schoolId);
    } catch (error) {
      toast.error("Failed to remove assignment");
    }
  };

  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const rawData = XLSX.utils.sheet_to_json(ws);
        
        // Normalize keys for preview and consistent API payload
        const normalizedData = rawData.map((row: any) => {
          const newRow: any = {};
          Object.keys(row).forEach(key => {
            const k = key.trim().toLowerCase();
            if (k === 'studentid' || k === 'student id' || k === 'id') newRow.studentId = row[key];
            else if (k === 'routename' || k === 'route name' || k === 'route') newRow.routeName = row[key];
            else if (k === 'stopname' || k === 'stop name' || k === 'stop') newRow.stopName = row[key];
            else newRow[key] = row[key];
          });
          return newRow;
        });

        setExcelData(normalizedData);
        toast.success(`${normalizedData.length} records parsed from Excel`);
      } catch (error) {
        toast.error("Failed to parse Excel file");
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleBulkAssignSubmit = async () => {
    if (excelData.length === 0) {
      toast.error("No data to upload");
      return;
    }

    try {
      setUploading(true);
      const res = await api.post(`/transport/bulk-assign`, {
        assignments: excelData,
        schoolId
      });
      
      const { success, failed, errors } = res.data.data;
      
      if (failed > 0) {
        toast.error(`Completed: ${success} Success, ${failed} Failed. Error: ${errors[0]}`);
      } else {
        toast.success(`Bulk assignment completed! Success: ${success}`);
      }
      
      if (errors.length > 0) {
        console.warn("Bulk assignment errors:", errors);
      }

      setIsExcelDialogOpen(false);
      setExcelData([]);
      fetchData(schoolId);
    } catch (error) {
      toast.error("Failed to perform bulk assignment");
    } finally {
      setUploading(false);
    }
  };

  const downloadTemplate = () => {
    const template = [
      { studentId: "STU001", routeName: "Route A", stopName: "Main Gate" },
      { studentId: "STU002", routeName: "Route B", stopName: "Park Street" }
    ];
    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, "Transport_Bulk_Assignment_Template.xlsx");
  };

  if (loading) return (
    <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
      <Loader2 className="w-12 h-12 animate-spin text-indigo-600" />
      <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Loading Transport Grid...</p>
    </div>
  );

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-display font-bold text-slate-900 tracking-tight">Transport Management</h2>
          <p className="text-slate-500 font-medium mt-1">Manage buses, routes, and user assignments for your institution.</p>
        </div>
        <div className="flex items-center gap-3">
           <Button 
            onClick={() => { setEditingBus(null); setIsBusDialogOpen(true); }}
            className="rounded-2xl h-12 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold gap-2 shadow-lg shadow-indigo-100"
          >
            <Bus className="w-4 h-4" /> Add Bus
          </Button>
          <Button 
            onClick={() => setIsRouteDialogOpen(true)}
            variant="outline"
            className="rounded-2xl h-12 px-6 border-slate-200 font-bold gap-2"
          >
            <Navigation className="w-4 h-4" /> New Route
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: "Total Buses", value: buses.length, icon: Bus, color: "bg-indigo-50 text-indigo-600" },
          { label: "Active Routes", value: routes.length, icon: Navigation, color: "bg-emerald-50 text-emerald-600" },
          { label: "Assigned Users", value: assignments.length, icon: Users, color: "bg-amber-50 text-amber-600" },
          { 
            label: "Total Capacity", 
            value: buses.reduce((acc, b) => acc + (b.capacity || 0), 0), 
            icon: AlertTriangle, 
            color: "bg-rose-50 text-rose-600" 
          }
        ].map((stat, i) => (
          <Card key={i} className="border-none shadow-sm rounded-[2rem] bg-white p-6">
            <div className="flex items-center gap-4">
              <div className={`p-4 rounded-2xl ${stat.color}`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
                <p className="text-2xl font-display font-bold text-slate-900">{stat.value}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="buses" className="w-full">
        <TabsList className="bg-slate-100 p-1 rounded-2xl h-14 mb-8">
          <TabsTrigger value="buses" className="rounded-xl px-8 h-12 data-[state=active]:bg-white data-[state=active]:shadow-lg font-bold">Buses</TabsTrigger>
          <TabsTrigger value="routes" className="rounded-xl px-8 h-12 data-[state=active]:bg-white data-[state=active]:shadow-lg font-bold">Routes & Stops</TabsTrigger>
          <TabsTrigger value="assignments" className="rounded-xl px-8 h-12 data-[state=active]:bg-white data-[state=active]:shadow-lg font-bold">Assignments</TabsTrigger>
        </TabsList>

        <TabsContent value="buses" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {buses.map((bus) => (
              <Card key={bus.id} className="border-none shadow-xl rounded-[2.5rem] bg-white overflow-hidden group">
                <div className="p-8">
                  <div className="flex justify-between items-start mb-6">
                    <div className="p-4 rounded-[1.5rem] bg-slate-50 text-slate-900 shadow-inner group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500">
                      <Bus className="w-8 h-8" />
                    </div>
                    <div className="flex items-center gap-2">
                       <Badge className={bus.status === 'active' ? 'bg-emerald-500' : 'bg-slate-400'}>{bus.status}</Badge>
                       <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="rounded-full"><MoreVertical className="w-4 h-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="rounded-xl">
                            <DropdownMenuItem onClick={() => {
                              setEditingBus(bus);
                              setBusForm({
                                busNumber: bus.busNumber,
                                driverName: bus.driverName,
                                driverPhone: bus.driverPhone,
                                cleanerName: bus.cleanerName || "",
                                cleanerPhone: bus.cleanerPhone || "",
                                capacity: bus.capacity.toString(),
                                vehicleType: bus.vehicleType,
                                routeId: bus.routeId || "",
                                status: bus.status
                              });
                              setIsBusDialogOpen(true);
                            }}>Edit Bus</DropdownMenuItem>
                            <DropdownMenuItem className="text-rose-600" onClick={() => handleDeleteBus(bus.id)}>Delete Bus</DropdownMenuItem>
                          </DropdownMenuContent>
                       </DropdownMenu>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-2xl font-display font-bold text-slate-900">{bus.busNumber}</h4>
                      <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest">{bus.vehicleType}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-50">
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Driver</p>
                        <p className="text-sm font-bold text-slate-700">{bus.driverName}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Cleaner</p>
                        <p className="text-sm font-bold text-slate-700">{bus.cleanerName || 'N/A'}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Route</p>
                        <p className="text-sm font-bold text-slate-700">{bus.route?.routeName || 'Unassigned'}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4">
                       <div className="flex items-center gap-2 text-slate-500">
                          <Users className="w-4 h-4" />
                          <span className="text-xs font-bold">Cap: {bus.capacity}</span>
                       </div>
                       <Button variant="ghost" className="h-8 rounded-xl text-indigo-600 hover:bg-indigo-50 font-bold gap-2">
                          <Phone className="w-3 h-3" /> Contact
                       </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="routes" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             {routes.map((route) => (
                <Card key={route.id} className="border-none shadow-xl rounded-[2.5rem] bg-white p-8">
                   <div className="flex justify-between items-start mb-6">
                      <div>
                         <h4 className="text-2xl font-display font-bold text-slate-900">{route.routeName}</h4>
                         <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{route.area}</p>
                      </div>
                      <Button 
                        size="sm" 
                        onClick={() => { setSelectedRoute(route); setIsStopDialogOpen(true); }}
                        className="rounded-xl bg-slate-900 text-white font-bold gap-2"
                      >
                         <Plus className="w-4 h-4" /> Add Stop
                      </Button>
                   </div>

                   <div className="space-y-4">
                      {route.stops?.map((stop: any, idx: number) => (
                         <div key={stop.id} className="flex items-center gap-4 group">
                            <div className="flex flex-col items-center">
                               <div className="w-8 h-8 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500">
                                  {idx + 1}
                               </div>
                               {idx < route.stops.length - 1 && <div className="w-0.5 h-8 bg-slate-100" />}
                            </div>
                            <div className="flex-1 p-4 rounded-2xl bg-slate-50/50 border border-transparent group-hover:border-indigo-100 group-hover:bg-indigo-50/30 transition-all flex justify-between items-center">
                               <div>
                                  <p className="text-sm font-bold text-slate-900">{stop.stopName}</p>
                                  <div className="flex items-center gap-2 mt-1">
                                     <Clock className="w-3 h-3 text-slate-400" />
                                     <span className="text-[10px] font-bold text-slate-500">{stop.arrivalTime}</span>
                                  </div>
                               </div>
                               <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-8 w-8 text-slate-300 hover:text-rose-600"
                                  onClick={async () => {
                                     if (confirm("Delete this stop?")) {
                                        try {
                                           await api.delete(`/transport/stop/${stop.id}`);
                                           toast.success("Stop deleted");
                                           fetchData(schoolId);
                                        } catch (e) {
                                           toast.error("Failed to delete stop");
                                        }
                                     }
                                  }}
                               >
                                  <Trash2 className="w-4 h-4" />
                               </Button>
                            </div>
                         </div>
                      ))}
                      {(!route.stops || route.stops.length === 0) && (
                        <div className="py-8 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                           <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No stops defined for this route</p>
                        </div>
                      )}
                   </div>
                </Card>
             ))}
          </div>
        </TabsContent>

        <TabsContent value="assignments" className="space-y-6">
           <Card className="border-none shadow-xl rounded-[2.5rem] bg-white p-8">
              <div className="flex items-center justify-between mb-8">
                 <h4 className="text-2xl font-display font-bold text-slate-900">User Assignments</h4>
                 <div className="flex flex-wrap items-center gap-4">
                    <div className="relative">
                      <Input 
                        placeholder="Search student or ID..."
                        value={assignmentSearch}
                        onChange={(e) => setAssignmentSearch(e.target.value)}
                        className="h-12 w-48 rounded-2xl bg-slate-50 border-none pl-10 font-medium"
                      />
                      <Users className="w-4 h-4 absolute left-4 top-4 text-slate-400" />
                    </div>

                    <select 
                      value={routeFilter}
                      onChange={(e) => { setRouteFilter(e.target.value); setStopFilter(""); }}
                      className="h-12 w-40 rounded-2xl bg-slate-50 border-none px-4 font-bold text-xs"
                    >
                      <option value="">All Routes</option>
                      {routes.map(r => <option key={r.id} value={r.id}>{r.routeName}</option>)}
                    </select>

                    <select 
                      value={stopFilter}
                      onChange={(e) => setStopFilter(e.target.value)}
                      disabled={!routeFilter}
                      className="h-12 w-40 rounded-2xl bg-slate-50 border-none px-4 font-bold text-xs disabled:opacity-50"
                    >
                      <option value="">All Stops</option>
                      {routes.find(r => r.id === routeFilter)?.stops?.map((s: any) => (
                        <option key={s.id} value={s.id}>{s.stopName}</option>
                      ))}
                    </select>

                    <Button 
                      onClick={() => setIsExcelDialogOpen(true)}
                      variant="outline"
                      className="rounded-2xl h-12 px-6 border-slate-200 font-bold gap-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                    >
                      <FileSpreadsheet className="w-4 h-4" /> Bulk Upload Students
                    </Button>
                    <Button 
                      onClick={() => setIsAssignDialogOpen(true)}
                      className="rounded-2xl h-12 px-6 bg-slate-900 text-white font-bold gap-2 shadow-lg shadow-slate-200"
                    >
                      <Plus className="w-4 h-4" /> Assign New User
                    </Button>
                 </div>
              </div>

              <div className="rounded-3xl border border-slate-100 overflow-hidden">
                 <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-100">
                       <tr>
                          <th className="p-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">User</th>
                          <th className="p-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Role</th>
                          <th className="p-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Route</th>
                          <th className="p-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Stop</th>
                          <th className="p-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Actions</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {assignments
                          .filter(a => {
                            const matchesSearch = a.name.toLowerCase().includes(assignmentSearch.toLowerCase()) || 
                                                 a.identifier.toLowerCase().includes(assignmentSearch.toLowerCase());
                            const matchesRoute = !routeFilter || a.routeId === routeFilter;
                            const matchesStop = !stopFilter || a.stopId === stopFilter;
                            return matchesSearch && matchesRoute && matchesStop;
                          })
                          .map((a) => (
                           <tr key={a.id} className="hover:bg-slate-50/50 transition-all">
                              <td className="p-6">
                                 <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs">
                                       {a.name.charAt(0)}
                                    </div>
                                    <div>
                                       <p className="text-sm font-bold text-slate-900">{a.name}</p>
                                       <p className="text-[10px] font-bold text-slate-400">#{a.identifier}</p>
                                    </div>
                                 </div>
                              </td>
                              <td className="p-6"><Badge variant="outline" className="rounded-full capitalize">{a.role}</Badge></td>
                              <td className="p-6 text-sm font-bold text-slate-700">{a.route?.routeName}</td>
                              <td className="p-6 text-sm font-bold text-slate-700">{a.stop?.stopName} ({a.stop?.arrivalTime})</td>
                              <td className="p-6">
                                 <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="text-slate-300 hover:text-rose-600"
                                    onClick={() => handleDeleteAssignment(a.id)}
                                 >
                                    <Trash2 className="w-4 h-4" />
                                 </Button>
                              </td>
                           </tr>
                        ))}
                        {assignments.length === 0 && (
                           <tr>
                              <td colSpan={5} className="p-20 text-center text-slate-400 font-bold uppercase text-[10px] tracking-widest">
                                 No transport assignments found
                              </td>
                           </tr>
                        )}
                     </tbody>
                 </table>
              </div>
           </Card>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <Dialog open={isBusDialogOpen} onOpenChange={setIsBusDialogOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-[2.5rem] p-8">
          <DialogHeader>
            <DialogTitle className="text-2xl font-display font-bold">{editingBus ? 'Edit Bus' : 'Add New Bus'}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-6">
            <div className="space-y-2 col-span-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Bus Number</label>
              <Input 
                value={busForm.busNumber} 
                onChange={(e) => setBusForm({...busForm, busNumber: e.target.value})}
                className="h-12 rounded-xl bg-slate-50 border-none font-bold" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Driver Name</label>
              <Input 
                value={busForm.driverName} 
                onChange={(e) => setBusForm({...busForm, driverName: e.target.value})}
                className="h-12 rounded-xl bg-slate-50 border-none font-bold" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Driver Phone</label>
              <Input 
                value={busForm.driverPhone} 
                onChange={(e) => setBusForm({...busForm, driverPhone: e.target.value})}
                className="h-12 rounded-xl bg-slate-50 border-none font-bold" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Cleaner Name</label>
              <Input 
                value={busForm.cleanerName} 
                onChange={(e) => setBusForm({...busForm, cleanerName: e.target.value})}
                className="h-12 rounded-xl bg-slate-50 border-none font-bold" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Cleaner Phone</label>
              <Input 
                value={busForm.cleanerPhone} 
                onChange={(e) => setBusForm({...busForm, cleanerPhone: e.target.value})}
                className="h-12 rounded-xl bg-slate-50 border-none font-bold" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Capacity</label>
              <Input 
                type="number"
                value={busForm.capacity} 
                onChange={(e) => setBusForm({...busForm, capacity: e.target.value})}
                className="h-12 rounded-xl bg-slate-50 border-none font-bold" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Assigned Route</label>
              <select 
                value={busForm.routeId}
                onChange={(e) => setBusForm({...busForm, routeId: e.target.value})}
                className="w-full h-12 rounded-xl bg-slate-50 border-none font-bold px-4 text-sm"
              >
                <option value="">Select Route</option>
                {routes.map(r => <option key={r.id} value={r.id}>{r.routeName}</option>)}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleBusSubmit} className="w-full h-14 rounded-2xl bg-indigo-600 font-bold text-lg shadow-xl shadow-indigo-100">
              {editingBus ? 'Update Bus Details' : 'Create Bus Record'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isRouteDialogOpen} onOpenChange={setIsRouteDialogOpen}>
        <DialogContent className="sm:max-w-[400px] rounded-[2.5rem] p-8">
          <DialogHeader>
            <DialogTitle className="text-2xl font-display font-bold">New Route</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-6">
             <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Route Name</label>
              <Input 
                value={routeForm.routeName} 
                onChange={(e) => setRouteForm({...routeForm, routeName: e.target.value})}
                placeholder="e.g. Route A - North"
                className="h-12 rounded-xl bg-slate-50 border-none font-bold" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Area / Zone</label>
              <Input 
                value={routeForm.area} 
                onChange={(e) => setRouteForm({...routeForm, area: e.target.value})}
                placeholder="e.g. North Zone"
                className="h-12 rounded-xl bg-slate-50 border-none font-bold" 
              />
            </div>
          </div>
          <DialogFooter>
             <Button onClick={handleRouteSubmit} className="w-full h-14 rounded-2xl bg-indigo-600 font-bold">Create Route</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isStopDialogOpen} onOpenChange={setIsStopDialogOpen}>
        <DialogContent className="sm:max-w-[400px] rounded-[2.5rem] p-8">
          <DialogHeader>
            <DialogTitle className="text-2xl font-display font-bold">Add Stop to {selectedRoute?.routeName}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-6">
             <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Stop Name</label>
              <Input 
                value={stopForm.stopName} 
                onChange={(e) => setStopForm({...stopForm, stopName: e.target.value})}
                className="h-12 rounded-xl bg-slate-50 border-none font-bold" 
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Arrival Time</label>
                <Input 
                  type="time"
                  value={stopForm.arrivalTime} 
                  onChange={(e) => setStopForm({...stopForm, arrivalTime: e.target.value})}
                  className="h-12 rounded-xl bg-slate-50 border-none font-bold" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Order Index</label>
                <Input 
                  type="number"
                  value={stopForm.order} 
                  onChange={(e) => setStopForm({...stopForm, order: e.target.value})}
                  className="h-12 rounded-xl bg-slate-50 border-none font-bold" 
                />
              </div>
            </div>
          </div>
          <DialogFooter>
             <Button onClick={handleStopSubmit} className="w-full h-14 rounded-2xl bg-indigo-600 font-bold">Add Stop</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-[2.5rem] p-8">
          <DialogHeader>
            <DialogTitle className="text-2xl font-display font-bold">Assign Transport</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-6">
             <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">User Role</label>
                <div className="flex gap-2 p-1 bg-slate-50 rounded-xl">
                   {['student', 'staff'].map((r) => (
                      <button 
                        key={r}
                        onClick={() => setAssignForm({...assignForm, role: r, userId: ""})}
                        className={`flex-1 h-10 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${assignForm.role === r ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400'}`}
                      >
                         {r}
                      </button>
                   ))}
                </div>
             </div>

             <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Select {assignForm.role === 'student' ? 'Student' : 'Staff'}</label>
                <select 
                  value={assignForm.userId}
                  onChange={(e) => setAssignForm({...assignForm, userId: e.target.value})}
                  className="w-full h-12 rounded-xl bg-slate-50 border-none font-bold px-4 text-sm"
                >
                  <option value="">Select User</option>
                  {assignForm.role === 'student' 
                    ? students.map(s => <option key={s.id} value={s.id}>{s.name} ({s.studentId})</option>)
                    : staffList.map(s => <option key={s.id} value={s.id}>{s.name} ({s.staffId || 'Staff'})</option>)
                  }
                </select>
             </div>

             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                   <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Route</label>
                   <select 
                    value={assignForm.routeId}
                    onChange={(e) => setAssignForm({...assignForm, routeId: e.target.value, stopId: ""})}
                    className="w-full h-12 rounded-xl bg-slate-50 border-none font-bold px-4 text-sm"
                  >
                    <option value="">Select Route</option>
                    {routes.map(r => <option key={r.id} value={r.id}>{r.routeName}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Stop</label>
                   <select 
                    value={assignForm.stopId}
                    onChange={(e) => setAssignForm({...assignForm, stopId: e.target.value})}
                    disabled={!assignForm.routeId}
                    className="w-full h-12 rounded-xl bg-slate-50 border-none font-bold px-4 text-sm disabled:opacity-50"
                  >
                    <option value="">Select Stop</option>
                    {routes.find(r => r.id === assignForm.routeId)?.stops?.map((s: any) => (
                      <option key={s.id} value={s.id}>{s.stopName} ({s.arrivalTime})</option>
                    ))}
                  </select>
                </div>
             </div>
          </div>
          <DialogFooter>
             <Button onClick={handleAssignSubmit} className="w-full h-14 rounded-2xl bg-indigo-600 font-bold">Confirm Assignment</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isExcelDialogOpen} onOpenChange={setIsExcelDialogOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-[2.5rem] p-8">
          <DialogHeader>
            <DialogTitle className="text-2xl font-display font-bold text-center">Bulk Student Assignment</DialogTitle>
          </DialogHeader>
          <div className="py-6 space-y-6">
            <div className="p-6 border-2 border-dashed border-slate-200 rounded-[2rem] bg-slate-50 flex flex-col items-center justify-center gap-4 group hover:border-emerald-200 hover:bg-emerald-50 transition-all relative">
              <div className="w-16 h-16 rounded-3xl bg-white shadow-sm flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-all">
                <Upload className="w-8 h-8" />
              </div>
              <div className="text-center">
                <p className="text-sm font-bold text-slate-900">Upload Excel File</p>
                <p className="text-xs text-slate-400 font-medium">Select transport assignment sheet</p>
              </div>
              <input 
                type="file" 
                accept=".xlsx, .xls" 
                className="absolute inset-0 opacity-0 cursor-pointer"
                onChange={handleExcelUpload}
              />
            </div>

            <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl flex gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-amber-900 uppercase">Requirements</p>
                <p className="text-xs text-amber-700 font-medium leading-relaxed">
                  Excel should contain: <span className="font-bold">studentId</span>, <span className="font-bold">routeName</span>, and <span className="font-bold">stopName</span> columns.
                </p>
              </div>
            </div>

            {excelData.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Selected Records ({excelData.length})</p>
                  <Button variant="ghost" className="h-6 text-[10px] font-bold text-rose-600 hover:bg-rose-50" onClick={() => setExcelData([])}>Clear</Button>
                </div>
                <div className="max-h-[150px] overflow-y-auto rounded-xl border border-slate-100 divide-y divide-slate-50">
                   {excelData.slice(0, 5).map((row, i) => (
                     <div key={i} className="p-3 text-[10px] font-medium text-slate-600 flex justify-between">
                        <span>{row.studentId || 'N/A'}</span>
                        <span className="text-slate-400">{row.routeName} → {row.stopName}</span>
                     </div>
                   ))}
                   {excelData.length > 5 && (
                     <div className="p-3 text-[10px] font-bold text-slate-400 text-center bg-slate-50/50">
                       + {excelData.length - 5} more records
                     </div>
                   )}
                </div>
              </div>
            )}

            <div className="flex gap-3">
               <Button 
                variant="outline" 
                className="flex-1 h-12 rounded-2xl font-bold gap-2 border-slate-200"
                onClick={downloadTemplate}
              >
                <Download className="w-4 h-4" /> Template
              </Button>
              <Button 
                className="flex-[2] h-12 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2 shadow-lg shadow-emerald-100 disabled:opacity-50"
                disabled={excelData.length === 0 || uploading}
                onClick={handleBulkAssignSubmit}
              >
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                {uploading ? 'Processing...' : 'Start Assignment'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TransportManagement;
