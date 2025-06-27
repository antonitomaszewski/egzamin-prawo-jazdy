import fetch from "node-fetch";
import https from 'https';
import {constants} from 'crypto';
import { logError, logWarn } from './utils.js';

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
        logWarn(`Request failed with status: ${response.status}`);
        return null;
    }

    const responseText = await response.text();
    
    try {
        return JSON.parse(responseText);
    } catch (parseError) {
        logError("Failed to parse JSON response");
        return null;
    }
};

export { createAgent, fetchSchedule, handleResponse };