import fetch from "node-fetch";
import { getBearerToken } from './getToken.js';
import { getValidToken } from './tokenManager.js';
import { takeAnyReservation } from './takeReservation.js';
import { getAllPracticeExams, saveExamsToFile } from './examUtils.js';
// import { createAgent, fetchSchedule, handleResponse } from './apiService.js';
import https from 'https';
import {constants} from 'crypto';

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


const handleResponse = async (response) => {
    if (response.status !== 200) {
        console.log(`Request failed with status: ${response.status}`);
        return null;
    }

    const responseText = await response.text();
    
    try {
        return JSON.parse(responseText);
    } catch (parseError) {
        console.log("Failed to parse JSON response");
        return null;
    }
};

const processSchedule = async (schedule, bearerToken) => {
    console.log("Schedule data received");
    const exams = getAllPracticeExams(schedule.schedule.scheduledDays);

    saveExamsToFile(exams);
    // process.exit(0)
    // await takeAnyReservation(exams, bearerToken);
};

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));


export const startSearching = async () => {
    let bearerToken = await getValidToken();
    const agent = createAgent();

    while (true) {

        try {
            console.log("Fetching available exam slots...");
            const response = await fetchSchedule(bearerToken, agent);

            if (response.status === 401) {
                console.log("Token invalid (401), forcing refresh...");
                bearerToken = await getValidToken(true); // force = true

                    // Sprawdź czy to rate limiting czy expired token
                const rateLimitHeaders = [
                    'X-RateLimit-Remaining',
                    'X-RateLimit-Reset', 
                    'Retry-After'
                ];
                
                for (const header of rateLimitHeaders) {
                    if (response.headers.get(header)) {
                        console.log(`Rate limit header ${header}: ${response.headers.get(header)}`);
                    }
                }
                continue;
            }

            if (response.status === 429) {
                console.log("429 Too Many Requests - definite rate limiting");
                const retryAfter = response.headers.get('Retry-After');
                console.log(`Retry after: ${retryAfter} seconds`);
            }

            const schedule = await handleResponse(response);
            if (!schedule) {
                bearerToken = await getValidToken();
                continue;
            }

            await processSchedule(schedule, bearerToken);

            console.log("No available slots found - checking again in 5 seconds");
            await sleep(process.env.SLEEP);
            
        } catch (error) {
            console.log(`Error: ${error.message}`);
            await sleep(process.env.SLEEP);
        }
    }
};
