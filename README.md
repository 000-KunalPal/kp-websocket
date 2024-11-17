Overview

This repository contains the WebSocket server implementation for real-time collaboration features. Built using Deno2, the server facilitates seamless real-time communication for the frontend built with Next.js.
Features

Below are the core services planned for this WebSocket server:

    Live Cursor Tracking
        Tracks and displays the cursor position of all connected users in real time.
        Status: Almost completed (Rate limiting and authentication are pending).

    Content Locking
        Prevents multiple users from editing the same section of content simultaneously.
        Allows users to see who is currently editing a specific part of the document.

    Real-Time Chat
        Enables users to send and receive instant messages within a workspace or document.
        Supports typing indicators and message history retrieval.

    Collaborative Text Editing
        Provides real-time text synchronization between multiple users editing a document.
        Conflict resolution strategies to ensure smooth collaboration.

    Presence Tracking
        Tracks which users are online, idle, or offline in real-time.
        Displays user status in the UI for enhanced collaboration awareness.

    Annotations and Comments
        Allows users to add, edit, and delete comments or annotations on specific sections of the document.
        Real-time updates ensure all collaborators are on the same page.

    Notification System
        Sends real-time notifications for events like joining/leaving a session, content locking, or new messages.
        Helps users stay informed without overwhelming them with alerts.

Key Technologies

    Deno2 for the WebSocket server backend.
    Next.js for the frontend services.
    WebSocket Protocol for efficient real-time communication.

Roadmap

    Complete authentication and rate-limiting for all WebSocket connections.
    Implement robust error handling and reconnection strategies.
    Finalize and integrate all planned features.
    Conduct extensive testing for scalability and performance.

Feel free to contribute or report issues in this repository to help improve the system!
