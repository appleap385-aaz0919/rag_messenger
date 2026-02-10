// @ts-ignore — optional dependency, not installed
import { HNSWLib } from "@langchain/community/vectorstores/hnswlib";
import { Document } from "@langchain/core/documents";
import { Embeddings } from "@langchain/core/embeddings";
import path from 'path';
import fs from 'fs/promises';
import { embeddingsService } from '../embeddings/embeddings.factory';

// Adaptor to make our EmbeddingsService compatible with LangChain's Embeddings interface
class LangChainEmbeddingsAdaptor extends Embeddings {
    constructor() {
        super({ maxConcurrency: 5 }); // Pass required params
    }

    async embedDocuments(documents: string[]): Promise<number[][]> {
        const results = await embeddingsService.embedBatch(documents);
        return results.map(r => r.embedding);
    }

    async embedQuery(document: string): Promise<number[]> {
        const result = await embeddingsService.embedText(document);
        return result.embedding;
    }
}

export class HnswService {
    private vectorStore: HNSWLib | null = null;
    private storageDir: string;
    private embeddings: LangChainEmbeddingsAdaptor;

    constructor() {
        this.storageDir = path.resolve(process.cwd(), 'data', 'hnsw');
        this.embeddings = new LangChainEmbeddingsAdaptor();
    }

    async init() {
        if (this.vectorStore) return;

        try {
            await fs.mkdir(this.storageDir, { recursive: true });

            const indexExists = await this.checkIndexExists();
            if (indexExists) {
                console.log('Loading existing HNSW index...');
                this.vectorStore = await HNSWLib.load(this.storageDir, this.embeddings);
            } else {
                console.log('Creating new HNSW index...');
                this.vectorStore = new HNSWLib(this.embeddings, { space: 'cosine' });
            }
        } catch (error) {
            console.error('Failed to initialize HNSWLib:', error);
            this.vectorStore = new HNSWLib(this.embeddings, { space: 'cosine' });
        }
    }

    private async checkIndexExists(): Promise<boolean> {
        try {
            await fs.access(path.join(this.storageDir, 'hnswlib.index'));
            return true;
        } catch {
            return false;
        }
    }

    async addDocuments(documents: { pageContent: string; metadata: any }[]) {
        if (!documents.length) return;

        if (!this.vectorStore) await this.init();

        const langchainDocs = documents.map(doc => new Document({
            pageContent: doc.pageContent,
            metadata: doc.metadata
        }));

        // HNSWLib needs to be initialized with dimensions if created empty
        // But wrapper usually handles it?
        // Let's protect against "vectorStore not fully init" or similar
        if (!this.vectorStore) {
            this.vectorStore = await HNSWLib.fromDocuments(langchainDocs, this.embeddings);
        } else {
            await this.vectorStore.addDocuments(langchainDocs);
        }

        await this.vectorStore.save(this.storageDir);
        console.log(`Added ${documents.length} documents to HNSW index and saved to ${this.storageDir}`);
    }

    async query(queryText: string, nResults: number = 5) {
        if (!this.vectorStore) await this.init();

        if (!this.vectorStore) {
            console.warn("Vector store not initialized or empty.");
            return [];
        }

        try {
            console.log(`Executing similarity search for: "${queryText}"`);
            const results = await this.vectorStore.similaritySearch(queryText, nResults);
            console.log(`Query returned ${results.length} results`);
            return results;
        } catch (e) {
            console.error("Query failed:", e);
            return [];
        }
    }
}

export const hnswService = new HnswService();
