import configRoot from '../../../config.json';

interface LLMConfig {
  provider: 'ollama' | 'openai';
  model: string;
  baseUrl: string;
  apiKey?: string;
  temperature: number;
  maxTokens: number;
}

interface VectorStoreConfig {
  type: 'chromadb';
  path: string;
  collectionName: string;
}

interface EmbeddingsConfig {
  provider: 'ollama' | 'openai';
  model: string;
  apiKey?: string;
  baseUrl?: string;
}

interface ServerConfig {
  port: number;
  host: string;
}

interface ChunkingConfig {
  chunkSize: number;
  chunkOverlap: number;
}

interface FileWatcherConfig {
  enabled: boolean;
  debounceDelay: number;
}

interface AppConfig {
  server: ServerConfig;
  llm: LLMConfig;
  vectorStore: VectorStoreConfig;
  embeddings: EmbeddingsConfig;
  folders: string[];
  chunking: ChunkingConfig;
  fileWatcher: FileWatcherConfig;
  supportedFormats: string[];
  frontendUrl: string;
}

const config: AppConfig = {
  ...configRoot,
  llm: {
    ...configRoot.llm,
    provider: configRoot.llm.provider as 'ollama' | 'openai',
  },
  embeddings: {
    ...configRoot.embeddings,
    provider: configRoot.embeddings.provider as 'ollama' | 'openai',
  },
  vectorStore: {
    ...configRoot.vectorStore,
    type: configRoot.vectorStore.type as 'chromadb',
  },
  frontendUrl: 'http://localhost:3000',
};

export default config;
