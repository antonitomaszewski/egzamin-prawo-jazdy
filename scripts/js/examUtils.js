import fs from 'fs';

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
    console.log("Processing scheduledDays:", scheduledDays?.length || 0, "days");
    
    const allExams = [];
    const dateFrom = new Date(process.env.DATE_FROM);
    const dateTo = new Date(process.env.DATE_TO);

    for (const day of scheduledDays) {
        // console.log(`Processing day: ${day.day}, hours: ${day.scheduledHours?.length || 0}`);
        
        for (const hour of day.scheduledHours) {
            if (hour.practiceExams && hour.practiceExams.length > 0) {
                // console.log(`Found ${hour.practiceExams.length} practice exams at ${hour.time}`);
                
                for (const exam of hour.practiceExams) {
                    const examDate = new Date(exam.date);
                    
                    if (examDate >= dateFrom && examDate <= dateTo) {
                        console.log(`Exam: ${exam.id}, date: ${exam.date}, in range: ${examDate >= dateFrom && examDate <= dateTo}`);
                        // allExams.push(exam.id);
                        allExams.push({
                            id: exam.id,
                            day: day.day,
                            time: hour.time
                        });
                    }
                }
            }
        }
    }

    console.log(`Total exams found: ${allExams.length}`);
    return allExams.sort((a, b) => new Date(a.date) - new Date(b.date));
    return allExams
};

const saveExamsToFile = (exams) => {
    console.log("Saving exams to file, count:", exams.length);
    console.log("First exam:", exams); // Debug pierwszego egzaminu
    
    if (exams.length > 0) {
        const examData = {
            timestamp: new Date().toISOString(),
            count: exams.length,
            exams: exams
        };
        
        try {
            fs.writeFileSync('all-exams.json', JSON.stringify(examData, null, 2));
            console.log(`Found ${exams.length} exams - saved to all-exams.json`);
        } catch (error) {
            console.log('Failed to save exams to file');
        }
    } else {
        console.log("No exams found in date range");
    }
};

export { getAllPracticeExams, saveExamsToFile };