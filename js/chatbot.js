import { firebaseConfig } from './config.js';
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.17.1/firebase-app.js';
import { getDatabase, ref, push, set, onValue } from 'https://www.gstatic.com/firebasejs/9.17.1/firebase-database.js';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

let conversationHistory = []; // Holds the conversation history in memory

async function sendMessage() {
    const userInput = document.getElementById('user-input').value;
    if (!userInput) return;

    displayMessage('You', userInput);
    document.getElementById('user-input').value = '';

    // Store user message in conversation history
    conversationHistory.push({ sender: 'You', message: userInput });

    const response = await getResponse(userInput);
    displayMessage('Bot', response);

    // Store bot response in conversation history
    conversationHistory.push({ sender: 'Bot', message: response });

    // Save the conversation to Firebase
    saveConversationToFirebase();
}

function displayMessage(sender, message) {
    const chatbox = document.getElementById('chatbox');
    const messageElement = document.createElement('p');
    messageElement.innerHTML = `<strong>${sender}:</strong> ${message}`;
    chatbox.appendChild(messageElement);
    chatbox.scrollTop = chatbox.scrollHeight;
}

async function getResponse(prompt) {
    // Convert user input to lowercase for case-insensitive comparison
    const userInputLower = prompt.toLowerCase();

    // Define intent categories with associated keywords
    const intentCategories = {
        contact: ['contact', 'reach', 'email'],
        support: ['help', 'issue', 'support', 'troubleshoot'],
        general: ['information', 'inquiry', 'details']
    };

    // Detect intent based on keywords
    const detectedIntent = Object.keys(intentCategories).find(intent =>
        intentCategories[intent].some(keyword => userInputLower.includes(keyword))
    );

    // Route the response based on the detected intent
    if (detectedIntent === 'contact') {
        return "It seems like you're looking for internal contact information.";
    } else if (detectedIntent === 'support') {
        return "It seems like you need internal support.";
    } else if (detectedIntent === 'general') {
        return "It sounds like you have a internal general inquiry.";
    } else {
        // If the query doesn't match any predefined intent, fallback to AI-generated response
        try {
            const response = await fetch('/.netlify/functions/fetch-openai', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ prompt })
            });

            const data = await response.json();
            return data.message || "I'm not sure how to help with that. Could you clarify?";
        } catch (error) {
            console.error("Error fetching response:", error);
            return "There was an error processing your request. Please check the console for more details.";
        }
    }
}



function formatPromptWithHistory(userInput) {
    // Create a prompt that includes the conversation history
    const formattedHistory = conversationHistory.map(entry => `${entry.sender}: ${entry.message}`).join('\n');
    return `${formattedHistory}\nYou: ${userInput}`;
}

function saveConversationToFirebase() {
    const conversationRef = ref(db, 'conversations');
    const newConversationRef = push(conversationRef);
    set(newConversationRef, conversationHistory);
}

function loadConversationFromFirebase() {
    const conversationRef = ref(db, 'conversations');
    onValue(conversationRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
            // Populate conversation history in memory
            conversationHistory = Object.values(data).flat();

            // Display the conversation in the chatbox
            conversationHistory.forEach(entry => displayMessage(entry.sender, entry.message));
        }
    });
}

// Load the conversation history when the page loads
loadConversationFromFirebase();
