import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.17.1/firebase-app.js';
import { getFirestore, collection, getDocs, setDoc, doc, updateDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/9.17.1/firebase-firestore.js';

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCKTtDro4r4iQ4TwbblBGulGLDTHvp5Pu8",
    authDomain: "agentassist-72f8e.firebaseapp.com",
    databaseURL: "https://agentassist-72f8e-default-rtdb.firebaseio.com",
    projectId: "agentassist-72f8e",
    storageBucket: "agentassist-72f8e.appspot.com",
    messagingSenderId: "353344108954",
    appId: "1:353344108954:web:ee89b147ca641e63b5e223"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let conversationHistory = [];
let directoryData = [];
let conversationDocId = null;

document.getElementById('user-input').addEventListener('keypress', function (e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

window.onload = loadDirectoryData;

async function loadDirectoryData() {
    try {
        const directoryRef = collection(db, 'directory');
        const querySnapshot = await getDocs(directoryRef);

        directoryData = querySnapshot.docs.map(doc => doc.data());
        console.log('Directory data loaded:', directoryData);
    } catch (error) {
        console.error('Error loading directory data:', error);
    }
}

async function sendMessage() {
    const userInput = document.getElementById('user-input').value.trim();
    if (!userInput) return;

    displayMessage('You', userInput);
    document.getElementById('user-input').value = '';

    conversationHistory.push({ sender: 'You', message: userInput });

    if (isContactQuery(userInput)) {
        const contactInfo = searchContactInArray(userInput);
        if (contactInfo) {
            displayMessage('Bot', contactInfo);
            conversationHistory.push({ sender: 'Bot', message: contactInfo });
            saveConversationToFirestore();
            return;
        } else {
            const errorMessage = "Sorry, I couldn't find any contact information related to that name.";
            displayMessage('Bot', errorMessage);
            conversationHistory.push({ sender: 'Bot', message: errorMessage });
            saveConversationToFirestore();
            return;
        }
    }

    const response = await getResponse(userInput);
    displayMessage('Bot', response);

    conversationHistory.push({ sender: 'Bot', message: response });
    saveConversationToFirestore();
}

function isContactQuery(userInput) {
    const contactKeywords = ["contact", "phone", "email", "number", "reach", "information"];
    return contactKeywords.some(keyword => userInput.toLowerCase().includes(keyword));
}

function searchContactInArray(userInput) {
    const searchTerm = extractNameFromQuery(userInput).toLowerCase();
    if (!searchTerm) return null;

    const filteredResults = directoryData.filter(contact =>
        contact.displayname && contact.displayname.toLowerCase().includes(searchTerm)
    );

    if (filteredResults.length > 0) {
        const data = filteredResults[0];
        return `
        <div style="margin-bottom: 20px; border: 1px solid #ccc; padding: 10px;">
            <p><strong>Name:</strong> ${data.displayname}</p>
            <p><strong>Branch:</strong> ${data.branch}</p>
            <p><strong>Title:</strong> ${data.title}</p>
            <p><strong>Email:</strong> ${data.email}</p>
            <p><strong>Direct Tel:</strong> ${data.directTel}</p>
            <p><strong>Personal Tel:</strong> ${data.personalTel}</p>
            <p><strong>Ext:</strong> ${data.ext}</p>
        </div>
        `;
    }
    return null;
}

function extractNameFromQuery(userInput) {
    const words = userInput.split(" ");
    const nameIndex = words.findIndex(word => ["contact", "phone", "email", "reach", "information"].includes(word.toLowerCase()));

    if (nameIndex >= 0 && nameIndex < words.length - 1) {
        return words.slice(nameIndex + 1).join(" ").trim();
    }
    return "";
}

function displayMessage(sender, message) {
    const chatbox = document.getElementById('chatbox');
    const messageElement = document.createElement('p');
    messageElement.innerHTML = `<strong>${sender}:</strong> ${message.replace(/\n/g, "<br>")}`;
    chatbox.appendChild(messageElement);
    chatbox.scrollTop = chatbox.scrollHeight;
}

// The remaining functions such as getResponse, saveConversationToFirestore, etc., would stay the same as in your original code.
