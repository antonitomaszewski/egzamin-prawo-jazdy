import fetch from "node-fetch";
import { getBearerToken } from './getToken.js';
import { takeReservation } from './takeReservation.js';
import https from 'https';
import {constants} from 'crypto';
import fs from 'fs';

const createAgent = () => new https.Agent({
    rejectUnauthorized: false,
    secureOptions: constants.SSL_OP_ALLOW_BEAST,
    ciphers: 'DEFAULT:!DH',
});

const fetchSchedule = async (bearerToken, agent) => {
    const startDate = new Date(process.env.DATE_FROM);
    const endDate = new Date(process.env.DATE_TO);

    return fetch("https://info-car.pl/api/word/word-centers/exam-schedule", {
        method: 'PUT',
        agent: agent,
        body: JSON.stringify({
            category: "B",
            endDate: endDate.toISOString(),
            startDate: startDate.toISOString(),
            wordId: process.env.WORDID || "3"
        }),
        headers: {
            "Accept": "application/json, text/plain, */*",
            "Accept-Encoding": "gzip, deflate, br, zstd",
            "Accept-Language": "pl-PL",
            "Authorization": bearerToken,
            "Connection": "keep-alive",
            "Content-Type": "application/json",
            "DNT": "1",
            "Host": "info-car.pl",
            "Origin": "https://info-car.pl",
            "Referer": "https://info-car.pl/new/prawo-jazdy/zapisz-sie-na-egzamin-na-prawo-jazdy/wybor-terminu",
            "Sec-Fetch-Dest": "empty",
            "Sec-Fetch-Mode": "cors",
            "Sec-Fetch-Site": "same-origin",
            "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36",
            "sec-ch-ua": '"Google Chrome";v="129", "Not=A?Brand";v="8", "Chromium";v="129"',
            "sec-ch-ua-mobile": "?0",
            "sec-ch-ua-platform": '"Linux"'
        }
    });
};

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

export const startSearching = async () => {
    let bearerToken = await getBearerToken();
    const agent = createAgent();

    while (true) {

        try {
            console.log("Fetching available exam slots...");
            const response = await fetchSchedule(bearerToken, agent);
            const responseText = await response.text();

            if (response.status !== 200) {
                console.log(`Request failed with status: ${response.status}`);
                bearerToken = await getBearerToken();
                continue;
            }

            let schedule;
            try {
                schedule = JSON.parse(responseText);
            } catch (parseError) {
                console.log("Failed to parse JSON response - refreshing token...");
                bearerToken = await getBearerToken();
                continue;
            }

            console.log("Schedule data received");
            const earliestExam = findEarliestPracticeExam(schedule.schedule.scheduledDays);

            if (earliestExam) {
                console.log(`Found earliest practice exam:`);
                console.log(`Date: ${earliestExam.day} at ${earliestExam.time}`);
                console.log(`Available places: ${earliestExam.places}`);
                console.log(`Amount: ${earliestExam.amount} PLN`);
                console.log(`Exam ID: ${earliestExam.id}`);
                
                const examData = {
                    found: new Date().toISOString(),
                    exam: earliestExam
                };
                fs.writeFileSync('found-exam.json', JSON.stringify(examData, null, 2));
                
                await takeReservation(earliestExam.id, bearerToken);
                console.log("Reservation completed - exiting");
                process.exit(0);
            }

            console.log("No available slots found - checking again in 5 seconds");
            await new Promise(resolve => setTimeout(resolve, process.env.SLEEP));
        } catch (error) {
            console.log(`Error: ${error.message}`);
            await new Promise(resolve => setTimeout(resolve, process.env.SLEEP));
        }
    }
};
