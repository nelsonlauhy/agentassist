let conversationHistory = [];

// Load existing conversation from localStorage
window.onload = function () {
    const savedConversation = localStorage.getItem('chatbotConversation');
    if (savedConversation) {
        conversationHistory = JSON.parse(savedConversation);
        conversationHistory.forEach(entry => displayMessage(entry.sender, entry.message));
    }
    document.getElementById('aa-chatbot-window').style.display = 'none'; // Ensure the window is hidden by default
};

document.getElementById('aa-user-input').addEventListener('keypress', function (e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault(); // Prevents the default newline behavior
        sendMessage();
    }
});

async function sendMessage() {
    const userInput = document.getElementById('aa-user-input').value.trim();
    if (!userInput) return;

    displayMessage('You', userInput);
    document.getElementById('aa-user-input').value = '';

    // Store user message in conversation history
    conversationHistory.push({ sender: 'You', message: userInput });

    // Save updated conversation to localStorage
    localStorage.setItem('chatbotConversation', JSON.stringify(conversationHistory));

    // Determine the intent and handle accordingly
    const intent = classifyIntent(userInput);
    let response;
    if (intent) {
        response = handleIntent(intent);
    } else {
        response = await getResponse(userInput);
    }

    displayMessage('Bot', response);

    // Store bot response in conversation history
    conversationHistory.push({ sender: 'Bot', message: response });

    // Save updated conversation to localStorage
    localStorage.setItem('chatbotConversation', JSON.stringify(conversationHistory));
}

function displayMessage(sender, message) {
    const chatbox = document.getElementById('aa-chatbox');
    const messageElement = document.createElement('p');
    messageElement.innerHTML = `<strong>${sender}:</strong> ${message}`;
    chatbox.appendChild(messageElement);
    chatbox.scrollTop = chatbox.scrollHeight;
}

// Function to classify the intent based on the user's input
function classifyIntent(userInput) {
    if (userInput.match(/(support contact|IT support contact|email for (IT )?support)/i)) {
        return 'it_support_contact';
    }
    return null; // Return null if no specific intent is matched
}

// Function to handle the intent and provide a response
function handleIntent(intent) {
    switch (intent) {
        case 'it_support_contact':
            return `
                IT Support<br>
                Email: itsupport@livingrealty.com<br>
                Direct line: (905) 752-3522
            `;
        default:
            return "I'm not sure how to help with that. Could you please clarify?";
    }
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
