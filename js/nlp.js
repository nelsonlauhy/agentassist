// nlp.js

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
            contact.displayfullname && // Check if displayfullname exists
            contact.displayfullname.toLowerCase().includes(searchName.toLowerCase())
        );

        // Format the results
        if (results.length > 0) {
            let resultText = 'Here is the contact information I found:\n';
            results.forEach(contact => {
                resultText += `Name: ${contact.displayfullname}\n`;
                resultText += `Email: ${contact.email || "N/A"}\n`; // Handle missing email
                resultText += `Title: ${contact.title || "N/A"}\n`; // Handle missing title
                resultText += `Branch: ${contact.branch || "N/A"}\n\n`; // Handle missing branch
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
