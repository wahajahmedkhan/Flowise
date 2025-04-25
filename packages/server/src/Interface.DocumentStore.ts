import { ICommonObject } from 'flowise-components'
import { DocumentStore } from './database/entities/DocumentStore'
import { DataSource } from 'typeorm'
import { IComponentNodes } from './Interface'
import { Telemetry } from './utils/telemetry'
import { CachePool } from './CachePool'

export enum DocumentStoreStatus {
    EMPTY_SYNC = 'EMPTY',
    SYNC = 'SYNC',
    SYNCING = 'SYNCING',
    STALE = 'STALE',
    NEW = 'NEW',
    UPSERTING = 'UPSERTING',
    UPSERTED = 'UPSERTED'
}

export interface IDocumentStore {
    id: string
    name: string
    description: string
    loaders: string // JSON string
    whereUsed: string // JSON string
    updatedDate: Date
    createdDate: Date
    status: DocumentStoreStatus
    vectorStoreConfig: string | null // JSON string
    embeddingConfig: string | null // JSON string
    recordManagerConfig: string | null // JSON string
}

export interface IDocumentStoreFileChunk {
    id: string
    chunkNo: number
    docId: string
    storeId: string
    pageContent: string
    metadata: string
}

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

export interface IDocumentStoreLoader {
    id?: string
    loaderId?: string
    loaderName?: string
    loaderConfig?: any // JSON string
    splitterId?: string
    splitterName?: string
    splitterConfig?: any // JSON string
    totalChunks?: number
    totalChars?: number
    status?: DocumentStoreStatus
    storeId?: string
    files?: IDocumentStoreLoaderFile[]
    source?: string
    credential?: string
}

export interface IDocumentStoreLoaderForPreview extends IDocumentStoreLoader {
    rehydrated?: boolean
    preview?: boolean
    previewChunkCount?: number
}

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

export interface IDocumentStoreRefreshData {
    items: IDocumentStoreUpsertData[]
}

export interface IDocumentStoreLoaderFile {
    id: string
    name: string
    mimePrefix: string
    size: number
    status: DocumentStoreStatus
    uploaded: Date
}

export interface IDocumentStoreWhereUsed {
    id: string
    name: string
}

export interface IUpsertQueueAppServer {
    appDataSource: DataSource
    componentNodes: IComponentNodes
    telemetry: Telemetry
    cachePool?: CachePool
}

export interface IExecuteDocStoreUpsert extends IUpsertQueueAppServer {
    storeId: string
    totalItems: IDocumentStoreUpsertData[]
    files: Express.Multer.File[]
    isRefreshAPI: boolean
}

export interface IExecutePreviewLoader extends Omit<IUpsertQueueAppServer, 'telemetry'> {
    data: IDocumentStoreLoaderForPreview
    isPreviewOnly: boolean
    telemetry?: Telemetry
}

export interface IExecuteProcessLoader extends IUpsertQueueAppServer {
    data: IDocumentStoreLoaderForPreview
    docLoaderId: string
    isProcessWithoutUpsert: boolean
}

export interface IExecuteVectorStoreInsert extends IUpsertQueueAppServer {
    data: ICommonObject
    isStrictSave: boolean
    isVectorStoreInsert: boolean
}

const getFileName = (fileBase64: string) => {
    let fileNames = []
    if (fileBase64.startsWith('FILE-STORAGE::')) {
        const names = fileBase64.substring(14)
        if (names.includes('[') && names.includes(']')) {
            const files = JSON.parse(names)
            return files.join(', ')
        } else {
            return fileBase64.substring(14)
        }
    }
    if (fileBase64.startsWith('[') && fileBase64.endsWith(']')) {
        const files = JSON.parse(fileBase64)
        for (const file of files) {
            const splitDataURI = file.split(',')
            const filename = splitDataURI[splitDataURI.length - 1].split(':')[1]
            fileNames.push(filename)
        }
        return fileNames.join(', ')
    } else {
        const splitDataURI = fileBase64.split(',')
        const filename = splitDataURI[splitDataURI.length - 1].split(':')[1]
        return filename
    }
}

export const addLoaderSource = (loader: IDocumentStoreLoader, isGetFileNameOnly = false) => {
    let source = 'None'

    const handleUnstructuredFileLoader = (config: any, isGetFileNameOnly: boolean): string => {
        if (config.fileObject) {
            return isGetFileNameOnly ? getFileName(config.fileObject) : config.fileObject.replace('FILE-STORAGE::', '')
        }
        return config.filePath || 'None'
    }

    switch (loader.loaderId) {
        case 'pdfFile':
        case 'jsonFile':
        case 'csvFile':
        case 'file':
        case 'jsonlinesFile':
        case 'txtFile':
            source = isGetFileNameOnly
                ? getFileName(loader.loaderConfig?.[loader.loaderId])
                : loader.loaderConfig?.[loader.loaderId]?.replace('FILE-STORAGE::', '') || 'None'
            break
        case 'apiLoader':
            source = loader.loaderConfig?.url + ' (' + loader.loaderConfig?.method + ')'
            break
        case 'cheerioWebScraper':
        case 'playwrightWebScraper':
        case 'puppeteerWebScraper':
            source = loader.loaderConfig?.url || 'None'
            break
        case 'unstructuredFileLoader':
            source = handleUnstructuredFileLoader(loader.loaderConfig || {}, isGetFileNameOnly)
            break
        default:
            source = 'None'
            break
    }

    return source
}

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

    constructor() {}

    static fromEntity(entity: DocumentStore, usePlaceholders: boolean = true): DocumentStoreDTO {
        let documentStoreDTO = new DocumentStoreDTO()

        Object.assign(documentStoreDTO, entity)
        documentStoreDTO.id = entity.id
        documentStoreDTO.name = entity.name
        documentStoreDTO.description = entity.description
        documentStoreDTO.status = entity.status
        documentStoreDTO.totalChars = 0
        documentStoreDTO.totalChunks = 0

        if (entity.whereUsed) {
            documentStoreDTO.whereUsed = JSON.parse(entity.whereUsed)
        } else {
            documentStoreDTO.whereUsed = []
        }

        if (entity.vectorStoreConfig) {
            documentStoreDTO.vectorStoreConfig = JSON.parse(entity.vectorStoreConfig)
        }
        if (entity.embeddingConfig) {
            documentStoreDTO.embeddingConfig = JSON.parse(entity.embeddingConfig)
        }
        if (entity.recordManagerConfig) {
            documentStoreDTO.recordManagerConfig = JSON.parse(entity.recordManagerConfig)
        }

        if (entity.loaders) {
            documentStoreDTO.loaders = JSON.parse(entity.loaders)
            documentStoreDTO.loaders.map((loader) => {
                documentStoreDTO.totalChars += loader.totalChars || 0
                documentStoreDTO.totalChunks += loader.totalChunks || 0
                loader.source = addLoaderSource(loader)
                
                // Replace large base64 strings with dummy placeholders when listing all document stores
                if (usePlaceholders && loader.loaderConfig) {
                    // Handle different loader types
                    if (loader.loaderId === 'pdfFile' && loader.loaderConfig.pdfFile) {
                        if (loader.loaderConfig.pdfFile.startsWith('data:application/pdf;base64,')) {
                            loader.loaderConfig.pdfFile = 'data:application/pdf;base64,DUMMY_PDF_CONTENT'
                        }
                    } else if (loader.loaderId === 'jsonFile' && loader.loaderConfig.jsonFile) {
                        if (loader.loaderConfig.jsonFile.startsWith('data:application/json;base64,')) {
                            loader.loaderConfig.jsonFile = 'data:application/json;base64,DUMMY_JSON_CONTENT'
                        }
                    } else if (loader.loaderId === 'csvFile' && loader.loaderConfig.csvFile) {
                        if (loader.loaderConfig.csvFile.startsWith('data:text/csv;base64,')) {
                            loader.loaderConfig.csvFile = 'data:text/csv;base64,DUMMY_CSV_CONTENT'
                        }
                    } else if (loader.loaderId === 'txtFile' && loader.loaderConfig.txtFile) {
                        if (loader.loaderConfig.txtFile.startsWith('data:text/plain;base64,')) {
                            loader.loaderConfig.txtFile = 'data:text/plain;base64,DUMMY_TXT_CONTENT'
                        }
                    } else if (loader.loaderId === 'file' && loader.loaderConfig.file) {
                        if (loader.loaderConfig.file.startsWith('data:')) {
                            loader.loaderConfig.file = 'data:application/octet-stream;base64,DUMMY_FILE_CONTENT'
                        }
                    } else if (loader.loaderId === 'unstructuredFileLoader' && loader.loaderConfig.fileObject) {
                        if (loader.loaderConfig.fileObject.startsWith('data:')) {
                            loader.loaderConfig.fileObject = 'data:application/octet-stream;base64,DUMMY_FILE_CONTENT'
                        } else if (loader.loaderConfig.fileObject.startsWith('FILE-STORAGE::')) {
                            // Keep the filename but replace content
                            const filename = loader.loaderConfig.fileObject.split('::')[1]
                            loader.loaderConfig.fileObject = `FILE-STORAGE::${filename}`
                        }
                    }
                }
                
                if (loader.status !== 'SYNC') {
                    documentStoreDTO.status = DocumentStoreStatus.STALE
                }
            })
        }

        return documentStoreDTO
    }

    static fromEntities(entities: DocumentStore[], usePlaceholders: boolean = false): DocumentStoreDTO[] {
        return entities.map((entity) => this.fromEntity(entity, usePlaceholders))
    }

    static toEntity(body: any): DocumentStore {
        const docStore = new DocumentStore()
        Object.assign(docStore, body)
        docStore.loaders = '[]'
        docStore.whereUsed = '[]'
        // when a new document store is created, it is empty and in sync
        docStore.status = DocumentStoreStatus.EMPTY_SYNC
        return docStore
    }
}
