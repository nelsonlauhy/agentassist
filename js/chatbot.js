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

    // Define routing categories
    const contactKeywords = ['contact', 'reach', 'email'];
    const supportKeywords = ['help', 'issue', 'support', 'troubleshoot'];
    const generalKeywords = ['information', 'inquiry', 'details'];

    // Intent Classification and Routing
    if (userInputLower.includes('nelson') && contactKeywords.some(keyword => userInputLower.includes(keyword))) {
        return "I'm sorry, I don't have any specific contact information for \"Nelson.\" If you could provide more details or context, I may be able to assist you in finding the contact information you need.";
    } else if (contactKeywords.some(keyword => userInputLower.includes(keyword))) {
        return "It seems like you're looking for contact information. Could you please specify the name or organization you're trying to contact?";
    } else if (supportKeywords.some(keyword => userInputLower.includes(keyword))) {
        return "It seems like you need support. Could you please describe the issue you're facing so I can assist further?";
    } else if (generalKeywords.some(keyword => userInputLower.includes(keyword))) {
        return "It sounds like you have a general inquiry. How can I assist you with more details?";
    } else {
        // If the query doesn't match any predefined intent, fallback to AI-generated response
        const response = await fetch('/.netlify/functions/fetch-openai', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ prompt })
        });

        const data = await response.json();
        return data.message || "I'm not sure how to help with that. Could you clarify?";
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
