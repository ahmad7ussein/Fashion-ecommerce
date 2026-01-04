import apiClient from "./client";
export async function getNotifications(filters = {}) {
    const params = new URLSearchParams();
    if (filters.read !== undefined)
        params.append("read", filters.read.toString());
    if (filters.page)
        params.append("page", filters.page.toString());
    if (filters.limit)
        params.append("limit", filters.limit.toString());
    return apiClient.get(`/notifications?${params.toString()}`);
}
export async function markAsRead(id) {
    return apiClient.put(`/notifications/${id}/read`, {});
}
export async function markAllAsRead() {
    return apiClient.put("/notifications/read-all", {});
}
export async function deleteNotification(id) {
    return apiClient.delete(`/notifications/${id}`);
}
