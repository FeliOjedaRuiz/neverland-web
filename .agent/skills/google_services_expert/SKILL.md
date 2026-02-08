---
name: Google Services Expert
description: Expert knowledge and utilities for integrating Google Services (Calendar, Maps, Gemini, etc.) and exposing them as MCP tools.
---

# Google Services Expert Skill

## Overview

This skill provides comprehensive instructions on integrating various Google Cloud Platform (GCP) services (Google Calendar, Google Maps, Gemini) into web applications. It also covers how to expose these functionalities through the Model Context Protocol (MCP) to make them accessible to AI agents.

## Prerequisites

- A Google Cloud Platform (GCP) project.
- Enabling relevant APIs in the Google Cloud Console.
- Creating appropriate credentials (API Keys, OAuth 2.0 Client IDs, Service Accounts).
- Installing the `googleapis` library for Node.js: `npm install googleapis`.
- Installing the `@google/generative-ai` library for Gemini: `npm install @google/generative-ai`.
- Installing `@modelcontextprotocol/sdk` for MCP integration.

## 1. Google Calendar Integration

### Authentication (OAuth 2.0 vs Service Account)

- **OAuth 2.0**: Best for accessing user calendars (requires user login).
- **Service Account**: Best for backend processing or accessing a specific application calendar without user intervention.

### Setup

1. Enable the **Google Calendar API** in GCP Console.
2. Create credentials (OAuth 2.0 Client ID or Service Account Key).
3. If using Service Account, share the target calendar with the Service Account email.

### Code Example (Node.js with Service Account)

```javascript
const { google } = require('googleapis');
const path = require('path');

const KEYFILE_PATH = path.join(__dirname, 'service-account.json');
const SCOPES = ['https://www.googleapis.com/auth/calendar'];

const auth = new google.auth.GoogleAuth({
	keyFile: KEYFILE_PATH,
	scopes: SCOPES,
});

const calendar = google.calendar({ version: 'v3', auth });

async function listEvents() {
	const res = await calendar.events.list({
		calendarId: 'primary', // or specific calendar ID
		timeMin: new Date().toISOString(),
		maxResults: 10,
		singleEvents: true,
		orderBy: 'startTime',
	});
	return res.data.items;
}
```

## 2. Google Maps Integration

### Setup

1. Enable the following APIs:
   - **Maps JavaScript API** (Frontend)
   - **Places API** (Backend/Frontend)
   - **Geocoding API** (Backend)
   - **Directions API** (Backend)
2. Create an API Key and restrict it to your domain (frontend) or IP (backend).

### Frontend Integration (React)

Use `@react-google-maps/api` for React applications.

```javascript
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';

const containerStyle = {
	width: '100%',
	height: '400px',
};

const center = {
	lat: -3.745,
	lng: -38.523,
};

function MyMap() {
	const { isLoaded } = useJsApiLoader({
		id: 'google-map-script',
		googleMapsApiKey: 'YOUR_API_KEY',
	});

	return isLoaded ? (
		<GoogleMap mapContainerStyle={containerStyle} center={center} zoom={10}>
			<Marker position={center} />
		</GoogleMap>
	) : (
		<></>
	);
}
```

## 3. Gemini (Generative AI) Integration

### Setup

1. Enable the **Google AI Studio** API access.
2. Get an API Key from Google AI Studio.

### Code Example (Node.js)

```javascript
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function runGemini(prompt) {
	const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
	const result = await model.generateContent(prompt);
	const response = await result.response;
	const text = response.text();
	console.log(text);
	return text;
}
```

## 4. MCP (Model Context Protocol) Integration

To expose these Google services as tools for an AI agent, you can wrap them in an MCP server.

### Basic MCP Server Structure

```javascript
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
	CallToolRequestSchema,
	ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

// Initialize the server
const server = new Server(
	{
		name: 'google-services-mcp',
		version: '1.0.0',
	},
	{
		capabilities: {
			tools: {},
		},
	},
);

// Define available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
	return {
		tools: [
			{
				name: 'list_calendar_events',
				description: 'List upcoming events from the primary calendar',
				inputSchema: {
					type: 'object',
					properties: {
						maxResults: {
							type: 'number',
							description: 'Number of events to list',
						},
					},
				},
			},
			{
				name: 'get_location_details',
				description: 'Get details about a location using Google Places API',
				inputSchema: {
					type: 'object',
					properties: {
						query: {
							type: 'string',
							description: 'The location to search for',
						},
					},
					required: ['query'],
				},
			},
		],
	};
});

// Handle tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
	switch (request.params.name) {
		case 'list_calendar_events': {
			// Logic to call Google Calendar API
			// const events = await listEvents(request.params.arguments.maxResults);
			return {
				content: [{ type: 'text', text: JSON.stringify(events) }],
			};
		}
		case 'get_location_details': {
			// Logic to call Google Places API
			return {
				content: [{ type: 'text', text: 'Location details...' }],
			};
		}
		default:
			throw new Error('Tool not found');
	}
});

// Connect transport
const transport = new StdioServerTransport();
await server.connect(transport);
```

### Best Practices for MCP

- **State Management**: Keep API clients initialized in the global scope of the server.
- **Error Handling**: Gracefully handle API errors (e.g., quota limits, authentication failures) and return meaningful error messages to the agent.
- **Security**: Never hardcode API keys. Use environment variables. Use OAuth 2.0 flow for user-specific data access if the MCP server runs locally for a user.

## Common Issues & Troubleshooting

- **"APINotEnabled"**: Ensure the specific API is enabled in the Google Cloud Console for your project.
- **"InvalidCredentials"**: Check if the API key or Service Account JSON file is correct and accessible.
- **CORS Errors**: When using Google Maps or other APIs from the browser, ensure your domain is whitelisted in the API Key restrictions. For server-side APIs, call them from your backend, not the frontend, to avoid exposing secrets.
