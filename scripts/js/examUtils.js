import fs from 'fs';
import { logInfo, logError } from './utils.js';

const findEarliestPracticeExam = (scheduledDays) => {
    let earliestExam = null;
    let earliestDate = null;

    for (const day of scheduledDays) {
        for (const hour of day.scheduledHours) {
            if (hour.practiceExams && hour.practiceExams.length > 0) {
                for (const exam of hour.practiceExams) {
                    const examDate = new Date(exam.date);

                    const dateFrom = new Date(process.env.DATE_FROM);
                    const dateTo = new Date(process.env.DATE_TO);
                    
                    if (examDate >= dateFrom && examDate <= dateTo) {
                        if (!earliestDate || examDate < earliestDate) {
                            earliestDate = examDate;
                            earliestExam = {
                                ...exam,
                                day: day.day,
                                time: hour.time
                            };
                        }
                    }
                }
            }
        }
    }

    return earliestExam;
};


const getAllPracticeExams = (scheduledDays) => {
    logInfo(`Processing scheduledDays: ${scheduledDays?.length || 0} days`);
    
    const allExams = [];
    const dateFrom = new Date(process.env.DATE_FROM);
    const dateTo = new Date(process.env.DATE_TO);

    for (const day of scheduledDays) {
        // logInfo(`Processing day: ${day.day}, hours: ${day.scheduledHours?.length || 0}`);
        
        for (const hour of day.scheduledHours) {
            if (hour.practiceExams && hour.practiceExams.length > 0) {
                // logInfo(`Found ${hour.practiceExams.length} practice exams at ${hour.time}`);
                
                for (const exam of hour.practiceExams) {
                    const examDate = new Date(exam.date);
                    
                    if (examDate >= dateFrom && examDate <= dateTo) {
                        logInfo(`Exam: ${exam.id}, date: ${exam.date}, in range: ${examDate >= dateFrom && examDate <= dateTo}`);
                        // allExams.push(exam.id);
                        allExams.push({
                            ...exam,
                            // id: exam.id,
                            day: day.day,
                            time: hour.time,
                            // date: exam.date
                        });
                    }
                }
            }
        }
    }

    logInfo(`Total practice exams found: ${allExams.length}`);
    return allExams.sort((a, b) => new Date(a.date) - new Date(b.date));
    return allExams
};

const saveExamsToFile = (exams) => {
    logInfo(`Saving exams to file, count: ${exams.length}`);
    
    if (exams.length > 0) {
        const examData = {
            timestamp: new Date().toISOString(),
            count: exams.length,
            exams: exams
        };
        
        try {
            fs.writeFileSync('all-exams.json', JSON.stringify(examData, null, 2));
            logInfo(`Found ${exams.length} exams - saved to all-exams.json`);
        } catch (error) {
            logError('Failed to save exams to file');
        }
    } else {
        logInfo("No exams found in date range");
    }
};

export { getAllPracticeExams, saveExamsToFile };