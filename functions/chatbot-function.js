const fetch = require('node-fetch');

exports.handler = async function(event) {
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: 'Method Not Allowed',
        };
    }

    try {
        const { message } = JSON.parse(event.body);
        
        if (!message) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'No message provided' }),
            };
        }

        // Fetch response from OpenAI
        const response = await fetch('https://api.openai.com/v1/engines/text-davinci-003/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            },
            body: JSON.stringify({
                prompt: message,
                max_tokens: 100,
                n: 1,
                stop: null,
                temperature: 0.7,
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error ? data.error.message : 'Failed to fetch from OpenAI');
        }

        return {
            statusCode: 200,
            body: JSON.stringify({ response: data.choices[0].text.trim() }),
        };

    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'An error occurred while processing your request' }),
        };
    }
};