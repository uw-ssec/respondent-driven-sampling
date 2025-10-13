export interface Result {
    readonly status: number;
    readonly message?: string;
}

export function generateError(message: string, status: number): Result {
    return {
        status: status,
        message: message,
    } as Result;
}

export interface ReadResult extends Result {
    readonly data: Record<string, any> | Record<string, any>[];
}

export interface CreateResult extends Result {
    readonly data: Record<string, any>;
}

export interface UpdateResult extends Result {
    readonly data: Record<string, any>;
}