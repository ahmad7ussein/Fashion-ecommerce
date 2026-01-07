import apiClient from "./client";

export const staffChatApi = {
  async getThreads() {
    return apiClient.get("/staff-chat/threads");
  },
  async getMessages(params) {
    const queryParams = new URLSearchParams();
    if (params?.employeeId) {
      queryParams.append("employeeId", params.employeeId);
    }
    if (params?.adminId) {
      queryParams.append("adminId", params.adminId);
    }
    const query = queryParams.toString();
    const endpoint = query ? `/staff-chat/messages?${query}` : "/staff-chat/messages";
    return apiClient.get(endpoint);
  },
  async sendMessage(payload) {
    return apiClient.post("/staff-chat/messages", payload);
  },
};
