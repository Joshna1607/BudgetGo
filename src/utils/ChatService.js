import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

class ChatService {
    constructor() {
        this.client = null;
        this.tripId = null;
        this.callbacks = [];
    }

    connect(tripId, token, onMessageReceived) {
        this.tripId = tripId;
        this.callbacks.push(onMessageReceived); // Simple callback management

        this.client = new Client({
            webSocketFactory: () => new SockJS('http://localhost:8080/ws'), // Adjust URL as needed
            connectHeaders: {
                Authorization: `Bearer ${token}`
            },
            onConnect: () => {
                console.log('Connected to Chat WebSocket');
                this.subscribeToTrip(tripId);
            },
            onStompError: (frame) => {
                console.error('Broker reported error: ' + frame.headers['message']);
                console.error('Additional details: ' + frame.body);
            }
        });

        this.client.activate();
    }

    subscribeToTrip(tripId) {
        if (this.client && this.client.connected) {
            this.client.subscribe(`/topic/trip/${tripId}`, (message) => {
                const parsedMessage = JSON.parse(message.body);
                this.callbacks.forEach(cb => cb(parsedMessage));
            });
        }
    }

    sendMessage(content, senderId, senderName) {
        if (this.client && this.client.connected) {
            const chatMessage = {
                tripId: this.tripId,
                senderId: senderId,
                senderName: senderName,
                content: content
            };
            this.client.publish({
                destination: `/app/chat/${this.tripId}`,
                body: JSON.stringify(chatMessage)
            });
        } else {
            console.error('Chat is not connected');
        }
    }

    disconnect() {
        if (this.client) {
            this.client.deactivate();
        }
        this.callbacks = [];
    }
}

export default new ChatService();
