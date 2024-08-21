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
    // Check for specific keywords in the user's input
    const contactKeywords = ['contact', 'reach', 'email', 'reach out'];
    const userInputLower = prompt.toLowerCase();

    if (userInputLower.includes('reach')) {
        return "It seems like you are trying to convey a message or ask a question. Could you please provide more context so I can better understand and assist you?";
    }

    if (contactKeywords.some(keyword => userInputLower.includes(keyword))) {
        return "internal resource routing";
    }

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
