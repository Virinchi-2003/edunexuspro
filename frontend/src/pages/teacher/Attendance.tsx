import React from 'react';
import PrincipalAttendance from '../principal/Attendance';

const TeacherAttendance: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-display font-bold text-slate-900">Mark Attendance</h2>
        <p className="text-slate-500">Record daily presence for Class 10-A.</p>
      </div>
      <PrincipalAttendance />
    </div>
  );
};

export default TeacherAttendance;
