import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { 
  School, 
  User, 
  Users, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  FileText, 
  Upload, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft,
  Loader2,
  Fingerprint,
  Building
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import api from '@/lib/api';
import { toast } from 'sonner';

const formSchema = z.object({
  schoolId: z.string().min(1, 'School ID is required'),
  studentName: z.string().min(2, 'Name must be at least 2 characters'),
  parentName: z.string().min(2, 'Parent name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Invalid phone number'),
  grade: z.string().min(1, 'Please select a grade'),
  address: z.string().min(5, 'Address is required'),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  gender: z.string().min(1, 'Please select gender'),
  aadhaarNumber: z.string().optional(),
  bloodGroup: z.string().optional(),
  previousSchool: z.string().optional(),
  religion: z.string().optional(),
  category: z.string().optional(),
  documents: z.array(z.string()).optional(),
});

const AdmissionForm: React.FC = () => {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [applicationId, setApplicationId] = useState('');
  const [schoolsList, setSchoolsList] = useState<{id: string, name: string, school_id: string}[]>([]);
  const navigate = useNavigate();

  React.useEffect(() => {
    const fetchSchools = async () => {
      try {
        const response = await api.get('/schools/public');
        if (response.data.status === 'success') {
          setSchoolsList(response.data.data);
        }
      } catch (error) {
        console.error('Failed to fetch schools', error);
      }
    };
    fetchSchools();
  }, []);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      schoolId: '',
      studentName: '',
      parentName: '',
      email: '',
      phone: '',
      grade: '',
      address: '',
      dateOfBirth: '',
      gender: '',
      aadhaarNumber: '',
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsSubmitting(true);
      const response = await api.post('/admissions', values);
      if (response.data.status === 'success') {
        setApplicationId(response.data.data.id);
        setSubmitted(true);
        toast.success('Application submitted successfully!');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to submit application');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-body">
        <Card className="w-full max-w-2xl border-none shadow-2xl">
          <CardContent className="pt-12 pb-12 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-3xl font-display font-bold text-slate-900 mb-2">Application Received!</h2>
            <p className="text-slate-500 mb-8 max-w-md mx-auto">
              Your application has been successfully submitted. Please save your application ID for future reference.
            </p>
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 mb-8 inline-block">
              <p className="text-sm text-slate-400 uppercase tracking-wider font-semibold mb-1">Application ID</p>
              <p className="text-2xl font-mono font-bold text-primary">{applicationId}</p>
            </div>
            <div className="space-y-4">
              <p className="text-sm text-slate-400">
                The school administration will review your application. A reply will be sent to your registered email address soon.
              </p>
              <Button onClick={() => navigate('/login')} variant="outline" className="gap-2">
                <ArrowLeft className="w-4 h-4" /> Back to Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 font-body">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20">
            <School className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold text-slate-900">Student Admission Portal</h1>
            <p className="text-slate-500 text-sm">Empowering education through digital excellence</p>
          </div>
        </div>

        <Card className="border-none shadow-2xl shadow-primary/5 overflow-hidden">
          <div className="bg-primary p-1 flex">
            <div className={`h-1.5 transition-all duration-500 bg-white/30 rounded-full mx-1 ${step >= 1 ? 'flex-[1]' : 'w-0'}`} />
            <div className={`h-1.5 transition-all duration-500 bg-white/30 rounded-full mx-1 ${step >= 2 ? 'flex-[1]' : 'w-0'}`} />
            <div className={`h-1.5 transition-all duration-500 bg-white/30 rounded-full mx-1 ${step >= 3 ? 'flex-[1]' : 'w-0'}`} />
          </div>

          <CardHeader className="bg-white border-b border-slate-50 px-8 py-6">
            <CardTitle className="text-xl font-display font-bold flex items-center gap-2">
              {step === 1 && <><User className="w-5 h-5 text-primary" /> Personal Information</>}
              {step === 2 && <><Users className="w-5 h-5 text-primary" /> Family & Contact Details</>}
              {step === 3 && <><FileText className="w-5 h-5 text-primary" /> Documents & Review</>}
            </CardTitle>
            <CardDescription>
              Step {step} of 3: {step === 1 ? 'Tell us about the student' : step === 2 ? 'How can we reach you?' : 'Upload necessary documents'}
            </CardDescription>
          </CardHeader>

          <CardContent className="p-8">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {step === 1 && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="schoolId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2"><Building className="w-4 h-4" /> Select School</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="bg-slate-50 border-slate-100">
                                  <SelectValue placeholder="Select School" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {schoolsList.map(school => (
                                  <SelectItem key={school.id} value={school.id}>
                                    {school.name} ({school.school_id})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="grade"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Applying for Grade</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="bg-slate-50 border-slate-100">
                                  <SelectValue placeholder="Select Grade" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {['Nursery', 'LKG', 'UKG', ...Array.from({length: 12}, (_, i) => `${i+1}`)].map(g => (
                                  <SelectItem key={g} value={g}>{g}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="studentName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Student Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter student's full name" {...field} className="bg-slate-50 border-slate-100" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="dateOfBirth"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2"><Calendar className="w-4 h-4" /> Date of Birth</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} className="bg-slate-50 border-slate-100" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="gender"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Gender</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="bg-slate-50 border-slate-100">
                                  <SelectValue placeholder="Select Gender" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="male">Male</SelectItem>
                                <SelectItem value="female">Female</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="bloodGroup"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Blood Group</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="bg-slate-50 border-slate-100">
                                  <SelectValue placeholder="Select" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(b => (
                                  <SelectItem key={b} value={b}>{b}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="category"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Category</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="bg-slate-50 border-slate-100">
                                  <SelectValue placeholder="Select" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="general">General</SelectItem>
                                <SelectItem value="obc">OBC</SelectItem>
                                <SelectItem value="sc">SC</SelectItem>
                                <SelectItem value="st">ST</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="previousSchool"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Previous School Name (If any)</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter previous school name" {...field} className="bg-slate-50 border-slate-100" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="religion"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Religion</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="bg-slate-50 border-slate-100">
                                  <SelectValue placeholder="Select" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {['Hindu', 'Muslim', 'Christian', 'Sikh', 'Jain', 'Other'].map(r => (
                                  <SelectItem key={r} value={r.toLowerCase()}>{r}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                    <FormField
                      control={form.control}
                      name="parentName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Parent/Guardian Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter parent's full name" {...field} className="bg-slate-50 border-slate-100" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2"><Mail className="w-4 h-4" /> Contact Email</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="email@example.com" {...field} className="bg-slate-50 border-slate-100" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2"><Phone className="w-4 h-4" /> Phone Number</FormLabel>
                            <FormControl>
                              <Input placeholder="+91 9876543210" {...field} className="bg-slate-50 border-slate-100" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2"><MapPin className="w-4 h-4" /> Residential Address</FormLabel>
                          <FormControl>
                            <Input placeholder="Full residential address" {...field} className="bg-slate-50 border-slate-100" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                {step === 3 && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                    <FormField
                      control={form.control}
                      name="aadhaarNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2"><Fingerprint className="w-4 h-4" /> Aadhaar Number (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="12-digit Aadhaar number" {...field} className="bg-slate-50 border-slate-100" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="space-y-4 pt-4">
                      <h3 className="text-sm font-semibold text-slate-700">Document Upload</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {['Birth Certificate', 'Transfer Certificate', 'Previous Report Card'].map(doc => {
                          const isUploaded = form.watch('documents')?.includes(doc);
                          return (
                            <div 
                              key={doc} 
                              onClick={() => {
                                const currentDocs = form.getValues('documents') || [];
                                if (currentDocs.includes(doc)) {
                                  form.setValue('documents', currentDocs.filter(d => d !== doc));
                                } else {
                                  form.setValue('documents', [...currentDocs, doc]);
                                  toast.success(`${doc} attached!`);
                                }
                              }}
                              className={`border-2 border-dashed rounded-xl p-4 text-center transition-all cursor-pointer group ${
                                isUploaded ? 'border-primary bg-primary/5' : 'border-slate-200 hover:border-primary/50'
                              }`}
                            >
                              {isUploaded ? (
                                <CheckCircle2 className="w-6 h-6 text-primary mx-auto mb-2" />
                              ) : (
                                <Upload className="w-6 h-6 text-slate-400 mx-auto mb-2 group-hover:text-primary transition-all" />
                              )}
                              <p className={`text-[10px] font-bold ${isUploaded ? 'text-primary' : 'text-slate-500'}`}>{doc}</p>
                              <p className="text-[8px] text-slate-400">{isUploaded ? 'File Ready' : 'PDF or JPG (Max 2MB)'}</p>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100 mt-8">
                      <div className="flex gap-4">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm shrink-0">
                          <CheckCircle2 className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-blue-900">Confirmation</h4>
                          <p className="text-xs text-blue-700 mt-1 leading-relaxed">
                            I hereby declare that the information provided is true to the best of my knowledge. I understand that any false information may lead to rejection of the application.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-between pt-8 border-t border-slate-50 mt-8">
                  {step > 1 ? (
                    <Button type="button" variant="ghost" onClick={() => setStep(step - 1)} className="gap-2">
                      <ArrowLeft className="w-4 h-4" /> Previous
                    </Button>
                  ) : (
                    <Button type="button" variant="ghost" onClick={() => navigate('/login')} className="gap-2">
                      <ArrowLeft className="w-4 h-4" /> Cancel
                    </Button>
                  )}

                  {step < 3 ? (
                    <Button type="button" onClick={() => setStep(step + 1)} className="gap-2">
                      Next Step <ArrowRight className="w-4 h-4" />
                    </Button>
                  ) : (
                    <Button type="submit" disabled={isSubmitting} className="gap-2 min-w-[140px]">
                      {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                      Submit Application
                    </Button>
                  )}
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdmissionForm;
