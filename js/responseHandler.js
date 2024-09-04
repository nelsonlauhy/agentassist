// responseHandler.js

export function handleIntent(intent, userInput) {
    switch (intent) {
        case 'it_support_contact':
            return getITSupportContact();
        // Add more cases here for different intents
        default:
            return "I'm not sure how to help with that. Could you please clarify?";
    }
}

function getITSupportContact() {
    return `
        IT Support<br>
        Email: itsupport@livingrealty.com<br>
        Direct line: (905) 752-3522
    `;
}
