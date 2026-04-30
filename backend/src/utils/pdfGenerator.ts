import PDFDocument from 'pdfkit';
import { Response } from 'express';

export const generateReportCardPDF = (data: any, res: Response) => {
  const doc = new PDFDocument({ margin: 50 });

  // Pipe its output somewhere, e.g. onto a response
  doc.pipe(res);

  // Add content
  doc
    .fontSize(25)
    .text('EduNexus Pro - Academic Report Card', { align: 'center' })
    .moveDown();

  doc
    .fontSize(14)
    .text(`Student Name: ${data.studentName}`)
    .text(`Student ID: ${data.studentId}`)
    .text(`Grade/Class: ${data.grade}`)
    .text(`Term: ${data.term}`)
    .moveDown();

  doc.text('Subject Wise Performance:', { underline: true }).moveDown(0.5);

  data.marks.forEach((m: any) => {
    doc.text(`${m.subject}: ${m.marksObtained}/${m.totalMarks} (Grade: ${m.grade})`);
  });

  doc.moveDown();
  doc.text(`Overall Attendance: ${data.attendance}%`);
  doc.text(`Principal's Remarks: ${data.remarks || 'Excellent performance.'}`);

  // Finalize document
  doc.end();
};

export const generateBatchReportPDF = (studentsData: any[], res: Response) => {
  const doc = new PDFDocument({ margin: 50 });
  doc.pipe(res);

  studentsData.forEach((data, index) => {
    if (index > 0) doc.addPage();

    doc
      .fontSize(25)
      .text('EduNexus Pro - Academic Report Card', { align: 'center' })
      .moveDown();

    doc
      .fontSize(14)
      .text(`Student Name: ${data.studentName}`)
      .text(`Student ID: ${data.studentId}`)
      .text(`Grade/Class: ${data.grade}`)
      .text(`Term: ${data.term}`)
      .moveDown();

    doc.text('Subject Wise Performance:', { underline: true }).moveDown(0.5);

    data.marks.forEach((m: any) => {
      doc.text(`${m.subject}: ${m.marksObtained}/${m.totalMarks} (Grade: ${m.grade})`);
    });

    doc.moveDown();
    doc.text(`Overall Attendance: ${data.attendance}%`);
    doc.text(`Principal's Remarks: ${data.remarks || 'Excellent performance.'}`);
    
    // Add a footer
    doc.fontSize(10).text('\nThis is a computer-generated report card.', { align: 'center' });
  });

  doc.end();
};

export const generateHallTicketPDF = (ticketsData: any[], res: Response) => {
  const doc = new PDFDocument({ margin: 50 });
  doc.pipe(res);

  ticketsData.forEach((data, index) => {
    if (index > 0) doc.addPage();

    // Border
    doc.rect(20, 20, 572, 752).stroke();

    doc.fillColor('#000000');
    doc
      .fontSize(22)
      .text('EduNexus Pro - EXAMINATION HALL TICKET', { align: 'center', underline: true })
      .moveDown();

    doc
      .fontSize(12)
      .text(`Examination: ${data.examName}`, { align: 'center' })
      .text(`Term: ${data.term}`, { align: 'center' })
      .moveDown();

    // Student Info Box
    doc.rect(50, 150, 500, 100).fillAndStroke('#f8fafc', '#e2e8f0');
    doc.fillColor('#000000');
    
    doc.text(`Candidate Name: ${data.studentName}`, 70, 170);
    doc.text(`Roll Number: ${data.studentId}`, 70, 190);
    doc.text(`Class/Section: ${data.className}`, 70, 210);

    doc.moveDown(5);
    doc.fontSize(14).text('Examination Schedule:', { underline: true }).moveDown(0.5);

    // Schedule Table Header
    doc.fontSize(10);
    doc.text('Subject', 50, 300, { width: 200 });
    doc.text('Date', 250, 300, { width: 150 });
    doc.text('Time', 400, 300, { width: 100 });
    doc.moveTo(50, 315).lineTo(550, 315).stroke();

    let y = 330;
    data.schedules.forEach((s: any) => {
      doc.text(s.subject, 50, y);
      doc.text(s.date, 250, y);
      doc.text(s.time, 400, y);
      y += 25;
    });

    doc.moveDown(8);
    doc.fontSize(10).font('Helvetica-Bold').text('Instructions:').font('Helvetica').moveDown(0.5);
    doc.fontSize(8).text('1. Candidates must reach the examination hall 30 minutes before the commencement.');
    doc.text('2. Please bring your own stationery and water bottle.');
    doc.text('3. Use of mobile phones or smartwatches is strictly prohibited.');

    doc.moveDown(4);
    doc.fontSize(12).text("Principal's Signature", { align: 'right' });
  });

  doc.end();
};

export const generateExamSchedulePDF = (examData: any, res: Response) => {
  const doc = new PDFDocument({ margin: 50 });
  doc.pipe(res);

  doc
    .fontSize(25)
    .text('EduNexus Pro - Examination Schedule', { align: 'center' })
    .moveDown();

  doc
    .fontSize(14)
    .text(`Examination: ${examData.name}`)
    .text(`Term: ${examData.term || 'N/A'}`)
    .text(`Duration: ${examData.startDate} to ${examData.endDate}`)
    .moveDown();

  doc.fontSize(14).text('Timetable Details:', { underline: true }).moveDown(0.5);

  // Table Header
  doc.fontSize(10).font('Helvetica-Bold');
  doc.text('Subject', 50, 200, { width: 200 });
  doc.text('Date', 250, 200, { width: 150 });
  doc.text('Time', 400, 200, { width: 150 });
  doc.moveTo(50, 215).lineTo(550, 215).stroke();

  doc.font('Helvetica');
  let y = 230;
  const schedules = examData.schedules || [];
  
  schedules.forEach((s: any) => {
    doc.text(s.subject || 'N/A', 50, y);
    doc.text(s.date || 'N/A', 250, y);
    doc.text(`${s.startTime || 'N/A'} - ${s.endTime || 'N/A'}`, 400, y);
    y += 25;
    
    if (y > 700) {
        doc.addPage();
        y = 50;
    }
  });

  doc.moveDown(4);
  doc.fontSize(10).text('\nThis is an official document generated by EduNexus Pro Management System.', { align: 'center', oblique: true });

  doc.end();
};

export const generateAttendanceReportPDF = (reportData: any, res: Response) => {
  const doc = new PDFDocument({ margin: 50 });
  doc.pipe(res);

  doc
    .fontSize(20)
    .text('EduNexus Pro - Attendance Report', { align: 'center' })
    .moveDown();

  doc
    .fontSize(12)
    .text(`School: ${reportData.schoolName}`)
    .text(`Date: ${reportData.date}`)
    .text(`Type: ${reportData.type.toUpperCase()} Attendance`)
    .moveDown();

  // Table Header
  doc.fontSize(10).font('Helvetica-Bold');
  doc.text('Name', 50, 180, { width: 200 });
  doc.text('ID', 250, 180, { width: 100 });
  doc.text('Status', 350, 180, { width: 100 });
  doc.text('Remarks', 450, 180, { width: 100 });
  doc.moveTo(50, 195).lineTo(550, 195).stroke();

  doc.font('Helvetica');
  let y = 205;
  
  reportData.records.forEach((r: any) => {
    const name = r.student ? r.student.name : (r.staff ? r.staff.name : 'N/A');
    const id = r.student ? r.student.studentId : (r.staff ? r.staff.id.slice(0,8) : 'N/A');

    doc.text(name, 50, y, { width: 200 });
    doc.text(id, 250, y, { width: 100 });
    doc.text(r.status.toUpperCase(), 350, y, { width: 100 });
    doc.text(r.remarks || '-', 450, y, { width: 100 });
    
    y += 20;

    if (y > 700) {
      doc.addPage();
      y = 50;
    }
  });

  doc.end();
};
export const generateGradebookPDF = (data: any, res: Response) => {
  const doc = new PDFDocument({ margin: 50 });
  doc.pipe(res);

  doc
    .fontSize(22)
    .text('EduNexus Pro - Academic Gradebook', { align: 'center' })
    .moveDown();

  doc
    .fontSize(12)
    .text(`Exam: ${data.examName}`)
    .text(`Class: ${data.className}`)
    .text(`Subject: ${data.subject}`)
    .text(`Term: ${data.term}`)
    .text(`Date Generated: ${new Date().toLocaleDateString()}`)
    .moveDown();

  // Table Header
  doc.fontSize(10).font('Helvetica-Bold');
  doc.text('Student Name', 50, 180, { width: 180 });
  doc.text('Student ID', 230, 180, { width: 80 });
  doc.text('Marks', 320, 180, { width: 60 });
  doc.text('Grade', 390, 180, { width: 50 });
  doc.text('Remarks', 450, 180, { width: 100 });
  doc.moveTo(50, 195).lineTo(550, 195).stroke();

  doc.font('Helvetica');
  let y = 205;

  data.records.forEach((r: any) => {
    doc.text(r.studentName, 50, y, { width: 180 });
    doc.text(r.studentId, 230, y, { width: 80 });
    doc.text(`${r.marksObtained}/${data.totalMarks}`, 320, y, { width: 60 });
    doc.text(r.grade, 390, y, { width: 50 });
    doc.text(r.comments || '-', 450, y, { width: 100 });
    
    y += 20;

    if (y > 700) {
      doc.addPage();
      y = 50;
    }
  });

  doc.end();
};

export const generateFeeReceiptPDF = (data: any, res: Response) => {
  const doc = new PDFDocument({ margin: 50 });
  doc.pipe(res);

  const school = data.student?.school;
  const student = data.student;

  // Header - School Details
  doc.fillColor('#1e293b').fontSize(24).font('Helvetica-Bold').text(school?.name || 'EduNexus Pro Institution', { align: 'center' });
  doc.fontSize(10).font('Helvetica').text(school?.address || 'Institutional Area, Tech Park, City', { align: 'center' });
  doc.text(`Contact: ${school?.phone || '+91 98765 43210'} | Email: ${school?.email || 'admin@edunexus.pro'}`, { align: 'center' });
  doc.moveDown(2);

  // Receipt Label
  doc.rect(50, 120, 500, 30).fill('#f1f5f9');
  doc.fillColor('#0f172a').fontSize(14).font('Helvetica-Bold').text('FEE PAYMENT RECEIPT', 50, 128, { align: 'center' });
  doc.moveDown(2);

  // info
  const startY = 170;
  doc.fontSize(10).font('Helvetica-Bold').text('RECEIPT DETAILS', 50, startY);
  doc.font('Helvetica');
  doc.text(`Invoice No: ${data.invoiceNumber || 'INV-'+data.id.slice(0,8).toUpperCase()}`, 50, startY + 20);
  doc.text(`Transaction ID: ${data.razorpayPaymentId || data.id}`, 50, startY + 35);
  doc.text(`Date: ${new Date(data.createdAt).toLocaleDateString()}`, 50, startY + 50);
  doc.text(`Payment Method: ${data.paymentMethod?.toUpperCase() || 'ONLINE'}`, 50, startY + 65);

  doc.font('Helvetica-Bold').text('STUDENT INFORMATION', 300, startY);
  doc.font('Helvetica');
  doc.text(`Name: ${student?.name}`, 300, startY + 20);
  doc.text(`Student ID: ${student?.studentId}`, 300, startY + 35);
  doc.text(`Class/Grade: ${student?.grade || 'N/A'}`, 300, startY + 50);

  doc.moveDown(6);

  // Table
  const tableY = 270;
  doc.rect(50, tableY, 500, 20).fill('#1e293b');
  doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(10);
  doc.text('Description', 60, tableY + 5);
  doc.text('Category', 300, tableY + 5);
  doc.text('Amount (₹)', 480, tableY + 5, { align: 'right', width: 60 });

  doc.fillColor('#0f172a').font('Helvetica');
  doc.text(`Academic Fee Payment - ${data.category?.toUpperCase() || 'GENERAL'}`, 60, tableY + 30);
  doc.text(data.category || 'Tuition', 300, tableY + 30);
  doc.text(data.amount.toLocaleString(), 480, tableY + 30, { align: 'right', width: 60 });

  doc.moveTo(50, tableY + 50).lineTo(550, tableY + 50).stroke('#e2e8f0');

  // Calculation
  const calcY = tableY + 70;
  const subtotal = data.amount - (data.gstAmount || 0);
  
  doc.text('Subtotal:', 400, calcY);
  doc.text(`₹ ${subtotal.toLocaleString()}`, 480, calcY, { align: 'right', width: 60 });

  doc.text('GST (18%):', 400, calcY + 20);
  doc.text(`₹ ${(data.gstAmount || 0).toLocaleString()}`, 480, calcY + 20, { align: 'right', width: 60 });

  doc.rect(380, calcY + 40, 170, 25).fill('#f8fafc');
  doc.fillColor('#1e293b').font('Helvetica-Bold');
  doc.text('TOTAL PAID:', 400, calcY + 48);
  doc.text(`₹ ${data.amount.toLocaleString()}`, 480, calcY + 48, { align: 'right', width: 60 });

  // Footer
  doc.moveDown(8);
  doc.fontSize(8).fillColor('#94a3b8').text('This is a computer-generated receipt and does not require a physical signature.', { align: 'center' });
  doc.text('Thank you for choosing EduNexus Pro.', { align: 'center' });

  doc.end();
};
