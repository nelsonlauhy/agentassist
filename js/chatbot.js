import { firebaseConfig } from './config.js';
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.17.1/firebase-app.js';
import { getFirestore, collection, query, where, getDocs, setDoc, doc, updateDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/9.17.1/firebase-firestore.js';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let conversationHistory = []; // Holds the conversation history in memory
let conversationDocId = null; // Store the document ID of the ongoing conversation

document.getElementById('user-input').addEventListener('keypress', function (e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault(); // Prevents the default newline behavior
        sendMessage();
    }
});

async function sendMessage() {
    const userInput = document.getElementById('user-input').value.trim();
    if (!userInput) return;

    displayMessage('You', userInput);
    document.getElementById('user-input').value = '';

    // Store user message in conversation history
    conversationHistory.push({ sender: 'You', message: userInput });

    // Check if the input is related to contact information
    if (isContactQuery(userInput)) {
        console.log("Contact query detected: Searching Firestore...");
        const contactInfo = await searchContactInFirestore(userInput);
        if (contactInfo) {
            displayMessage('Bot', contactInfo);
            conversationHistory.push({ sender: 'Bot', message: contactInfo });
            saveConversationToFirestore();
            return; // Stop further processing
        } else {
            const errorMessage = "Sorry, I couldn't find any contact information related to that name.";
            displayMessage('Bot', errorMessage);
            conversationHistory.push({ sender: 'Bot', message: errorMessage });
            saveConversationToFirestore();
            return; // Stop further processing
        }
    }

    // If not a contact query, proceed with regular OpenAI processing
    console.log("Sending query to OpenAI...");
    const response = await getResponse(userInput);
    displayMessage('Bot', response);

    // Store bot response in conversation history
    conversationHistory.push({ sender: 'Bot', message: response });

    // Save the conversation to Firestore
    saveConversationToFirestore();
}

function isContactQuery(userInput) {
    // Basic keyword matching for contact queries
    const contactKeywords = ["contact", "phone", "email", "number", "reach", "information"];
    const containsContactKeyword = contactKeywords.some(keyword => userInput.toLowerCase().includes(keyword));

    // Only proceed if a contact keyword is present
    if (containsContactKeyword) {
        console.log("Potential contact query detected:", userInput);
        return true;
    }
    return false;
}

async function searchContactInFirestore(userInput) {
    const nameKeywords = extractNameFromQuery(userInput);
    if (!nameKeywords) {
        console.log("Name extraction failed.");
        return null;
    }
    console.log("Searching for contact:", nameKeywords);

    try {
        const directoryRef = collection(db, 'directory');
        const q = query(directoryRef, where('displayname', '>=', nameKeywords), where('displayname', '<=', nameKeywords + '\uf8ff'));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            const doc = querySnapshot.docs[0]; // Get the first matched document
            const data = doc.data();
            console.log("Contact found:", data);
            return `Name: ${data.displayname}\nBranch: ${data.branch}\nTitle: ${data.title}\nEmail: ${data.email}`;
        } else {
            console.log("No contact found for:", nameKeywords);
            return null;
        }
    } catch (error) {
        console.error("Error searching for contact information:", error);
        return null;
    }
}

function extractNameFromQuery(userInput) {
    // Basic heuristic to extract name from the query
    const words = userInput.toLowerCase().split(" ");
    const nameIndex = words.findIndex(word => ["contact", "phone", "email", "reach", "information"].includes(word));
    if (nameIndex >= 0 && nameIndex < words.length - 1) {
        const extractedName = words.slice(nameIndex + 1).join(" ").trim();
        console.log("Extracted name:", extractedName);
        return extractedName;
    }
    console.log("No name extracted from query.");
    return null;
}

function displayMessage(sender, message) {
    const chatbox = document.getElementById('chatbox');
    const messageElement = document.createElement('p');
    messageElement.innerHTML = `<strong>${sender}:</strong> ${message.replace(/\n/g, "<br>")}`;
    chatbox.appendChild(messageElement);
    chatbox.scrollTop = chatbox.scrollHeight;
}

async function getResponse(prompt) {
    try {
        const response = await fetch('/.netlify/functions/fetch-openai', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ prompt: formatPromptWithHistory(prompt) })
        });

        const data = await response.json();

        if (data.message) {
            return data.message;
        } else {
            console.error("Unexpected response:", data);
            return "Sorry, I couldn't generate a response. Please try again.";
        }
    } catch (error) {
        console.error("Error fetching response:", error);
        return "There was an error processing your request. Please check the console for more details.";
    }
}

function formatPromptWithHistory(userInput) {
    // Create a prompt that includes the conversation history
    const formattedHistory = conversationHistory.map(entry => `${entry.sender}: ${entry.message}`).join('\n');
    return `${formattedHistory}\nYou: ${userInput}`;
}

function saveConversationToFirestore() {
    if (conversationDocId) {
        // If a document already exists, update it
        const conversationRef = doc(db, 'conversations', conversationDocId);
        updateDoc(conversationRef, {
            conversation: conversationHistory,
            timestamp: serverTimestamp()
        }).catch((error) => {
            console.error("Error updating conversation:", error);
        });
    } else {
        // Create a new document for this chat session
        const conversationRef = doc(collection(db, 'conversations'));
        setDoc(conversationRef, {
            conversation: conversationHistory,
            timestamp: serverTimestamp()
        }).then(() => {
            conversationDocId = conversationRef.id; // Store the document ID for future updates
        }).catch((error) => {
            console.error("Error saving conversation:", error);
        });
    }
}

function loadConversationFromFirestore() {
    // Optional: Load the latest conversation (if needed)
    const q = query(collection(db, 'conversations'), orderBy('timestamp', 'desc'), limit(1));
    getDocs(q).then((querySnapshot) => {
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            if (data.conversation) {
                conversationDocId = doc.id; // Store the document ID for future updates
                conversationHistory = data.conversation; // Populate conversation history in memory

                // Display the conversation in the chatbox
                conversationHistory.forEach(entry => displayMessage(entry.sender, entry.message));
            }
        });
    }).catch((error) => {
        console.error("Error loading conversation:", error);
    });
}

// Load the latest conversation history when the page loads
loadConversationFromFirestore();
