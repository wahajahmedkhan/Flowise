# Document Store API Documentation

This document provides a detailed overview of the `/api/v1/document-store/store` endpoint in Flowise, including its models, DTOs, and all related functionality.

## Table of Contents

- [Introduction](#introduction)
- [API Endpoints](#api-endpoints)
- [Data Models](#data-models)
- [DTOs (Data Transfer Objects)](#dtos-data-transfer-objects)
- [Workflow](#workflow)
- [Security Considerations](#security-considerations)

## Introduction

The Document Store functionality in Flowise allows users to store, manage, and process documents for use in AI applications. It provides capabilities for:

- Creating and managing document stores
- Loading documents from various sources
- Chunking documents for efficient processing
- Embedding document chunks for vector search
- Querying document stores for relevant information

## API Endpoints

### Document Store Management

| Method | Endpoint | Description | Controller Function |
|--------|----------|-------------|---------------------|
| POST | `/document-store/store` | Create a new document store | `createDocumentStore` |
| GET | `/document-store/store` | List all document stores | `getAllDocumentStores` |
| GET | `/document-store/store/:id` | Get a specific document store by ID | `getDocumentStoreById` |
| PUT | `/document-store/store/:id` | Update a document store | `updateDocumentStore` |
| DELETE | `/document-store/store/:id` | Delete a document store | `deleteDocumentStore` |
| GET | `/document-store/store-configs/:id/:loaderId` | Get document store configurations | `getDocStoreConfigs` |

### Document Loaders and Chunks

| Method | Endpoint | Description | Controller Function |
|--------|----------|-------------|---------------------|
| GET | `/document-store/components/loaders` | Get all available document loaders | `getDocumentLoaders` |
| DELETE | `/document-store/loader/:id/:loaderId` | Delete a loader from a document store | `deleteLoaderFromDocumentStore` |
| POST | `/document-store/loader/preview` | Preview file chunks | `previewFileChunks` |
| POST | `/document-store/loader/save` | Save a processing loader | `saveProcessingLoader` |
| POST | `/document-store/loader/process/:loaderId` | Process a loader | `processLoader` |
| DELETE | `/document-store/chunks/:storeId/:loaderId/:chunkId` | Delete a specific file chunk | `deleteDocumentStoreFileChunk` |
| PUT | `/document-store/chunks/:storeId/:loaderId/:chunkId` | Edit a specific file chunk | `editDocumentStoreFileChunk` |
| GET | `/document-store/chunks/:storeId/:fileId/:pageNo` | Get file chunks with pagination | `getDocumentStoreFileChunks` |

### Vector Store Operations

| Method | Endpoint | Description | Controller Function |
|--------|----------|-------------|---------------------|
| POST | `/document-store/vectorstore/insert` | Insert chunks into vector store | `insertIntoVectorStore` |
| POST | `/document-store/vectorstore/save` | Save vector store configuration | `saveVectorStoreConfig` |
| DELETE | `/document-store/vectorstore/:storeId` | Delete data from vector store | `deleteVectorStoreFromStore` |
| POST | `/document-store/vectorstore/query` | Query the vector store | `queryVectorStore` |
| POST | `/document-store/vectorstore/update` | Update vector store configuration | `updateVectorStoreConfigOnly` |

### Component Providers

| Method | Endpoint | Description | Controller Function |
|--------|----------|-------------|---------------------|
| GET | `/document-store/components/embeddings` | Get all embedding providers | `getEmbeddingProviders` |
| GET | `/document-store/components/vectorstore` | Get all vector store providers | `getVectorStoreProviders` |
| GET | `/document-store/components/recordmanager` | Get all record manager providers | `getRecordManagerProviders` |

### Upsert and Refresh Operations

| Method | Endpoint | Description | Controller Function |
|--------|----------|-------------|---------------------|
| POST | `/document-store/upsert/` or `/document-store/upsert/:id` | Upsert document store | `upsertDocStoreMiddleware` |
| POST | `/document-store/refresh/` or `/document-store/refresh/:id` | Refresh document store | `refreshDocStoreMiddleware` |
| POST | `/document-store/generate-tool-desc/:id` | Generate tool description | `generateDocStoreToolDesc` |

## Data Models

### DocumentStore Entity

The main entity for storing document store information:

```typescript
@Entity()
export class DocumentStore implements IDocumentStore {
    @PrimaryGeneratedColumn('uuid')
    id: string

    @Column({ nullable: false, type: 'text' })
    name: string

    @Column({ nullable: true, type: 'text' })
    description: string

    @Column({ nullable: true, type: 'text' })
    loaders: string  // JSON string of loaders

    @Column({ nullable: true, type: 'text' })
    whereUsed: string  // JSON string of where used

    @Column({ type: 'timestamp' })
    @CreateDateColumn()
    createdDate: Date

    @Column({ type: 'timestamp' })
    @UpdateDateColumn()
    updatedDate: Date

    @Column({ nullable: false, type: 'text' })
    status: DocumentStoreStatus

    @Column({ nullable: true, type: 'text' })
    vectorStoreConfig: string | null  // JSON string

    @Column({ nullable: true, type: 'text' })
    embeddingConfig: string | null  // JSON string

    @Column({ nullable: true, type: 'text' })
    recordManagerConfig: string | null  // JSON string
}
```

### DocumentStoreFileChunk Entity

Entity for storing document chunks:

```typescript
@Entity()
export class DocumentStoreFileChunk implements IDocumentStoreFileChunk {
    @PrimaryGeneratedColumn('uuid')
    id: string

    @Index()
    @Column({ type: 'uuid' })
    docId: string

    @Index()
    @Column({ type: 'uuid' })
    storeId: string

    @Column()
    chunkNo: number

    @Column({ nullable: false, type: 'text' })
    pageContent: string

    @Column({ nullable: true, type: 'text' })
    metadata: string
}
```

## DTOs (Data Transfer Objects)

### DocumentStoreStatus Enum

```typescript
export enum DocumentStoreStatus {
    EMPTY_SYNC = 'EMPTY',
    SYNC = 'SYNC',
    SYNCING = 'SYNCING',
    STALE = 'STALE',
    NEW = 'NEW',
    UPSERTING = 'UPSERTING',
    UPSERTED = 'UPSERTED'
}
```

### IDocumentStore Interface

```typescript
export interface IDocumentStore {
    id: string
    name: string
    description: string
    loaders: string  // JSON string
    whereUsed: string  // JSON string
    updatedDate: Date
    createdDate: Date
    status: DocumentStoreStatus
    vectorStoreConfig: string | null  // JSON string
    embeddingConfig: string | null  // JSON string
    recordManagerConfig: string | null  // JSON string
}
```

### IDocumentStoreFileChunk Interface

```typescript
export interface IDocumentStoreFileChunk {
    id: string
    chunkNo: number
    docId: string
    storeId: string
    pageContent: string
    metadata: string
}
```

### IDocumentStoreFileChunkPagedResponse Interface

```typescript
export interface IDocumentStoreFileChunkPagedResponse {
    chunks: IDocumentStoreFileChunk[]
    count: number
    characters: number
    file?: IDocumentStoreLoader
    currentPage: number
    storeName: string
    description: string
    docId: string
}
```

### IDocumentStoreLoader Interface

```typescript
export interface IDocumentStoreLoader {
    id?: string
    loaderId?: string
    loaderName?: string
    loaderConfig?: any  // JSON string
    splitterId?: string
    splitterName?: string
    splitterConfig?: any  // JSON string
    totalChunks?: number
    totalChars?: number
    status?: DocumentStoreStatus
    storeId?: string
    files?: IDocumentStoreLoaderFile[]
    source?: string
    credential?: string
}
```

### IDocumentStoreLoaderForPreview Interface

```typescript
export interface IDocumentStoreLoaderForPreview extends IDocumentStoreLoader {
    rehydrated?: boolean
    preview?: boolean
    previewChunkCount?: number
}
```

### IDocumentStoreUpsertData Interface

```typescript
export interface IDocumentStoreUpsertData {
    docId: string
    metadata?: string | object
    replaceExisting?: boolean
    createNewDocStore?: boolean
    docStore?: IDocumentStore
    loader?: {
        name: string
        config: ICommonObject
    }
    splitter?: {
        name: string
        config: ICommonObject
    }
    vectorStore?: {
        name: string
        config: ICommonObject
    }
    embedding?: {
        name: string
        config: ICommonObject
    }
    recordManager?: {
        name: string
        config: ICommonObject
    }
}
```

### IDocumentStoreRefreshData Interface

```typescript
export interface IDocumentStoreRefreshData {
    items: IDocumentStoreUpsertData[]
}
```

### IDocumentStoreLoaderFile Interface

```typescript
export interface IDocumentStoreLoaderFile {
    id: string
    name: string
    mimePrefix: string
    size: number
    status: DocumentStoreStatus
    uploaded: Date
}
```

### IDocumentStoreWhereUsed Interface

```typescript
export interface IDocumentStoreWhereUsed {
    id: string
    name: string
}
```

### DocumentStoreDTO Class

The DTO for transforming between entity and response objects:

```typescript
export class DocumentStoreDTO {
    id: string
    name: string
    description: string
    files: IDocumentStoreLoaderFile[]
    whereUsed: IDocumentStoreWhereUsed[]
    createdDate: Date
    updatedDate: Date
    status: DocumentStoreStatus
    chunkOverlap: number
    splitter: string
    totalChunks: number
    totalChars: number
    chunkSize: number
    loaders: IDocumentStoreLoader[]
    vectorStoreConfig: any
    embeddingConfig: any
    recordManagerConfig: any

    // Methods for converting between entity and DTO
    static fromEntity(entity: DocumentStore): DocumentStoreDTO
    static fromEntities(entities: DocumentStore[]): DocumentStoreDTO[]
    static toEntity(body: any): DocumentStore
}
```

## Workflow

### Creating a Document Store

1. Client sends a POST request to `/document-store/store` with document store details
2. `createDocumentStore` controller validates the request and calls the service
3. `documentStoreService.createDocumentStore` creates a new DocumentStore entity
4. The new document store is saved to the database with status `EMPTY_SYNC`
5. The response is returned as a DocumentStoreDTO

### Loading Documents

1. Client sends a POST request to `/document-store/loader/preview` with document and loader details
2. `previewFileChunks` controller validates the request and calls the service
3. `documentStoreService.previewChunksMiddleware` processes the document with the specified loader
4. Document is split into chunks according to the splitter configuration
5. Preview chunks are returned to the client

### Processing Documents

1. Client sends a POST request to `/document-store/loader/process/:loaderId` with processing details
2. `processLoader` controller validates the request and calls the service
3. `documentStoreService.processLoaderMiddleware` processes the document with the specified loader
4. Document chunks are saved to the database
5. Document store status is updated

### Querying Vector Store

1. Client sends a POST request to `/document-store/vectorstore/query` with query details
2. `queryVectorStore` controller validates the request and calls the service
3. `documentStoreService.queryVectorStore` performs a vector search
4. Relevant document chunks are returned to the client

## Security Considerations

1. **Authentication**: All document store endpoints should be protected with proper authentication
2. **Authorization**: Access to document stores should be restricted based on user permissions
3. **Input Validation**: All inputs should be validated to prevent injection attacks
4. **Data Persistence**: Document data should be properly persisted with database volume mapping
5. **Error Handling**: Errors should be handled gracefully without exposing sensitive information

## Implementation Notes

- Document stores use PostgreSQL for data persistence
- File storage is managed through the file system
- Vector stores can be configured with various providers (e.g., Pinecone, Milvus, etc.)
- Embedding providers can be configured for vector embeddings (e.g., OpenAI, HuggingFace, etc.)
- Record managers track document versions and updates
