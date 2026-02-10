import { ChromaClient, Collection } from 'chromadb';
import { embeddingsService } from '../embeddings/embeddings.factory';

export class ChromaService {
    private client: ChromaClient;
    private collection: Collection | null = null;
    private collectionName: string = 'jeffrey-documents';

    constructor() {
        this.client = new ChromaClient({
            path: process.env.CHROMA_URL || 'http://localhost:8000',
        });
    }

    async init() {
        try {
            this.collection = await this.client.getOrCreateCollection({
                name: this.collectionName,
                metadata: { "hnsw:space": "cosine" }
            });
            console.log(`ChromaDB Collection '${this.collectionName}' initialized`);
        } catch (error) {
            console.error('Failed to initialize ChromaDB collection:', error);
        }
    }

    async addDocuments(documents: { pageContent: string; metadata: any }[]) {
        if (!documents.length) return;
        if (!this.collection) await this.init();

        const texts = documents.map(doc => doc.pageContent);
        const metadatas = documents.map(doc => doc.metadata);
        const ids = documents.map((_, i) => `${Date.now()}-${i}-${Math.random().toString(36).substring(7)}`);

        // Get embeddings using our service
        const embeddings = await Promise.all(
            texts.map(text => embeddingsService.embedText(text).then(res => res.embedding))
        );
        // Optimization: Zhipu might support batch, but our interface is single/batch?
        // Let's use embedBatch if available or map. 
        // ZhipuEmbeddingsService has embedBatch. Generic interface might not?
        // Let's assume embeddingsService (factory return) has embedBatch or similar.
        // If not, use Promise.all. 

        /* 
           Note: We are using our own embedding service, NOT Chroma's builtin embedding function,
           because we want control over the provider (Zhipu/Ollama/OpenAI) via our factory.
        */

        try {
            await this.collection!.add({
                ids,
                embeddings,
                metadatas,
                documents: texts,
            });
            console.log(`Added ${documents.length} documents to ChromaDB`);
        } catch (error) {
            console.error('Error adding documents to ChromaDB:', error);
            throw error;
        }
    }

    async query(queryText: string, nResults: number = 5) {
        if (!this.collection) await this.init();

        const queryEmbedding = await embeddingsService.embedText(queryText);

        const results = await this.collection!.query({
            queryEmbeddings: [queryEmbedding.embedding],
            nResults,
        });

        return results;
    }
}

export const chromaService = new ChromaService();
