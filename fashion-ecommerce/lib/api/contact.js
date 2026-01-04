import apiClient from "./client";
export async function createContactMessage(data) {
    return apiClient.post("/contact", data);
}
export async function getContactMessages(filters = {}) {
    const params = new URLSearchParams();
    if (filters.status)
        params.append("status", filters.status);
    if (filters.page)
        params.append("page", filters.page.toString());
    if (filters.limit)
        params.append("limit", filters.limit.toString());
    if (filters.search)
        params.append("search", filters.search);
    return apiClient.get(`/contact?${params.toString()}`);
}
export async function getContactMessage(id) {
    return apiClient.get(`/contact/${id}`);
}
export async function updateContactMessage(id, data) {
    return apiClient.put(`/contact/${id}`, data);
}
export async function deleteContactMessage(id) {
    return apiClient.delete(`/contact/${id}`);
}
