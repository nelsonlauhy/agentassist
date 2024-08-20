const fetch = require('node-fetch'); // Ensure you are using node-fetch v2

exports.handler = async function(event, context) {
    // Ensure the request method is POST
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ message: "Method Not Allowed" })
        };
    }

    try {
        // Parse the prompt from the request body
        const { prompt } = JSON.parse(event.body);

        if (!prompt) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: "Bad Request: Prompt is required." })
            };
        }

        // Fetch the API key from environment variables
        const apiKey = process.env.OPENAI_API_KEY;

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: "gpt-3.5-turbo",
                messages: [
                    { role: "system", content: "You are a helpful assistant." },
                    { role: "user", content: prompt }
                ],
                max_tokens: 100,
                temperature: 0.7
            })
        });

        const data = await response.json();

        // Handle unexpected API response structure
        if (data.choices && data.choices.length > 0) {
            return {
                statusCode: 200,
                body: JSON.stringify({ message: data.choices[0].message.content.trim() })
            };
        } else {
            console.error("Unexpected API response structure:", data);
            return {
                statusCode: 500,
                body: JSON.stringify({ message: "Sorry, I couldn't generate a response. Please try again." })
            };
        }

    } catch (error) {
        console.error("Error during API request:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: "There was an error processing your request. Please check the console for more details." })
        };
    }
};
