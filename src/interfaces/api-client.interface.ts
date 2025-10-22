export interface IApiClient {
    get<T>(endpoint: string): Promise<T>;
    post<T>(endpoint: string, data?: any): Promise<T>;
    postFormData<T>(endpoint: string, formData: FormData): Promise<T>;
    delete<T>(endpoint: string): Promise<T>;
}