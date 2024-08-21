// nlp.js

/**
 * Analyze the user input for specific intents and refine the prompt.
 * This includes routing for queries containing "email", "contact", or "reach".
 * 
 * @param {string} userInput - The raw input from the user.
 * @returns {object} - An object containing the intent and the refined prompt or search keywords.
 */
function analyzeUserInput(userInput) {
    // Lowercase the user input for easier comparison
    const lowerInput = userInput.toLowerCase();

    if (lowerInput.includes('email') || lowerInput.includes('contact') || lowerInput.includes('reach')) {
        // Extract the possible name from the input (basic keyword extraction)
        const nameMatch = userInput.match(/email for (.+)|reach (.+)|contact (.+)/i);
        const searchName = nameMatch ? nameMatch[1] || nameMatch[2] || nameMatch[3] : '';

        return {
            intent: 'search_contact',
            searchName: searchName.trim()
        };
    } else {
        // Default intent handling
        return {
            intent: 'general',
            refinedPrompt: userInput
        };
    }
}

/**
 * Handle the search for contact information in Firestore based on the extracted name.
 * 
 * @param {string} searchName - The name to search for in the directory collection.
 * @returns {Promise<string>} - The formatted search result.
 */
async function searchContactInfo(searchName) {
    try {
        const directoryRef = db.collection('directory');
        const snapshot = await directoryRef.get();

        // Store all entries in an array for manual searching
        const contactsArray = [];
        snapshot.forEach(doc => contactsArray.push(doc.data()));

        // Filter the array for matching names (basic search)
        const results = contactsArray.filter(contact => 
            contact.displayfullname.toLowerCase().includes(searchName.toLowerCase())
        );

        // Format the results
        if (results.length > 0) {
            let resultText = 'Here is the contact information I found:\n';
            results.forEach(contact => {
                resultText += `Name: ${contact.displayfullname}\n`;
                resultText += `Email: ${contact.email}\n`;
                resultText += `Title: ${contact.title}\n`;
                resultText += `Branch: ${contact.branch}\n\n`;
            });
            return resultText;
        } else {
            return `Sorry, I couldn't find any contact information for "${searchName}".`;
        }
    } catch (error) {
        console.error("Error searching contact information:", error);
        return "There was an error retrieving contact information. Please try again later.";
    }
}
