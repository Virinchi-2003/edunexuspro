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
