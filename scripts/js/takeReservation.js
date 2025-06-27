import fetch from "node-fetch";
import { sleep, logInfo } from './utils.js';

const takeReservation = async (practiceId, token) => {
    const response = await fetch(`https://info-car.pl/api/word/reservations`, {
        method: "POST",
        body: JSON.stringify({
            candidate: {
                category: process.env.CATEGORY,
                email: process.env.EMAIL,
                firstname: process.env.FIRST_NAME,
                lastname: process.env.LAST_NAME,
                pesel: process.env.PESEL,
                phoneNumber: process.env.PHONE_NUMBER,
                pkk: process.env.PKK_NUMBER
            },
            exam: {
                "organizationUnitId": process.env.WORDID,
                "practiceId": practiceId,
                "theoryId": null
            },
            languageAndOsk: {
                "language": "POLISH",
                "signLanguage": "NONE",
                "oskVehicleReservation": null
            }
        }),
        headers: {
            "Content-Type": "application/json",
            "Authorization": token
        }
    });

    logInfo(`Reservation response status: ${response.status}`);
};

const takeAnyReservation = async (exams, token) => {
    for (const exam of exams) {
        logInfo(`Trying: ${exam.day} at ${exam.time} (ID: ${exam.id})`);
        await takeReservation(exam.id, token);
        // mamy w exams poprostu same ID
        // logInfo(`Trying: ${exam}`);
        // await takeReservation(exam, token);
        // await new Promise(resolve => setTimeout(resolve, 500));
        if (exams.indexOf(exam) < exams.length - 1) {
            logInfo("Waiting 1s before next attempt...");
            await sleep(500); // 1 sekunda + losowość
        }
    }
};

export { takeAnyReservation };