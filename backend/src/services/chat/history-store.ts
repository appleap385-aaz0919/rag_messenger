import fs from 'fs/promises';
import path from 'path';
import type { Conversation, Message } from '../../types';

export class ChatHistoryStore {
    private historyPath: string;
    private conversations: Map<string, Conversation> = new Map();

    constructor() {
        this.historyPath = path.resolve(process.cwd(), 'data', 'chat_history.json');
    }

    async initialize(): Promise<void> {
        try {
            await fs.mkdir(path.dirname(this.historyPath), { recursive: true });
            const data = await fs.readFile(this.historyPath, 'utf-8');
            const json = JSON.parse(data);
            // Convert nested arrays/objects to Conversation type
            this.conversations = new Map(Object.entries(json));
            console.log(`[ChatHistory] Loaded ${this.conversations.size} conversations`);
        } catch (error) {
            console.log('[ChatHistory] No existing history found, starting fresh');
            // Create empty file if not exists
            await this.save();
        }
    }

    async save(): Promise<void> {
        try {
            const data = JSON.stringify(Object.fromEntries(this.conversations));
            await fs.writeFile(this.historyPath, data, 'utf-8');
        } catch (error) {
            console.error('[ChatHistory] Failed to save history:', error);
        }
    }

    async addMessage(conversationId: string, message: Message): Promise<void> {
        let conversation = this.conversations.get(conversationId);

        if (!conversation) {
            conversation = {
                id: conversationId,
                title: message.content.substring(0, 20) + '...',
                messages: [],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            } as Conversation;
            this.conversations.set(conversationId, conversation);
        }

        conversation!.messages.push(message);
        conversation!.updatedAt = new Date().toISOString();

        await this.save();
    }

    async getHistory(): Promise<Conversation[]> {
        return Array.from(this.conversations.values()).sort(
            (a, b) => new Date(String(b.updatedAt)).getTime() - new Date(String(a.updatedAt)).getTime()
        );
    }

    async getConversation(id: string): Promise<Conversation | undefined> {
        return this.conversations.get(id);
    }

    async clearHistory(): Promise<void> {
        this.conversations.clear();
        await this.save();
    }
}

export const chatHistoryStore = new ChatHistoryStore();
