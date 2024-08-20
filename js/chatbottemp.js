// Import Firebase and Firestore
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.14.0/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/9.14.0/firebase-firestore.js";

// Import the configuration from config.js
import { OPENAI_API_KEY, firebaseConfig } from './config.js';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Generate a unique user ID for each session
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// Simulate or fetch a unique user ID (e.g., from Firebase Authentication or generate a UUID)
const userId = localStorage.getItem('userId') || generateUUID();
localStorage.setItem('userId', userId);

// Load previous conversation from Firestore and display it
async function loadPreviousConversation() {
    const conversationRef = doc(db, 'conversations', userId);
    const docSnap = await getDoc(conversationRef);

    if (docSnap.exists()) {
        const conversationHistory = docSnap.data().messages || [];
        const chatHistoryElement = document.getElementById("chatHistory");

        // Render the conversation history in the chat interface
        conversationHistory.forEach(message => {
            const messageElement = document.createElement("p");
            messageElement.innerHTML = `<b>${message.role === "user" ? "User" : "Bot"}:</b> ${message.content}`;
            chatHistoryElement.appendChild(messageElement);
        });
    }
}

async function getChatbotResponse(userInput) {
    // Fetch the existing conversation from Firestore (if it exists)
    const conversationRef = doc(db, 'conversations', userId);
    let conversationHistory = [];
    const docSnap = await getDoc(conversationRef);

    if (docSnap.exists()) {
        conversationHistory = docSnap.data().messages || [];
    }

    // Add user message to the conversation history
    conversationHistory.push({ role: "user", content: userInput });

    const url = 'https://api.openai.com/v1/chat/completions';
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: "gpt-3.5-turbo",
            messages: conversationHistory,
            max_tokens: 150
        })
    });

    if (!response.ok) {
        console.error("API request failed:", response.status, response.statusText);
        const errorResponse = await response.text();
        console.log("Error details:", errorResponse);
        return "Sorry, I couldn't reach the AI service right now. Please try again later.";
    }

    const data = await response.json();

    if (data.choices && data.choices.length > 0) {
        const botResponse = data.choices[0].message.content.trim();

        // Add bot response to the conversation history
        conversationHistory.push({ role: "assistant", content: botResponse });

        // Update the conversation history in Firestore
        await setDoc(conversationRef, { messages: conversationHistory });

        return botResponse;
    } else {
        console.error("Unexpected API response:", data);
        return "Sorry, I couldn't understand your request.";
    }
}

// Basic NLP using regex or sentiment analysis with JavaScript libraries
function analyzeInput(input) {
    if (/hello|hi|hey/.test(input.toLowerCase())) {
        return "Hello! How can I assist you today?";
    }
    // Add more intent recognition here...
    return null;
}

// Example of handling user input
document.getElementById("sendBtn").addEventListener("click", async () => {
    const userInput = document.getElementById("userInput").value;
    if (!userInput.trim()) return; // Ignore empty inputs

    const botResponse = await getChatbotResponse(userInput);
    // Display the conversation in the chat interface
    document.getElementById("chatHistory").innerHTML += `<p><b>User:</b> ${userInput}</p><p><b>Bot:</b> ${botResponse}</p>`;
    // Clear the input field
    document.getElementById("userInput").value = '';
});

// Load the previous conversation when the page loads
window.addEventListener("load", async () => {
    await loadPreviousConversation();
});
